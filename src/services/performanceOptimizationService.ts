/**
 * Performance Optimization Service
 * Implements caching, connection pooling, load balancing, and performance monitoring
 * for the unified integration system
 */

export interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
  cacheHitRate: number;
  timestamp: string;
}

export interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  hits: number;
}

export interface ConnectionPool {
  service: string;
  connections: Set<any>;
  maxConnections: number;
  activeConnections: number;
  waitingQueue: any[];
}

export class PerformanceOptimizationService {
  private cache: Map<string, CacheEntry> = new Map();
  private connectionPools: Map<string, ConnectionPool> = new Map();
  private metrics: PerformanceMetrics;
  private loadBalancer: Map<string, string[]> = new Map();
  private performanceHistory: PerformanceMetrics[] = [];
  private config = {
    cache: {
      enabled: true,
      ttl: 5 * 60 * 1000, // 5 minutes
      maxSize: 1000,
      strategy: 'lru' as 'lru' | 'lfu' | 'fifo'
    },
    connectionPooling: {
      enabled: true,
      maxConnectionsPerService: 10,
      connectionTimeout: 30000,
      idleTimeout: 60000
    },
    loadBalancing: {
      enabled: true,
      strategy: 'round-robin' as 'round-robin' | 'least-connections' | 'weighted'
    }
  };

  constructor() {
    this.metrics = {
      responseTime: 0,
      throughput: 0,
      errorRate: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      activeConnections: 0,
      cacheHitRate: 0,
      timestamp: new Date().toISOString()
    };

    this.initializeConnectionPools();
    this.startPerformanceMonitoring();
  }

  private initializeConnectionPools(): void {
    const services = ['bhiv-core', 'adaptive-tags', 'insight-bridge'];
    
    services.forEach(service => {
      this.connectionPools.set(service, {
        service,
        connections: new Set(),
        maxConnections: this.config.connectionPooling.maxConnectionsPerService,
        activeConnections: 0,
        waitingQueue: []
      });
    });
  }

  private startPerformanceMonitoring(): void {
    setInterval(() => {
      this.updateMetrics();
      this.cleanupExpiredCache();
    }, 30000); // Update every 30 seconds
  }

  /**
   * Get data from cache
   */
  getFromCache(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      // Expired
      this.cache.delete(key);
      return null;
    }

    // Update hit count and LRU
    entry.hits++;
    this.metrics.cacheHitRate = this.calculateCacheHitRate();
    
