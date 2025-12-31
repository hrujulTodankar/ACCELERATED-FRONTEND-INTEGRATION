/**
 * Integration Service for Adaptive Tags System
 * Coordinates between BHIV Core and Insight Bridge backends
 * Provides unified API for frontend components
 */

// Types
export interface TagDefinition {
  id: string;
  name: string;
  category: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface TagInsight {
  tagId: string;
  confidence: number;
  recommendations: string[];
  analytics: {
    views: number;
    interactions: number;
    conversions: number;
    lastActivity: string;
  };
  behavioralInsights: {
    userEngagement: number;
    contentRelevance: number;
    personalizationScore: number;
  };
  updatedAt: string;
}

export interface AdaptiveTag {
  definition: TagDefinition;
  insight: TagInsight;
  state: 'active' | 'inactive' | 'learning' | 'optimizing';
  renderingConfig: {
    position: 'top' | 'bottom' | 'sidebar' | 'inline';
    style: 'minimal' | 'standard' | 'enhanced';
    animations: boolean;
  };
}

export interface IntegrationConfig {
  bhivCoreUrl: string;
  insightBridgeUrl: string;
  pollingInterval: number;
  enableRealTimeUpdates: boolean;
  cacheTimeout: number;
}

// Simple Event Emitter for browser compatibility
class SimpleEventEmitter {
  private events: Map<string, Function[]> = new Map();

  on(event: string, listener: Function): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(listener);
  }

  emit(event: string, ...args: any[]): void {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(...args));
    }
  }

  off(event: string, listener: Function): void {
    const listeners = this.events.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  removeAllListeners(): void {
    this.events.clear();
  }

  listeners(event: string): Function[] {
    return this.events.get(event) || [];
  }
}

export class AdaptiveTagsIntegrationService extends SimpleEventEmitter {
  private config: IntegrationConfig;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private isInitialized = false;

  constructor(config: IntegrationConfig) {
    super();
    this.config = {
      pollingInterval: 30000, // 30 seconds
      enableRealTimeUpdates: true,
      cacheTimeout: 60000, // 1 minute
      ...config
    };
  }

  /**
   * Initialize the integration service
   */
  async initialize(): Promise<void> {
    try {
      // Test connectivity to both backends
      await Promise.all([
        this.testBhivCoreConnection(),
        this.testInsightBridgeConnection()
      ]);

      this.isInitialized = true;
      this.emit('initialized');

      if (this.config.enableRealTimeUpdates) {
        this.startPeriodicUpdates();
      }
    } catch (error) {
      this.emit('error', { source: 'initialization', error });
      throw error;
    }
  }

