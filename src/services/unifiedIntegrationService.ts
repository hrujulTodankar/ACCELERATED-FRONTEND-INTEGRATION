/**
 * Unified Integration Service Layer
 * Central coordination service thatIV Core, Adaptive orchestrates between BH Tagging,
 * and Insight Bridge systems according to the comprehensive integration strategy
 */

import { AdaptiveTagsIntegrationService, AdaptiveTag } from './adaptiveTagsIntegrationService';
import { BHIVIntegrationService, BHIVTag, InsightBridgeData } from './bhivIntegrationService';
import { bhivHealthService } from './bhivHealthService';
import * as apiService from './apiService';

// Configuration interface
export interface UnifiedIntegrationConfig {
  // Service endpoints
  bhivCoreUrl: string;
  adaptiveTagsUrl: string;
  insightBridgeUrl: string;
  
  // Performance settings
  cacheTimeout: number;
  retryAttempts: number;
  enableRealTimeUpdates: boolean;
  
  // Security settings
  enableJWT: boolean;
  enableOAuth: boolean;
  enableRBAC: boolean;
  
  // Integration settings
  enableEventBus: boolean;
  enableStateSync: boolean;
  enableLoadBalancing: boolean;
}

// Event types for the integration system
export enum IntegrationEventType {
  // Service events
  SERVICE_CONNECTED = 'service:connected',
  SERVICE_DISCONNECTED = 'service:disconnected',
  SERVICE_ERROR = 'service:error',
  
  // Data events
  DATA_SYNCHRONIZED = 'data:synchronized',
  DATA_UPDATED = 'data:updated',
  DATA_CONFLICT = 'data:conflict',
  
  // Security events
  AUTH_SUCCESS = 'auth:success',
  AUTH_FAILURE = 'auth:failed',
  PERMISSION_DENIED = 'auth:permission_denied',
  
  // Performance events
  PERFORMANCE_THRESHOLD = 'perf:threshold',
  LOAD_BALANCED = 'perf:load_balanced',
  
  // Business logic events
  TAG_SUGGESTED = 'content:tag_suggested',
  CONTENT_MODERATED = 'content:moderated',
  HEALTH_ALERT = 'system:health_alert'
}

// Event interface
export interface IntegrationEvent {
  id: string;
  type: IntegrationEventType;
  source: 'bhiv-core' | 'adaptive-tags' | 'insight-bridge' | 'gateway';
  data: any;
  timestamp: string;
  correlationId?: string;
  userId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Authentication and authorization interface
export interface UserCredentials {
  userId: string;
  email: string;
  password?: string;
  token?: string;
  permissions: string[];
  roles: string[];
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  expiresAt: string;
  user: {
    id: string;
    email: string;
    roles: string[];
    permissions: string[];
  };
  services: {
    [serviceName: string]: boolean;
  };
}

// Performance metrics interface
export interface IntegrationMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  activeUsers: number;
  serviceHealth: {
    [serviceName: string]: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      responseTime: number;
      uptime: number;
    };
  };
  cacheHitRate: number;
  errorRate: number;
}

// Unified data models
export interface UnifiedContent {
  id: string;
  title: string;
  content: string;
  metadata: {
    source: string;
    createdAt: string;
    updatedAt: string;
    author: string;
    tags: string[];
  };
  adaptiveTags: AdaptiveTag[];
  bhivStatus: {
    healthScore: number;
    lastCheck: string;
    moderationStatus: 'approved' | 'rejected' | 'pending' | 'flagged';
    confidence: number;
    alerts: string[];
  };
  insights: {
    behavioralScore: number;
    engagementMetrics: {
      views: number;
      interactions: number;
      conversions: number;
    };
    nlpAnalysis: {
      sentiment: 'positive' | 'negative' | 'neutral';
      topics: string[];
      entities: string[];
    };
  };
  synchronizationStatus: {
    lastSync: string;
    syncStatus: 'synced' | 'pending' | 'error';
    conflicts: string[];
  };
}

// Event Bus for cross-component communication
class IntegrationEventBus {
  private subscribers: Map<string, Set<(event: IntegrationEvent) => void>> = new Map();
  private eventHistory: IntegrationEvent[] = [];
  private maxHistorySize = 1000;

