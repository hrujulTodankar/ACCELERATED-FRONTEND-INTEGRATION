/**
 * Enhanced API Gateway with Integration Patterns
 * Implements load balancing, authentication, rate limiting, circuit breakers,
 * service discovery, and comprehensive monitoring
 */

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/gateway-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/gateway-combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Configuration
const config = {
  port: process.env.PORT || 8080,
  jwtSecret: process.env.JWT_SECRET || 'enhanced-gateway-secret',
  rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
  rateLimitMaxRequests: 100, // limit each IP to 100 requests per windowMs
  circuitBreakerThreshold: 50, // percentage
  circuitBreakerTimeout: 30000, // 30 seconds
  healthCheckInterval: 30000, // 30 seconds
  loadBalancerStrategy: 'round-robin', // 'round-robin', 'least-connections', 'weighted'
};

// Service registry
class ServiceRegistry {
  constructor() {
    this.services = new Map();
    this.healthChecks = new Map();
    this.loadBalancers = new Map();
    this.initializeServices();
  }

  initializeServices() {
    // Register BHIV Core Service
    this.registerService('bhiv-core', [
      { id: 'bhiv-core-1', url: process.env.BHIV_CORE_URL_1 || 'http://localhost:8001', weight: 1 },
      { id: 'bhiv-core-2', url: process.env.BHIV_CORE_URL_2 || 'http://localhost:8001', weight: 1 }
    ]);

    // Register Adaptive Tagging Service
    this.registerService('adaptive-tags', [
      { id: 'adaptive-tags-1', url: process.env.ADAPTIVE_TAGS_URL || 'http://localhost:8002', weight: 1 }
    ]);

    // Register Insight Bridge Service
    this.registerService('insight-bridge', [
      { id: 'insight-bridge-1', url: process.env.INSIGHT_BRIDGE_URL || 'http://localhost:8003', weight: 1 }
    ]);
  }

  registerService(name, instances) {
    this.services.set(name, {
      name,
      instances,
      currentIndex: 0,
      lastHealthCheck: null,
      status: 'unknown'
    });

    // Initialize load balancer for this service
    this.loadBalancers.set(name, new LoadBalancer(instances));
    
    // Start health checks
    this.startHealthChecks(name);
  }

  getService(name) {
    return this.services.get(name);
  }

  getHealthyInstances(name) {
    const service = this.services.get(name);
    if (!service) return [];

    return service.instances.filter(instance => {
      const healthStatus = this.healthChecks.get(instance.id);
      return healthStatus && healthStatus.healthy;
    });
  }

  selectInstance(name) {
    const service = this.services.get(name);
    if (!service) return null;

    const healthyInstances = this.getHealthyInstances(name);
    if (healthyInstances.length === 0) {
      logger.warn(`No healthy instances for service ${name}`);
      return null;
    }

    const loadBalancer = this.loadBalancers.get(name);
    return loadBalancer.selectInstance(healthyInstances);
  }

  startHealthChecks(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) return;

    const checkInterval = setInterval(async () => {
      for (const instance of service.instances) {
        try {
          const response = await axios.get(`${instance.url}/health`, { timeout: 5000 });
          const healthy = response.status === 200;
          
          this.healthChecks.set(instance.id, {
            healthy,
            lastCheck: new Date(),
            responseTime: response.headers['x-response-time'] || 0,
            error: null
          });

          if (healthy) {
            logger.debug(`Health check passed for ${instance.id}`);
          } else {
            logger.warn(`Health check failed for ${instance.id}`);
          }
        } catch (error) {
          this.healthChecks.set(instance.id, {
            healthy: false,
            lastCheck: new Date(),
            responseTime: 0,
            error: error.message
          });
          
          logger.error(`Health check error for ${instance.id}:`, error.message);
        }
      }
    }, config.healthCheckInterval);

    service.healthCheckInterval = checkInterval;
  }
}

// Load Balancer
class LoadBalancer {
  constructor(instances) {
    this.instances = instances;
    this.currentIndex = 0;
    this.connectionCounts = new Map();
  }

  selectInstance(instances) {
    if (instances.length === 0) return null;

    switch (config.loadBalancerStrategy) {
      case 'round-robin':
        return this.roundRobin(instances);
      case 'least-connections':
        return this.leastConnections(instances);
      case 'weighted':
        return this.weighted(instances);
      default:
        return this.roundRobin(instances);
    }
  }

