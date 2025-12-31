/**
 * BHIV Integration Service
 * Comprehensive service for integrating BHIV Core and Insight Bridge
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Configuration
const BHIV_CONFIG = {
  baseURL: import.meta.env.VITE_BHIV_API_URL || 'http://localhost:3001',
  timeout: 10000,
};

const INSIGHTBRIDGE_CONFIG = {
  baseURL: import.meta.env.VITE_INSIGHTBRIDGE_API_URL || 'http://localhost:3002',
  timeout: 10000,
};

// Types
export interface BHIVTag {
  id: string;
  name: string;
  type: 'adaptive' | 'static' | 'dynamic';
  configuration: {
    targetAudience?: string[];
    triggers?: TagTrigger[];
    appearance?: TagAppearance;
    behavior?: TagBehavior;
  };
  status: 'active' | 'inactive' | 'draft';
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface TagTrigger {
  type: 'time' | 'event' | 'user_action' | 'condition';
  condition?: any;
  delay?: number;
  repeat?: boolean;
}

export interface TagAppearance {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'custom';
  style?: Record<string, any>;
  animation?: string;
  responsive?: boolean;
}

export interface TagBehavior {
  dismissible?: boolean;
  closable?: boolean;
  stickiness?: number;
  interactionTracking?: boolean;
}

export interface InsightBridgeData {
  tagId: string;
  metrics: {
    views: number;
    clicks: number;
    interactions: number;
    dismissals: number;
    engagement_score: number;
    performance_score: number;
  };
  analytics: {
    user_segments: string[];
    performance_trends: Array<{
      timestamp: string;
      metric: string;
      value: number;
    }>;
    recommendations: Array<{
      type: string;
      priority: 'high' | 'medium' | 'low';
      description: string;
      action: string;
    }>;
  };
  timestamp: string;
}

export interface IntegrationConfig {
  enableRealTimeUpdates: boolean;
  cacheTimeout: number;
  retryAttempts: number;
  enableAnalytics: boolean;
  enableErrorReporting: boolean;
}

// Default configuration
const DEFAULT_CONFIG: IntegrationConfig = {
  enableRealTimeUpdates: true,
  cacheTimeout: 30000, // 30 seconds
  retryAttempts: 3,
  enableAnalytics: true,
  enableErrorReporting: true,
};

// Service class
export class BHIVIntegrationService {
  private bhivClient!: AxiosInstance;
  private insightBridgeClient!: AxiosInstance;
  private config: IntegrationConfig;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();
  private retryCount: Map<string, number> = new Map();

  constructor(config: Partial<IntegrationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeClients();
  }

  private initializeClients(): void {
    // BHIV Core client
    this.bhivClient = axios.create({
      baseURL: BHIV_CONFIG.baseURL,
      timeout: BHIV_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Insight Bridge client
    this.insightBridgeClient = axios.create({
      baseURL: INSIGHTBRIDGE_CONFIG.baseURL,
      timeout: INSIGHTBRIDGE_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptors
    this.bhivClient.interceptors.request.use(
      (config) => {
        console.log(`[BHIV] Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.insightBridgeClient.interceptors.request.use(
      (config) => {
        console.log(`[InsightBridge] Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptors
    this.bhivClient.interceptors.response.use(
      (response) => response,
      (error) => this.handleError('BHIV', error)
    );

    this.insightBridgeClient.interceptors.response.use(
      (response) => response,
      (error) => this.handleError('InsightBridge', error)
    );
  }

  private handleError(service: string, error: any): Promise<any> {
    console.error(`[${service}] Error:`, error);
    
    if (this.config.enableErrorReporting) {
      // Log error for monitoring
      console.error('Service Error Details:', {
        service,
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }

    return Promise.reject(error);
  }

  // Cache management
  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.config.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  // Event subscription management
  subscribe(event: string, callback: (data: any) => void): () => void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    
    this.subscribers.get(event)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const subscribers = this.subscribers.get(event);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.subscribers.delete(event);
        }
      }
    };
  }

  private notifySubscribers(event: string, data: any): void {
    const subscribers = this.subscribers.get(event);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in subscriber callback for ${event}:`, error);
        }
      });
    }
  }

  // BHIV Core API methods
  async getTags(): Promise<BHIVTag[]> {
    const cacheKey = 'tags:list';
    const cached = this.getCachedData<BHIVTag[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response: AxiosResponse<BHIVTag[]> = await this.bhivClient.get('/tags');
      const tags = response.data;
      this.setCachedData(cacheKey, tags);
      return tags;
    } catch (error) {
      throw new Error(`Failed to fetch tags: ${error}`);
    }
  }

  async getTag(id: string): Promise<BHIVTag> {
    const cacheKey = `tag:${id}`;
    const cached = this.getCachedData<BHIVTag>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response: AxiosResponse<BHIVTag> = await this.bhivClient.get(`/tags/${id}`);
      const tag = response.data;
      this.setCachedData(cacheKey, tag);
      return tag;
    } catch (error) {
      throw new Error(`Failed to fetch tag ${id}: ${error}`);
    }
  }

  async createTag(tagData: Partial<BHIVTag>): Promise<BHIVTag> {
    try {
      const response: AxiosResponse<BHIVTag> = await this.bhivClient.post('/tags', tagData);
      const tag = response.data;
      
      // Clear relevant cache
      this.cache.delete('tags:list');
      this.cache.delete(`tag:${tag.id}`);
      
      // Notify subscribers
      this.notifySubscribers('tag:created', tag);
      
      return tag;
    } catch (error) {
      throw new Error(`Failed to create tag: ${error}`);
    }
  }

  async updateTag(id: string, updates: Partial<BHIVTag>): Promise<BHIVTag> {
    try {
      const response: AxiosResponse<BHIVTag> = await this.bhivClient.put(`/tags/${id}`, updates);
      const tag = response.data;
      
      // Clear relevant cache
      this.cache.delete('tags:list');
      this.cache.delete(`tag:${id}`);
      
      // Notify subscribers
      this.notifySubscribers('tag:updated', tag);
      
      return tag;
    } catch (error) {
      throw new Error(`Failed to update tag ${id}: ${error}`);
    }
  }

  async deleteTag(id: string): Promise<void> {
    try {
      await this.bhivClient.delete(`/tags/${id}`);
      
      // Clear relevant cache
      this.cache.delete('tags:list');
      this.cache.delete(`tag:${id}`);
      
      // Notify subscribers
      this.notifySubscribers('tag:deleted', { id });
      
    } catch (error) {
      throw new Error(`Failed to delete tag ${id}: ${error}`);
    }
  }

  // Insight Bridge API methods
  async getTagInsights(tagId: string): Promise<InsightBridgeData> {
    const cacheKey = `insights:${tagId}`;
    const cached = this.getCachedData<InsightBridgeData>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response: AxiosResponse<InsightBridgeData> = await this.insightBridgeClient.get(`/insights/${tagId}`);
      const insights = response.data;
      this.setCachedData(cacheKey, insights);
      return insights;
    } catch (error) {
      throw new Error(`Failed to fetch insights for tag ${tagId}: ${error}`);
    }
  }

  async trackTagInteraction(tagId: string, interaction: {
    type: 'view' | 'click' | 'dismiss' | 'custom';
    data?: any;
  }): Promise<void> {
    try {
      await this.insightBridgeClient.post(`/analytics/${tagId}/interactions`, {
        ...interaction,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      });
      
      // Clear insights cache to force refresh
      this.cache.delete(`insights:${tagId}`);
      
      // Notify subscribers
      this.notifySubscribers('insights:updated', { tagId, interaction });
      
    } catch (error) {
      console.error(`Failed to track interaction for tag ${tagId}:`, error);
    }
  }

  async getRealtimeInsights(tagId: string): Promise<InsightBridgeData> {
    try {
      const response: AxiosResponse<InsightBridgeData> = await this.insightBridgeClient.get(`/realtime/${tagId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch realtime insights for tag ${tagId}: ${error}`);
    }
  }

  // Health check methods
  async checkBHIVHealth(): Promise<{ status: string; timestamp: string; latency?: number }> {
    const start = Date.now();
    try {
      const response = await this.bhivClient.get('/health');
      return {
        ...response.data,
        latency: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        latency: Date.now() - start,
      };
    }
  }

  async checkInsightBridgeHealth(): Promise<{ status: string; timestamp: string; latency?: number }> {
    const start = Date.now();
    try {
      const response = await this.insightBridgeClient.get('/health');
      return {
        ...response.data,
        latency: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        latency: Date.now() - start,
      };
    }
  }

  // Real-time updates setup
  setupRealtimeUpdates(tagId?: string): void {
    if (!this.config.enableRealTimeUpdates) {
      return;
    }

    // Simulate real-time updates using periodic polling
    const pollInterval = setInterval(async () => {
      try {
        if (tagId) {
          // Update specific tag insights
          const insights = await this.getRealtimeInsights(tagId);
          this.notifySubscribers('realtime:insights', { tagId, insights });
        } else {
          // Update all tags (less frequent)
          const tags = await this.getTags();
          for (const tag of tags) {
            const insights = await this.getRealtimeInsights(tag.id);
            this.notifySubscribers('realtime:insights', { tagId: tag.id, insights });
          }
        }
      } catch (error) {
        console.error('Error fetching realtime updates:', error);
      }
    }, 10000); // Poll every 10 seconds

    // Store interval ID for cleanup
    (this as any)._pollInterval = pollInterval;
  }

  cleanup(): void {
    // Clear cache
    this.cache.clear();
    
    // Clear subscribers
    this.subscribers.clear();
    
    // Stop polling
    if ((this as any)._pollInterval) {
      clearInterval((this as any)._pollInterval);
    }
    
    // Reset retry counts
    this.retryCount.clear();
  }
}

// Export singleton instance
export const bhivIntegrationService = new BHIVIntegrationService();

// Export utility functions
export const bhivUtils = {
  formatTagForDisplay: (tag: BHIVTag) => ({
    id: tag.id,
    name: tag.name,
    type: tag.type,
    status: tag.status,
    displayName: tag.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: `${tag.type.charAt(0).toUpperCase() + tag.type.slice(1)} tag for ${tag.configuration?.targetAudience?.join(', ') || 'general audience'}`,
  }),

  formatInsightsForChart: (insights: InsightBridgeData) => ({
    performanceScore: insights.metrics.performance_score,
    engagementScore: insights.metrics.engagement_score,
    trends: insights.analytics.performance_trends,
    recommendations: insights.analytics.recommendations,
  }),

  shouldShowTag: (tag: BHIVTag, userContext: any) => {
    if (tag.status !== 'active') return false;
    
    // Check target audience
    if (tag.configuration?.targetAudience?.length) {
      const userSegment = userContext?.segment || 'general';
      return tag.configuration.targetAudience.includes(userSegment);
    }
    
    return true;
  },
};