    return entry.data;
  }

  /**
   * Set data in cache
   */
  setCache(key: string, data: any, ttl?: number): void {
    if (!this.config.cache.enabled) {
      return;
    }

    // Check cache size limit
    if (this.cache.size >= this.config.cache.maxSize) {
      this.evictCacheEntry();
    }

    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.cache.ttl,
      hits: 0
    };

    this.cache.set(key, entry);
    this.metrics.cacheHitRate = this.calculateCacheHitRate();
  }

  /**
   * Remove entry from cache
   */
  removeFromCache(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clearCache(): void {
    this.cache.clear();
    this.metrics.cacheHitRate = 0;
  }

  /**
   * Get connection from pool
   */
  async getConnection(service: string): Promise<any> {
    if (!this.config.connectionPooling.enabled) {
      return this.createConnection(service);
    }

    const pool = this.connectionPools.get(service);
    if (!pool) {
      throw new Error(`No connection pool for service: ${service}`);
    }

    // Try to get existing connection
    if (pool.connections.size > 0) {
      const connection = pool.connections.values().next().value;
      pool.connections.delete(connection);
      pool.activeConnections++;
      return connection;
    }

    // Create new connection if under limit
    if (pool.activeConnections < pool.maxConnections) {
      const connection = await this.createConnection(service);
      pool.activeConnections++;
      return connection;
    }

    // Wait for available connection
    return new Promise((resolve, reject) => {
      pool.waitingQueue.push({ resolve, reject });
      
      setTimeout(() => {
        const index = pool.waitingQueue.findIndex(item => item.resolve === resolve);
        if (index !== -1) {
          pool.waitingQueue.splice(index, 1);
          reject(new Error('Connection timeout'));
        }
      }, this.config.connectionPooling.connectionTimeout);
    });
  }

  /**
   * Return connection to pool
   */
  returnConnection(service: string, connection: any): void {
    const pool = this.connectionPools.get(service);
    if (!pool) {
      return;
    }

    pool.activeConnections--;

    // Check waiting queue
    if (pool.waitingQueue.length > 0) {
      const { resolve } = pool.waitingQueue.shift()!;
      pool.activeConnections++;
      resolve(connection);
      return;
    }

    // Add to available connections if under limit
    if (pool.connections.size < pool.maxConnections) {
      pool.connections.add(connection);
    }
  }

  /**
   * Get load balanced endpoint
   */
  getLoadBalancedEndpoint(service: string): string | null {
    if (!this.config.loadBalancing.enabled) {
      const endpoints = this.loadBalancer.get(service);
      return endpoints && endpoints.length > 0 ? endpoints[0] : null;
    }

    const endpoints = this.loadBalancer.get(service);
    if (!endpoints || endpoints.length === 0) {
      return null;
    }

    // Simple round-robin implementation
    const index = Math.floor(Math.random() * endpoints.length);
    return endpoints[index];
  }

  /**
   * Add endpoint to load balancer
   */
  addEndpoint(service: string, endpoint: string): void {
    if (!this.loadBalancer.has(service)) {
      this.loadBalancer.set(service, []);
    }
    
    const endpoints = this.loadBalancer.get(service)!;
    if (!endpoints.includes(endpoint)) {
      endpoints.push(endpoint);
    }
  }

  /**
   * Remove endpoint from load balancer
   */
  removeEndpoint(service: string, endpoint: string): void {
    const endpoints = this.loadBalancer.get(service);
    if (endpoints) {
      const index = endpoints.indexOf(endpoint);
      if (index !== -1) {
        endpoints.splice(index, 1);
      }
    }
  }

  /**
   * Record request performance
   */
  recordRequest(duration: number, success: boolean): void {
    const now = Date.now();
    
    // Update response time (moving average)
    this.metrics.responseTime = (this.metrics.responseTime * 0.9) + (duration * 0.1);
    
    // Update throughput (requests per second)
    const oneMinuteAgo = now - 60000;
    const recentRequests = this.performanceHistory.filter(
      metric => new Date(metric.timestamp).getTime() > oneMinuteAgo
    );
    this.metrics.throughput = recentRequests.length / 60;
    
    // Update error rate
    const totalRequests = recentRequests.length + 1;
    const errorRequests = recentRequests.filter(m => m.errorRate > 0).length + (success ? 0 : 1);
    this.metrics.errorRate = errorRequests / totalRequests;
    
    // Update memory and CPU (simplified)
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const mem = (performance as any).memory;
      this.metrics.memoryUsage = mem.usedJSHeapSize / mem.totalJSHeapSize;
    }
    
    this.metrics.timestamp = new Date().toISOString();
    
    // Add to history
    this.performanceHistory.push({ ...this.metrics });
    if (this.performanceHistory.length > 100) {
      this.performanceHistory.shift();
    }
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get performance history
   */
  getPerformanceHistory(limit = 50): PerformanceMetrics[] {
    return this.performanceHistory.slice(-limit);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{ key: string; hits: number; age: number }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      hits: entry.hits,
      age: now - entry.timestamp
    }));

    return {
      size: this.cache.size,
      maxSize: this.config.cache.maxSize,
      hitRate: this.metrics.cacheHitRate,
      entries
    };
  }

  /**
   * Get connection pool statistics
   */
  getConnectionPoolStats(): Record<string, {
    activeConnections: number;
    availableConnections: number;
    waitingQueue: number;
    maxConnections: number;
  }> {
    const stats: Record<string, any> = {};
    
    this.connectionPools.forEach((pool, service) => {
      stats[service] = {
        activeConnections: pool.activeConnections,
        availableConnections: pool.connections.size,
        waitingQueue: pool.waitingQueue.length,
        maxConnections: pool.maxConnections
      };
    });
    
    return stats;
  }

  /**
   * Get load balancer statistics
   */
  getLoadBalancerStats(): Record<string, {
    endpoints: string[];
    totalEndpoints: number;
  }> {
    const stats: Record<string, any> = {};
    
    this.loadBalancer.forEach((endpoints, service) => {
      stats[service] = {
        endpoints: [...endpoints],
        totalEndpoints: endpoints.length
      };
    });
    
    return stats;
  }

  // Private helper methods

  private calculateCacheHitRate(): number {
    if (this.cache.size === 0) return 0;
    
    const totalHits = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.hits, 0);
    
    return totalHits > 0 ? totalHits / (totalHits + 1) : 0; // Simplified calculation
  }

  private evictCacheEntry(): void {
    if (this.cache.size === 0) return;

    const entries = Array.from(this.cache.entries());
    let evictionKey: string | null = null;
    let minScore = Infinity;

    // LRU eviction strategy
    const now = Date.now();
    entries.forEach(([key, entry]) => {
      const score = entry.hits * (now - entry.timestamp);
      if (score < minScore) {
        minScore = score;
        evictionKey = key;
      }
    });

    if (evictionKey) {
      this.cache.delete(evictionKey);
    }
  }

  private cleanupExpiredCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => this.cache.delete(key));
    
    if (expiredKeys.length > 0) {
      console.log(`[Performance] Cleaned up ${expiredKeys.length} expired cache entries`);
    }
  }

  private updateMetrics(): void {
    // Update system metrics
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const mem = (performance as any).memory;
      this.metrics.memoryUsage = mem.usedJSHeapSize / mem.totalJSHeapSize;
    }

    // Update active connections
    let totalActiveConnections = 0;
    this.connectionPools.forEach(pool => {
      totalActiveConnections += pool.activeConnections;
    });
    this.metrics.activeConnections = totalActiveConnections;
    
    this.metrics.timestamp = new Date().toISOString();
  }

  private async createConnection(service: string): Promise<any> {
    // Simplified connection creation - in real implementation, this would create actual connections
    const endpoint = this.getLoadBalancedEndpoint(service);
    if (!endpoint) {
      throw new Error(`No available endpoint for service: ${service}`);
    }
    
    console.log(`[Performance] Creating connection to ${service} at ${endpoint}`);
    
    // Return a mock connection object
    return {
      service,
      endpoint,
      createdAt: Date.now(),
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  /**
   * Shutdown performance service
   */
  shutdown(): void {
    // Close all connections
    this.connectionPools.forEach(pool => {
      pool.connections.forEach(connection => {
        if (connection.close) {
          connection.close();
        }
      });
      pool.connections.clear();
      pool.waitingQueue = [];
    });
    
    this.clearCache();
    console.log('[Performance] Performance service shutdown');
  }
}

// Export singleton instance
export const performanceOptimizationService = new PerformanceOptimizationService();

export default PerformanceOptimizationService;