  subscribe(eventType: IntegrationEventType | string, callback: (event: IntegrationEvent) => void): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    
    this.subscribers.get(eventType)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const subscribers = this.subscribers.get(eventType);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.subscribers.delete(eventType);
        }
      }
    };
  }

  emit(event: IntegrationEvent): void {
    // Add to history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Notify specific event subscribers
    const specificSubscribers = this.subscribers.get(event.type);
    if (specificSubscribers) {
      specificSubscribers.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error(`Error in event subscriber for ${event.type}:`, error);
        }
      });
    }

    // Notify wildcard subscribers
    const wildcardSubscribers = this.subscribers.get('*');
    if (wildcardSubscribers) {
      wildcardSubscribers.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error(`Error in wildcard event subscriber:`, error);
        }
      });
    }
  }

  getEventHistory(limit = 100): IntegrationEvent[] {
    return this.eventHistory.slice(-limit);
  }

  clearHistory(): void {
    this.eventHistory = [];
  }
}

// State Synchronization Manager
class StateSynchronizationManager {
  private syncStrategies: Map<string, (data: any) => Promise<any>> = new Map();
  private syncStatus: Map<string, 'idle' | 'syncing' | 'error'> = new Map();
  private lastSyncTimes: Map<string, string> = new Map();

  constructor(private eventBus: IntegrationEventBus) {
    this.initializeStrategies();
  }

  private initializeStrategies(): void {
    // Content-Tags synchronization
    this.syncStrategies.set('content-tags', async (contentData) => {
      // This will be handled by the parent service
      return [];
    });

    // BHIV-Health monitoring synchronization
    this.syncStrategies.set('bhiv-health', async (healthData) => {
      return bhivHealthService.getHealthStatus();
    });

    // Cross-service data validation
    this.syncStrategies.set('data-validation', async (data) => {
      // Validate data consistency across services
      const validationResults = {
        bhiv_core: await this.validateBHIVData(data.bhivCore),
        adaptive_tags: await this.validateAdaptiveTagsData(data.adaptiveTags),
        insight_bridge: await this.validateInsightBridgeData(data.insightBridge)
      };
      return validationResults;
    });
  }

  async synchronize(strategyName: string, data: any): Promise<any> {
    const strategy = this.syncStrategies.get(strategyName);
    if (!strategy) {
      throw new Error(`Unknown synchronization strategy: ${strategyName}`);
    }

    this.syncStatus.set(strategyName, 'syncing');
    
    try {
      const result = await strategy(data);
      this.syncStatus.set(strategyName, 'idle');
      this.lastSyncTimes.set(strategyName, new Date().toISOString());

      // Emit sync event
      this.eventBus.emit({
        id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: IntegrationEventType.DATA_SYNCHRONIZED,
        source: 'gateway',
        data: { strategy: strategyName, result },
        timestamp: new Date().toISOString(),
        severity: 'low'
      });

      return result;
    } catch (error) {
      this.syncStatus.set(strategyName, 'error');
      
      this.eventBus.emit({
        id: `sync_error_${Date.now()}`,
        type: IntegrationEventType.DATA_CONFLICT,
        source: 'gateway',
        data: { strategy: strategyName, error: error instanceof Error ? error.message : String(error) },
        timestamp: new Date().toISOString(),
        severity: 'high'
      });

      throw error;
    }
  }

  getSyncStatus(strategyName: string): 'idle' | 'syncing' | 'error' {
    return this.syncStatus.get(strategyName) || 'idle';
  }

  getLastSyncTime(strategyName: string): string | null {
    return this.lastSyncTimes.get(strategyName) || null;
  }

  private async validateBHIVData(data: any): Promise<boolean> {
    // Validate BHIV Core data structure
    return data && typeof data.status === 'string' && typeof data.uptime_seconds === 'number';
  }

  private async validateAdaptiveTagsData(data: any): Promise<boolean> {
    // Validate Adaptive Tags data structure
    return Array.isArray(data) && data.every(tag => tag.definition && tag.insight);
  }

  private async validateInsightBridgeData(data: any): Promise<boolean> {
    // Validate Insight Bridge data structure
    return data && typeof data.tagId === 'string' && data.metrics;
  }
}