  roundRobin(instances) {
    const instance = instances[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % instances.length;
    return instance;
  }

  leastConnections(instances) {
    let selectedInstance = instances[0];
    let minConnections = this.connectionCounts.get(selectedInstance.id) || 0;

    for (const instance of instances) {
      const connections = this.connectionCounts.get(instance.id) || 0;
      if (connections < minConnections) {
        minConnections = connections;
        selectedInstance = instance;
      }
    }

    return selectedInstance;
  }

  weighted(instances) {
    const totalWeight = instances.reduce((sum, instance) => sum + (instance.weight || 1), 0);
    let random = Math.random() * totalWeight;
    
    for (const instance of instances) {
      random -= (instance.weight || 1);
      if (random <= 0) {
        return instance;
      }
    }
    
    return instances[0]; // Fallback
  }

  incrementConnections(instanceId) {
    const count = this.connectionCounts.get(instanceId) || 0;
    this.connectionCounts.set(instanceId, count + 1);
  }

  decrementConnections(instanceId) {
    const count = this.connectionCounts.get(instanceId) || 0;
    if (count > 0) {
      this.connectionCounts.set(instanceId, count - 1);
    }
  }
}

// Circuit Breaker
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 50;
    this.timeout = options.timeout || 30000;
    this.monitor = new Map();
  }

  async execute(operationId, operation) {
    const state = this.monitor.get(operationId) || {
      failures: 0,
      successes: 0,
      lastFailureTime: null,
      state: 'CLOSED' // CLOSED, OPEN, HALF_OPEN
    };

    // Check if circuit should transition from OPEN to HALF_OPEN
    if (state.state === 'OPEN') {
      if (Date.now() - state.lastFailureTime > this.timeout) {
        state.state = 'HALF_OPEN';
        this.monitor.set(operationId, state);
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      
      // Success
      if (state.state === 'HALF_OPEN') {
        state.state = 'CLOSED';
        state.failures = 0;
      }
      state.successes++;
      this.monitor.set(operationId, state);
      
      return result;
    } catch (error) {
      // Failure
      state.failures++;
      state.lastFailureTime = Date.now();
      
      const totalRequests = state.failures + state.successes;
      const failureRate = totalRequests > 0 ? (state.failures / totalRequests) * 100 : 0;
      
      if (failureRate >= this.failureThreshold) {
        state.state = 'OPEN';
        logger.warn(`Circuit breaker opened for ${operationId} due to high failure rate: ${failureRate}%`);
      }
      
      this.monitor.set(operationId, state);
      throw error;
    }
  }

  getStatus(operationId) {
    return this.monitor.get(operationId) || { state: 'CLOSED', failures: 0, successes: 0 };
  }
}

// Rate Limiter with Redis-like functionality
class RateLimiter {
  constructor() {
    this.requests = new Map();
  }