  /**
   * Get all adaptive tags with their current insights
   */
  async getAdaptiveTags(): Promise<AdaptiveTag[]> {
    const cacheKey = 'adaptive_tags';
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      // Fetch tag definitions from BHIV Core
      const tagDefinitions = await this.fetchTagDefinitions();
      
      // Fetch insights for all tags from Insight Bridge
      const insights = await this.fetchTagInsights(tagDefinitions.map(t => t.id));
      
      // Combine definitions with insights
      const adaptiveTags: AdaptiveTag[] = tagDefinitions.map(definition => {
        const insight = insights.find(i => i.tagId === definition.id);
        return this.createAdaptiveTag(definition, insight);
      });

      this.setCache(cacheKey, adaptiveTags);
      return adaptiveTags;
    } catch (error) {
      this.emit('error', { source: 'getAdaptiveTags', error });
      throw error;
    }
  }

  /**
   * Get a specific adaptive tag by ID
   */
  async getAdaptiveTag(tagId: string): Promise<AdaptiveTag | null> {
    const cacheKey = `adaptive_tag_${tagId}`;
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const [definition, insight] = await Promise.all([
        this.fetchTagDefinition(tagId),
        this.fetchTagInsight(tagId)
      ]);

      if (!definition) {
        return null;
      }

      const adaptiveTag = this.createAdaptiveTag(definition, insight);
      this.setCache(cacheKey, adaptiveTag);
      return adaptiveTag;
    } catch (error) {
      this.emit('error', { source: 'getAdaptiveTag', error });
      throw error;
    }
  }

  /**
   * Create a new adaptive tag
   */
  async createAdaptiveTag(definition: Omit<TagDefinition, 'id' | 'createdAt' | 'updatedAt'>): Promise<AdaptiveTag> {
    try {
      const newTag = await this.createTagDefinition(definition);
      const insight = await this.fetchTagInsight(newTag.id);
      
      const adaptiveTag = this.createAdaptiveTag(newTag, insight);
      
      // Invalidate cache
      this.invalidateCache('adaptive_tags');
      
      this.emit('tagCreated', adaptiveTag);
      return adaptiveTag;
    } catch (error) {
      this.emit('error', { source: 'createAdaptiveTag', error });
      throw error;
    }
  }

  /**
   * Update an existing adaptive tag
   */
  async updateAdaptiveTag(tagId: string, updates: Partial<TagDefinition>): Promise<AdaptiveTag> {
    try {
      const updatedDefinition = await this.updateTagDefinition(tagId, updates);
      const insight = await this.fetchTagInsight(tagId);
      
      const adaptiveTag = this.createAdaptiveTag(updatedDefinition, insight);
      
      // Invalidate related caches
      this.invalidateCache(`adaptive_tag_${tagId}`);
      this.invalidateCache('adaptive_tags');
      
      this.emit('tagUpdated', adaptiveTag);
      return adaptiveTag;
    } catch (error) {
      this.emit('error', { source: 'updateAdaptiveTag', error });
      throw error;
    }
  }

  /**
   * Subscribe to real-time updates for a specific tag
   */
  subscribeToTagUpdates(tagId: string, callback: (adaptiveTag: AdaptiveTag) => void): () => void {
    const eventName = `tagUpdate_${tagId}`;
    this.on(eventName, callback);

    // Start polling for this specific tag if not already running
    if (!this.pollingIntervals.has(tagId)) {
      const interval = setInterval(async () => {
        try {
          const adaptiveTag = await this.getAdaptiveTag(tagId);
          if (adaptiveTag) {
            this.emit(eventName, adaptiveTag);
          }
        } catch (error) {
          this.emit('error', { source: `polling_${tagId}`, error });
        }
      }, this.config.pollingInterval);

      this.pollingIntervals.set(tagId, interval);
    }

    // Return unsubscribe function
    return () => {
      this.off(eventName, callback);
      
      // Clean up polling interval if no more listeners
      const listeners = this.listeners(eventName);
      if (listeners.length === 0) {
        const interval = this.pollingIntervals.get(tagId);
        if (interval) {
          clearInterval(interval);
          this.pollingIntervals.delete(tagId);
        }
      }
    };
  }

  /**
   * Get analytics dashboard data
   */
  async getAnalyticsDashboard(): Promise<{
    totalTags: number;
    activeTags: number;
    averageConfidence: number;
    topPerformingTags: AdaptiveTag[];
    recentActivity: TagInsight[];
  }> {
    try {
      const adaptiveTags = await this.getAdaptiveTags();
      
      const totalTags = adaptiveTags.length;
      const activeTags = adaptiveTags.filter(tag => tag.state === 'active').length;
      const averageConfidence = adaptiveTags.reduce((sum, tag) => sum + tag.insight.confidence, 0) / totalTags;
      
      const topPerformingTags = adaptiveTags
        .sort((a, b) => b.insight.confidence - a.insight.confidence)
        .slice(0, 5);
      
      const recentActivity = adaptiveTags
        .map(tag => tag.insight)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 10);

      return {
        totalTags,
        activeTags,
        averageConfidence,
        topPerformingTags,
        recentActivity
      };
    } catch (error) {
      this.emit('error', { source: 'getAnalyticsDashboard', error });
      throw error;
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Clear all polling intervals
    this.pollingIntervals.forEach(interval => clearInterval(interval));
    this.pollingIntervals.clear();

    // Clear cache
    this.cache.clear();

    // Remove all listeners
    this.removeAllListeners();

    this.isInitialized = false;
  }

  // Private helper methods

  private async testBhivCoreConnection(): Promise<void> {
    const response = await fetch(`${this.config.bhivCoreUrl}/api/health`);
    if (!response.ok) {
      throw new Error(`BHIV Core connection failed: ${response.status}`);
    }
  }

  private async testInsightBridgeConnection(): Promise<void> {
    const response = await fetch(`${this.config.insightBridgeUrl}/api/health`);
    if (!response.ok) {
      throw new Error(`Insight Bridge connection failed: ${response.status}`);
    }
  }

  private async fetchTagDefinitions(): Promise<TagDefinition[]> {
    const response = await fetch(`${this.config.bhivCoreUrl}/api/tags`);
    if (!response.ok) {
      throw new Error(`Failed to fetch tag definitions: ${response.status}`);
    }
    return response.json();
  }

  private async fetchTagDefinition(tagId: string): Promise<TagDefinition | null> {
    const response = await fetch(`${this.config.bhivCoreUrl}/api/tags/${tagId}`);
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error(`Failed to fetch tag definition: ${response.status}`);
    }
    return response.json();
  }

  private async createTagDefinition(definition: Omit<TagDefinition, 'id' | 'createdAt' | 'updatedAt'>): Promise<TagDefinition> {
    const response = await fetch(`${this.config.bhivCoreUrl}/api/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(definition)
    });
    if (!response.ok) {
      throw new Error(`Failed to create tag definition: ${response.status}`);
    }
    return response.json();
  }

  private async updateTagDefinition(tagId: string, updates: Partial<TagDefinition>): Promise<TagDefinition> {
    const response = await fetch(`${this.config.bhivCoreUrl}/api/tags/${tagId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!response.ok) {
      throw new Error(`Failed to update tag definition: ${response.status}`);
    }
    return response.json();
  }

  private async fetchTagInsights(tagIds: string[]): Promise<TagInsight[]> {
    const response = await fetch(`${this.config.insightBridgeUrl}/api/insights/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tagIds })
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch tag insights: ${response.status}`);
    }
    return response.json();
  }

  private async fetchTagInsight(tagId: string): Promise<TagInsight> {
    const response = await fetch(`${this.config.insightBridgeUrl}/api/insights/${tagId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch tag insight: ${response.status}`);
    }
    return response.json();
  }

  private createAdaptiveTag(definition: TagDefinition, insight: TagInsight | undefined): AdaptiveTag {
    const state = this.determineTagState(definition, insight);
    
    return {
      definition,
      insight: insight || this.createDefaultInsight(definition.id),
      state,
      renderingConfig: this.generateRenderingConfig(definition, insight)
    };
  }

  private determineTagState(definition: TagDefinition, insight?: TagInsight): 'active' | 'inactive' | 'learning' | 'optimizing' {
    if (!insight) return 'inactive';
    
    if (insight.confidence > 0.8) return 'optimizing';
    if (insight.confidence > 0.5) return 'active';
    if (insight.confidence > 0.2) return 'learning';
    return 'inactive';
  }

  private generateRenderingConfig(definition: TagDefinition, insight?: TagInsight) {
    const confidence = insight?.confidence || 0;
    
    return {
      position: confidence > 0.7 ? 'top' : 'bottom',
      style: confidence > 0.8 ? 'enhanced' : confidence > 0.5 ? 'standard' : 'minimal',
      animations: confidence > 0.6
    };
  }

  private createDefaultInsight(tagId: string): TagInsight {
    return {
      tagId,
      confidence: 0.5,
      recommendations: ['Initialize tag analytics'],
      analytics: {
        views: 0,
        interactions: 0,
        conversions: 0,
        lastActivity: new Date().toISOString()
      },
      behavioralInsights: {
        userEngagement: 0,
        contentRelevance: 0,
        personalizationScore: 0
      },
      updatedAt: new Date().toISOString()
    };
  }

  private startPeriodicUpdates(): void {
    const interval = setInterval(async () => {
      try {
        const adaptiveTags = await this.getAdaptiveTags();
        this.emit('periodicUpdate', adaptiveTags);
      } catch (error) {
        this.emit('error', { source: 'periodicUpdate', error });
      }
    }, this.config.pollingInterval);

    this.pollingIntervals.set('global', interval);
  }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.config.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private invalidateCache(pattern?: string): void {
    if (pattern) {
      // Invalidate cache keys matching the pattern
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
    }
  }
}