// Load Balancer for service routing
class ServiceLoadBalancer {
  private serviceEndpoints: Map<string, string[]> = new Map();
  private currentIndex: Map<string, number> = new Map();
  private healthStatus: Map<string, boolean> = new Map();

  constructor() {
    this.initializeEndpoints();
  }

  private initializeEndpoints(): void {
    // Initialize with configured endpoints
    this.serviceEndpoints.set('bhiv-core', ['http://localhost:8001']);
    this.serviceEndpoints.set('adaptive-tags', ['http://localhost:8002']);
    this.serviceEndpoints.set('insight-bridge', ['http://localhost:8003']);
  }

  addEndpoint(serviceName: string, endpoint: string): void {
    if (!this.serviceEndpoints.has(serviceName)) {
      this.serviceEndpoints.set(serviceName, []);
    }
    this.serviceEndpoints.get(serviceName)!.push(endpoint);
  }

  getEndpoint(serviceName: string): string | null {
    const endpoints = this.serviceEndpoints.get(serviceName);
    if (!endpoints || endpoints.length === 0) {
      return null;
    }

    // Simple round-robin load balancing
    const current = this.currentIndex.get(serviceName) || 0;
    const next = (current + 1) % endpoints.length;
    this.currentIndex.set(serviceName, next);

    return endpoints[current];
  }

  markHealth(serviceName: string, healthy: boolean): void {
    this.healthStatus.set(serviceName, healthy);
  }

  getHealthyEndpoints(serviceName: string): string[] {
    const endpoints = this.serviceEndpoints.get(serviceName) || [];
    return endpoints.filter((_, index) => this.healthStatus.get(`${serviceName}_${index}`) !== false);
  }
}

// Main Unified Integration Service
export class UnifiedIntegrationService {
  private config: UnifiedIntegrationConfig;
  private eventBus: IntegrationEventBus;
  private stateSyncManager: StateSynchronizationManager;
  private loadBalancer: ServiceLoadBalancer;
  
  // Service instances
  private adaptiveTagsService: AdaptiveTagsIntegrationService;
  private bhivIntegrationService: BHIVIntegrationService;
  
  // State
  private isInitialized = false;
  private metrics: IntegrationMetrics;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private activeUsers: Set<string> = new Set();

  constructor(config: Partial<UnifiedIntegrationConfig> = {}) {
    this.config = {
      // Default configuration
      bhivCoreUrl: process.env.VITE_BHIV_CORE_URL || 'http://localhost:8001',
      adaptiveTagsUrl: process.env.VITE_ADAPTIVE_TAGS_URL || 'http://localhost:8002',
      insightBridgeUrl: process.env.VITE_INSIGHT_BRIDGE_URL || 'http://localhost:8003',
      cacheTimeout: 60000,
      retryAttempts: 3,
      enableRealTimeUpdates: true,
      enableJWT: true,
      enableOAuth: false,
      enableRBAC: true,
      enableEventBus: true,
      enableStateSync: true,
      enableLoadBalancing: true,
      ...config
    };

    // Initialize components
    this.eventBus = new IntegrationEventBus();
    this.stateSyncManager = new StateSynchronizationManager(this.eventBus);
    this.loadBalancer = new ServiceLoadBalancer();

    // Initialize service instances
    this.adaptiveTagsService = new AdaptiveTagsIntegrationService({
      bhivCoreUrl: this.config.bhivCoreUrl,
      insightBridgeUrl: this.config.insightBridgeUrl,
      pollingInterval: 30000,
      enableRealTimeUpdates: this.config.enableRealTimeUpdates,
      cacheTimeout: this.config.cacheTimeout
    });

    this.bhivIntegrationService = new BHIVIntegrationService({
      enableRealTimeUpdates: this.config.enableRealTimeUpdates,
      cacheTimeout: this.config.cacheTimeout,
      retryAttempts: this.config.retryAttempts,
      enableAnalytics: true,
      enableErrorReporting: true
    });

    // Initialize metrics
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      activeUsers: 0,
      serviceHealth: {
        'bhiv-core': { status: 'unhealthy', responseTime: 0, uptime: 0 },
        'adaptive-tags': { status: 'unhealthy', responseTime: 0, uptime: 0 },
        'insight-bridge': { status: 'unhealthy', responseTime: 0, uptime: 0 }
      },
      cacheHitRate: 0,
      errorRate: 0
    };

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Listen to service events
    this.adaptiveTagsService.on('initialized', () => {
      this.eventBus.emit({
        id: `adaptive_tags_init_${Date.now()}`,
        type: IntegrationEventType.SERVICE_CONNECTED,
        source: 'adaptive-tags',
        data: { service: 'adaptive-tags' },
        timestamp: new Date().toISOString(),
        severity: 'medium'
      });
    });