  isAllowed(key, limit, windowMs) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }
    
    const userRequests = this.requests.get(key);
    
    // Remove old requests outside the window
    while (userRequests.length > 0 && userRequests[0] < windowStart) {
      userRequests.shift();
    }
    
    // Check if limit exceeded
    if (userRequests.length >= limit) {
      return false;
    }
    
    // Add current request
    userRequests.push(now);
    return true;
  }

  cleanup() {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour
    
    for (const [key, requests] of this.requests.entries()) {
      // Remove old entries
      while (requests.length > 0 && requests[0] < now - maxAge) {
        requests.shift();
      }
      
      // Remove empty entries
      if (requests.length === 0) {
        this.requests.delete(key);
      }
    }
  }
}

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, config.jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Authorization Middleware
const authorize = (requiredPermissions) => {
  return (req, res, next) => {
    const userPermissions = req.user?.permissions || [];
    
    const hasPermission = requiredPermissions.some(permission => 
      userPermissions.includes(permission) || userPermissions.includes('*')
    );
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

// Request/Response Transformer
class RequestResponseTransformer {
  static transformRequest(req) {
    const transformed = {
      ...req.body,
      headers: req.headers,
      query: req.query,
      params: req.params,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    };
    
    // Add user context if authenticated
    if (req.user) {
      transformed.user = {
        id: req.user.id,
        permissions: req.user.permissions,
        roles: req.user.roles
      };
    }
    
    return transformed;
  }

  static transformResponse(response, originalRequest) {
    return {
      data: response.data,
      metadata: {
        requestId: originalRequest.requestId,
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - originalRequest.startTime,
        service: originalRequest.targetService
      }
    };
  }
}

// Main Enhanced API Gateway
class EnhancedAPIGateway {
  constructor() {
    this.app = express();
    this.serviceRegistry = new ServiceRegistry();
    this.circuitBreaker = new CircuitBreaker();
    this.rateLimiter = new RateLimiter();
    this.requestCounts = new Map();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupMonitoring();
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
    }));

    // Request parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimitWindowMs,
      max: config.rateLimitMaxRequests,
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(config.rateLimitWindowMs / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use('/api/', limiter);

    // Custom rate limiting for authenticated users
    this.app.use('/api/', (req, res, next) => {
      if (req.user) {
        const userKey = `user:${req.user.id}`;
        if (!this.rateLimiter.isAllowed(userKey, 1000, config.rateLimitWindowMs)) {
          return res.status(429).json({ 
            error: 'User rate limit exceeded',
            retryAfter: Math.ceil(config.rateLimitWindowMs / 1000)
          });
        }
      }
      next();
    });

    // Request logging and correlation
    this.app.use((req, res, next) => {
      req.requestId = uuidv4();
      req.startTime = Date.now();
      
      // Add request ID to response headers
      res.setHeader('X-Request-ID', req.requestId);
      res.setHeader('X-Response-Time', '0');
      
      // Log request
      logger.info('Request received', {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      // Log response
      res.on('finish', () => {
        const responseTime = Date.now() - req.startTime;
        res.setHeader('X-Response-Time', `${responseTime}ms`);
        
        logger.info('Request completed', {
          requestId: req.requestId,
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          responseTime
        });
      });
      
      next();
    });
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      const services = {};
      
      for (const [name, service] of this.serviceRegistry.services.entries()) {
        const healthyInstances = this.serviceRegistry.getHealthyInstances(name);
        services[name] = {
          status: healthyInstances.length > 0 ? 'healthy' : 'unhealthy',
          instances: service.instances.length,
          healthyInstances: healthyInstances.length,
          lastCheck: service.lastHealthCheck
        };
      }
      
      const overallStatus = Object.values(services).every(s => s.status === 'healthy') ? 'healthy' : 'degraded';
      
      res.json({
        status: overallStatus,
        timestamp: new Date().toISOString(),
        services,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: '2.0.0'
      });
    });

    // Service discovery endpoint
    this.app.get('/services', (req, res) => {
      const services = {};
      
      for (const [name, service] of this.serviceRegistry.services.entries()) {
        services[name] = {
          name: service.name,
          instances: service.instances.map(instance => ({
            id: instance.id,
            url: instance.url,
            weight: instance.weight,
            healthy: this.serviceRegistry.healthChecks.get(instance.id)?.healthy || false
          }))
        };
      }
      
      res.json({ services });
    });

    // Authentication endpoints
    this.app.post('/auth/login', async (req, res) => {
      try {
        const { email, password } = req.body;
        
        // Mock authentication - in production, integrate with actual auth service
        if (email === 'admin@example.com' && password === 'admin123') {
          const token = jwt.sign({
            id: 'admin_001',
            email: email,
            roles: ['admin'],
            permissions: ['*']
          }, config.jwtSecret, { expiresIn: '1h' });
          
          res.json({
            success: true,
            token,
            user: {
              id: 'admin_001',
              email: email,
              roles: ['admin'],
              permissions: ['*']
            }
          });
        } else {
          res.status(401).json({ error: 'Invalid credentials' });
        }
      } catch (error) {
        logger.error('Authentication error:', error);
        res.status(500).json({ error: 'Authentication failed' });
      }
    });

    // Protected API routes with service routing
    this.app.use('/api/bhiv', authenticateToken, (req, res) => {
      this.proxyRequest('bhiv-core', req, res);
    });

    this.app.use('/api/tags', authenticateToken, (req, res) => {
      this.proxyRequest('adaptive-tags', req, res);
    });

    this.app.use('/api/insights', authenticateToken, (req, res) => {
      this.proxyRequest('insight-bridge', req, res);
    });

    // Unified integration endpoint
    this.app.use('/api/integration', authenticateToken, authorize(['*']), (req, res) => {
      this.handleIntegrationRequest(req, res);
    });

    // Circuit breaker status
    this.app.get('/circuit-breaker/:operationId', (req, res) => {
      const status = this.circuitBreaker.getStatus(req.params.operationId);
      res.json(status);
    });

    // Metrics endpoint
    this.app.get('/metrics', (req, res) => {
      res.json(this.getMetrics());
    });
  }

  async proxyRequest(serviceName, req, res) {
    try {
      const instance = this.serviceRegistry.selectInstance(serviceName);
      if (!instance) {
        return res.status(503).json({ error: 'Service temporarily unavailable' });
      }

      // Use circuit breaker
      await this.circuitBreaker.execute(`${serviceName}-${instance.id}`, async () => {
        const targetUrl = `${instance.url}${req.url}`;
        
        // Increment connection count for load balancer
        this.serviceRegistry.loadBalancers.get(serviceName).incrementConnections(instance.id);
        
        try {
          const response = await axios({
            method: req.method,
            url: targetUrl,
            headers: {
              ...req.headers,
              'X-Forwarded-For': req.ip,
              'X-Forwarded-Proto': req.protocol,
              'X-Original-Host': req.get('host')
            },
            data: req.body,
            timeout: 30000
          });

          // Copy response headers
          Object.entries(response.headers).forEach(([key, value]) => {
            if (!key.toLowerCase().startsWith('x-')) {
              res.setHeader(key, value);
            }
          });

          res.status(response.status).json(response.data);
        } finally {
          // Decrement connection count
          this.serviceRegistry.loadBalancers.get(serviceName).decrementConnections(instance.id);
        }
      });
    } catch (error) {
      logger.error(`Proxy error for ${serviceName}:`, error);
      
      if (error.message.includes('Circuit breaker is OPEN')) {
        res.status(503).json({ error: 'Service circuit breaker is open' });
      } else {
        res.status(502).json({ error: 'Bad gateway', detail: error.message });
      }
    }
  }

  async handleIntegrationRequest(req, res) {
    try {
      const { operation, data } = req.body;
      
      // Process integration operation
      const result = await this.processIntegrationOperation(operation, data, req.user);
      
      res.json({
        success: true,
        data: result,
        metadata: {
          operation,
          timestamp: new Date().toISOString(),
          requestId: req.requestId
        }
      });
    } catch (error) {
      logger.error('Integration request error:', error);
      res.status(500).json({ 
        error: 'Integration operation failed',
        detail: error.message 
      });
    }
  }

  async processIntegrationOperation(operation, data, user) {
    switch (operation) {
      case 'getUnifiedContent':
        return await this.getUnifiedContent(data.contentId);
      case 'processContent':
        return await this.processContent(data.content, data.options);
      case 'syncData':
        return await this.syncData(data.source, data.target, data.data);
      default:
        throw new Error(`Unknown integration operation: ${operation}`);
    }
  }

  async getUnifiedContent(contentId) {
    // Mock implementation - in production, coordinate with actual services
    return {
      contentId,
      content: 'Sample unified content',
      tags: [],
      moderationStatus: 'pending',
      insights: {}
    };
  }

  async processContent(content, options) {
    // Mock implementation
    return {
      contentId: `content_${Date.now()}`,
      results: {
        tags: [],
        moderation: {},
        insights: {}
      },
      metadata: {
        processingTime: 100,
        servicesUsed: ['bhiv-core'],
        confidence: 0.85
      }
    };
  }

  async syncData(source, target, data) {
    // Mock implementation
    return {
      source,
      target,
      syncedItems: Array.isArray(data) ? data.length : 0,
      timestamp: new Date().toISOString()
    };
  }

  setupMonitoring() {
    // Cleanup rate limiter every hour
    setInterval(() => {
      this.rateLimiter.cleanup();
    }, 60 * 60 * 1000);

    // Log metrics every 5 minutes
    setInterval(() => {
      logger.info('Gateway metrics', this.getMetrics());
    }, 5 * 60 * 1000);
  }

  getMetrics() {
    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {},
      circuitBreakers: {},
      rateLimiter: {
        activeKeys: this.rateLimiter.requests.size
      }
    };

    // Service metrics
    for (const [name, service] of this.serviceRegistry.services.entries()) {
      const healthyInstances = this.serviceRegistry.getHealthyInstances(name);
      metrics.services[name] = {
        totalInstances: service.instances.length,
        healthyInstances: healthyInstances.length,
        status: healthyInstances.length > 0 ? 'healthy' : 'unhealthy'
      };
    }

    // Circuit breaker metrics
    for (const [operationId, state] of this.circuitBreaker.monitor.entries()) {
      metrics.circuitBreakers[operationId] = {
        state: state.state,
        failures: state.failures,
        successes: state.successes,
        failureRate: state.failures + state.successes > 0 
          ? (state.failures / (state.failures + state.successes)) * 100 
          : 0
      };
    }

    return metrics;
  }

  start() {
    this.app.listen(config.port, () => {
      logger.info(`Enhanced API Gateway started on port ${config.port}`);
      console.log(`Enhanced API Gateway listening on http://localhost:${config.port}`);
      console.log(`Health check: http://localhost:${config.port}/health`);
      console.log(`Service discovery: http://localhost:${config.port}/services`);
      console.log(`Metrics: http://localhost:${config.port}/metrics`);
    });
  }
}

// Create and start the gateway
const gateway = new EnhancedAPIGateway();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  gateway.serviceRegistry.services.forEach(service => {
    if (service.healthCheckInterval) {
      clearInterval(service.healthCheckInterval);
    }
  });
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  gateway.serviceRegistry.services.forEach(service => {
    if (service.healthCheckInterval) {
      clearInterval(service.healthCheckInterval);
    }
  });
  process.exit(0);
});

module.exports = { EnhancedAPIGateway, gateway };

// Start the gateway if run directly
if (require.main === module) {
  gateway.start();
}