// Helper function to get environment variables safely
function getEnvVar(name: string, defaultValue: string): string {
  // For browser/frontend context
  if (typeof window !== 'undefined' && (window as any).ENV) {
    return (window as any).ENV[name] || defaultValue;
  }
  // For Node.js context
  if (typeof process !== 'undefined' && process.env) {
    return process.env[name] || defaultValue;
  }
  return defaultValue;
}

// Helper function to get boolean environment variables
function getEnvBool(name: string, defaultValue: boolean): boolean {
  const value = getEnvVar(name, defaultValue.toString());
  return value === 'true';
}

// Helper function to get numeric environment variables
function getEnvNumber(name: string, defaultValue: number): number {
  const value = getEnvVar(name, defaultValue.toString());
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

// Default configuration
const defaultConfig: IntegrationConfig = {
  bhivCoreUrl: getEnvVar('BHIV_CORE_URL', 'http://localhost:3001'),
  insightBridgeUrl: getEnvVar('INSIGHT_BRIDGE_URL', 'http://localhost:3002'),
  pollingInterval: getEnvNumber('POLLING_INTERVAL', 30000),
  enableRealTimeUpdates: getEnvBool('ENABLE_REAL_TIME_UPDATES', true),
  cacheTimeout: getEnvNumber('CACHE_TIMEOUT', 60000)
};

// Export singleton instance
export const adaptiveTagsIntegration = new AdaptiveTagsIntegrationService(defaultConfig);

export default AdaptiveTagsIntegrationService;