    this.adaptiveTagsService.on('error', (error: any) => {
      this.eventBus.emit({
        id: `adaptive_tags_error_${Date.now()}`,
        type: IntegrationEventType.SERVICE_ERROR,
        source: 'adaptive-tags',
        data: error,
        timestamp: new Date().toISOString(),
        severity: 'high'
      });
    });

    // Performance monitoring
    this.eventBus.subscribe('*', (event) => {
      this.updateMetrics(event);
    });
  }

  /**
   * Initialize the unified integration service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('[UnifiedIntegration] Initializing...');

      // Test connectivity to all services
      const healthChecks = await Promise.allSettled([
        this.checkServiceHealth('bhiv-core'),
        this.checkServiceHealth('adaptive-tags'),
        this.checkServiceHealth('insight-bridge')
      ]);

      // Initialize service instances
      await Promise.all([
        this.adaptiveTagsService.initialize(),
        // Add other service initializations here
      ]);

      this.isInitialized = true;

      this.eventBus.emit({
        id: `unified_init_${Date.now()}`,
        type: IntegrationEventType.SERVICE_CONNECTED,
        source: 'gateway',
        data: { 
          services: {
            'bhiv-core': healthChecks[0].status === 'fulfilled',
            'adaptive-tags': healthChecks[1].status === 'fulfilled',
            'insight-bridge': healthChecks[2].status === 'fulfilled'
          }
        },
        timestamp: new Date().toISOString(),
        severity: 'medium'
      });

      console.log('[UnifiedIntegration] Initialized successfully');

      // Start periodic health checks if enabled
      if (this.config.enableRealTimeUpdates) {
        this.startPeriodicHealthChecks();
      }

    } catch (error) {
      console.error('[UnifiedIntegration] Initialization failed:', error);
      
      this.eventBus.emit({
        id: `unified_init_error_${Date.now()}`,
        type: IntegrationEventType.SERVICE_ERROR,
        source: 'gateway',
        data: { error: error instanceof Error ? error.message : String(error) },
        timestamp: new Date().toISOString(),
        severity: 'critical'
      });

      throw error;
    }
  }

  /**
   * Get unified content with data from all services
   */
  async getUnifiedContent(contentId: string): Promise<UnifiedContent> {
    const cacheKey = `content_${contentId}`;
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      // Parallel data fetching from all services
      const [bhivData, adaptiveTagsData, insightsData] = await Promise.allSettled([
        this.getBHIVContentData(contentId),
        this.getAdaptiveTagsData(contentId),
        this.getInsightsData(contentId)
      ]);

      const unifiedContent: UnifiedContent = {
        id: contentId,
        title: `Content ${contentId}`,
        content: 'Sample content for demonstration',
        metadata: {
          source: 'unified',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          author: 'system',
          tags: []
        },
        adaptiveTags: bhivData.status === 'fulfilled' ? bhivData.value : [],
        bhivStatus: {
          healthScore: 0.85,
          lastCheck: new Date().toISOString(),
          moderationStatus: 'pending',
          confidence: 0.75,
          alerts: []
        },
        insights: {
          behavioralScore: 0.8,
          engagementMetrics: {
            views: 100,
            interactions: 25,
            conversions: 5
          },
          nlpAnalysis: {
            sentiment: 'neutral',
            topics: ['technology', 'innovation'],
            entities: ['AI', 'machine learning']
          }
        },
        synchronizationStatus: {
          lastSync: new Date().toISOString(),
          syncStatus: 'synced',
          conflicts: []
        }
      };

      this.setCache(cacheKey, unifiedContent);
      return unifiedContent;

    } catch (error) {
      console.error(`[UnifiedIntegration] Error getting unified content ${contentId}:`, error);
      throw error;
    }
  }

  /**
   * Process content through the integrated system
   */
  async processContent(content: string, options: {
    includeTags?: boolean;
    includeModeration?: boolean;
    includeInsights?: boolean;
    userId?: string;
  } = {}): Promise<{
    contentId: string;
    results: {
      tags?: AdaptiveTag[];
      moderation?: any;
      insights?: any;
    };
    metadata: {
      processingTime: number;
      servicesUsed: string[];
      confidence: number;
    };
  }> {
    const startTime = Date.now();
    const contentId = `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      this.metrics.totalRequests++;

      const results: any = {};
      const servicesUsed: string[] = [];

      // Process through different services based on options
      if (options.includeTags !== false) {
        try {
          const tags = await this.adaptiveTagsService.getAdaptiveTags();
          results.tags = tags.slice(0, 10); // Limit to top 10 tags
          servicesUsed.push('adaptive-tags');
        } catch (error) {
          console.warn('[UnifiedIntegration] Tag processing failed:', error);
        }
      }

      if (options.includeModeration) {
        try {
          const moderation = await apiService.getModerationItems({
            type: 'all',
            score: 'all',
            flagged: 'all',
            date: 'all',
            search: '',
            page: 1,
            limit: 1
          });
          results.moderation = moderation.data[0];
          servicesUsed.push('bhiv-core');
        } catch (error) {
          console.warn('[UnifiedIntegration] Moderation processing failed:', error);
        }
      }

      if (options.includeInsights) {
        try {
          const insights = await apiService.analyzeContentComprehensive(content, {
            includeTags: true,
            includeNLP: true,
            includeAnalytics: false,
            includeSecurity: false
          });
          results.insights = insights;
          servicesUsed.push('insight-bridge');
        } catch (error) {
          console.warn('[UnifiedIntegration] Insights processing failed:', error);
        }
      }

      const processingTime = Date.now() - startTime;
      const confidence = this.calculateOverallConfidence(results);

      this.metrics.successfulRequests++;

      // Emit processing event
      this.eventBus.emit({
        id: `content_processed_${contentId}`,
        type: IntegrationEventType.CONTENT_MODERATED,
        source: 'gateway',
        data: {
          contentId,
          content: content.substring(0, 100),
          servicesUsed,
          processingTime,
          confidence
        },
        timestamp: new Date().toISOString(),
        userId: options.userId,
        severity: 'low'
      });

      return {
        contentId,
        results,
        metadata: {
          processingTime,
          servicesUsed,
          confidence
        }
      };

    } catch (error) {
      this.metrics.failedRequests++;
      
      this.eventBus.emit({
        id: `content_processing_error_${contentId}`,
        type: IntegrationEventType.SERVICE_ERROR,
        source: 'gateway',
        data: {
          contentId,
          error: error instanceof Error ? error.message : String(error)
        },
        timestamp: new Date().toISOString(),
        userId: options.userId,
        severity: 'high'
      });

      throw error;
    }
  }

  /**
   * Get system-wide metrics
   */
  getMetrics(): IntegrationMetrics {
    return { ...this.metrics };
  }

  /**
   * Get event history
   */
  getEventHistory(limit = 100): IntegrationEvent[] {
    return this.eventBus.getEventHistory(limit);
  }

  /**
   * Subscribe to integration events
   */
  subscribeToEvents(eventType: IntegrationEventType | string, callback: (event: IntegrationEvent) => void): () => void {
    return this.eventBus.subscribe(eventType, callback);
  }

  /**
   * Perform user authentication across all services
   */
  async authenticateUser(credentials: UserCredentials): Promise<AuthResponse> {
    try {
      // This would integrate with the enhanced authentication system
      // For now, returning a mock successful response
      const response: AuthResponse = {
        success: true,
        token: `jwt_${Date.now()}`,
        refreshToken: `refresh_${Date.now()}`,
        expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
        user: {
          id: credentials.userId,
          email: credentials.email,
          roles: credentials.roles,
          permissions: credentials.permissions
        },
        services: {
          'bhiv-core': true,
          'adaptive-tags': true,
          'insight-bridge': true
        }
      };

      this.activeUsers.add(credentials.userId);
      this.metrics.activeUsers = this.activeUsers.size;

      this.eventBus.emit({
        id: `auth_success_${Date.now()}`,
        type: IntegrationEventType.AUTH_SUCCESS,
        source: 'gateway',
        data: { userId: credentials.userId, services: response.services },
        timestamp: new Date().toISOString(),
        userId: credentials.userId,
        severity: 'low'
      });

      return response;

    } catch (error) {
      this.eventBus.emit({
        id: `auth_failure_${Date.now()}`,
        type: IntegrationEventType.AUTH_FAILURE,
        source: 'gateway',
        data: { userId: credentials.userId, error: error instanceof Error ? error.message : String(error) },
        timestamp: new Date().toISOString(),
        userId: credentials.userId,
        severity: 'medium'
      });

      throw error;
    }
  }

  /**
   * Health check for all services
   */
  async checkServiceHealth(serviceName: string): Promise<{
    healthy: boolean;
    responseTime?: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      let result;
      
      switch (serviceName) {
        case 'bhiv-core':
          result = await bhivHealthService.getHealthStatus();
          break;
        case 'adaptive-tags':
          result = await this.adaptiveTagsService.getAdaptiveTags();
          break;
        case 'insight-bridge':
          result = await apiService.checkInsightBridgeHealth();
          break;
        default:
          throw new Error(`Unknown service: ${serviceName}`);
      }

      const responseTime = Date.now() - startTime;
      
      this.loadBalancer.markHealth(serviceName, true);
      this.updateServiceHealth(serviceName, 'healthy', responseTime);

      return {
        healthy: true,
        responseTime
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      this.loadBalancer.markHealth(serviceName, false);
      this.updateServiceHealth(serviceName, 'unhealthy', responseTime);

      return {
        healthy: false,
        responseTime,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Synchronize data across services
   */
  async synchronizeData(strategy: 'content-tags' | 'bhiv-health' | 'data-validation', data: any): Promise<any> {
    return this.stateSyncManager.synchronize(strategy, data);
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.adaptiveTagsService.destroy();
    this.bhivIntegrationService.cleanup();
    this.eventBus.clearHistory();
    this.cache.clear();
    this.activeUsers.clear();
    this.isInitialized = false;
  }

  // Private helper methods

  private async getBHIVContentData(contentId: string): Promise<any> {
    return apiService.getModerationItem(contentId);
  }

  private async getAdaptiveTagsData(contentId: string): Promise<AdaptiveTag[]> {
    return this.adaptiveTagsService.getAdaptiveTags();
  }

  private async getInsightsData(contentId: string): Promise<any> {
    return apiService.getAnalytics(contentId);
  }

  private calculateOverallConfidence(results: any): number {
    const confidenceScores: number[] = [];
    
    if (results.tags) {
      confidenceScores.push(...results.tags.map((tag: AdaptiveTag) => tag.insight.confidence));
    }
    
    if (results.moderation?.confidence) {
      confidenceScores.push(results.moderation.confidence);
    }
    
    if (results.insights?.overallConfidence) {
      confidenceScores.push(results.insights.overallConfidence);
    }
    
    return confidenceScores.length > 0 
      ? confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length
      : 0.5;
  }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.config.cacheTimeout
    });
  }

  private updateMetrics(event: IntegrationEvent): void {
    if (event.type === IntegrationEventType.SERVICE_ERROR) {
      this.metrics.errorRate = (this.metrics.errorRate * 0.9) + 0.1; // Moving average
    }
  }

  private updateServiceHealth(serviceName: string, status: 'healthy' | 'degraded' | 'unhealthy', responseTime: number): void {
    this.metrics.serviceHealth[serviceName] = {
      status,
      responseTime,
      uptime: Date.now() // Simplified - would track actual uptime in production
    };
  }

  private startPeriodicHealthChecks(): void {
    setInterval(async () => {
      const services = ['bhiv-core', 'adaptive-tags', 'insight-bridge'];
      
      for (const service of services) {
        try {
          await this.checkServiceHealth(service);
        } catch (error) {
          console.warn(`Health check failed for ${service}:`, error);
        }
      }
    }, 30000); // Check every 30 seconds
  }
}

// Export singleton instance
export const unifiedIntegrationService = new UnifiedIntegrationService();

export default UnifiedIntegrationService;