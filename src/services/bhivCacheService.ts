/**
 * BHIV Cache Service - Caching layer for improved performance
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  accessCount: number;
  lastAccessed: number;
}

export interface CacheStats {
  totalEntries: number;
  hitRate: number;
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  memoryUsage: number;
}

class BHIVCacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private stats = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };

  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  private maxCacheSize = 1000; // Maximum number of cache entries

  /**
   * Get data from cache
   */
  public get<T>(key: string): T | null {
    this.stats.totalRequests++;
    
    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.cacheMisses++;
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.cacheMisses++;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.cacheHits++;

    return entry.data;
  }

  /**
   * Set data in cache
   */
  public set<T>(key: string, data: T, ttl?: number): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      accessCount: 1,
      lastAccessed: Date.now(),
    };

    this.cache.set(key, entry);
  }

  /**
   * Check if key exists in cache and is valid
   */
  public has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete entry from cache
   */
  public delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  public clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  public getStats(): CacheStats {
    const hitRate = this.stats.totalRequests > 0 
      ? (this.stats.cacheHits / this.stats.totalRequests) * 100 
      : 0;

    // Estimate memory usage (rough calculation)
    const memoryUsage = Array.from(this.cache.values())
      .reduce((total, entry) => total + JSON.stringify(entry).length, 0);

    return {
      totalEntries: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100,
      totalRequests: this.stats.totalRequests,
      cacheHits: this.stats.cacheHits,
      cacheMisses: this.stats.cacheMisses,
      memoryUsage,
    };
  }

  /**
   * Get all cache keys
   */
  public keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache entries with metadata
   */
  public entries(): Array<{ key: string; entry: CacheEntry<any> }> {
    return Array.from(this.cache.entries()).map(([key, entry]) => ({ key, entry }));
  }

  /**
   * Evict oldest accessed entries
   */
  private evictOldest(): void {
    if (this.cache.size === 0) return;

    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Clean up expired entries
   */
  public cleanup(): number {
    let cleanedCount = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * Warm up cache with frequently accessed data
   */
  public async warmUp(warmUpTasks: Array<() => Promise<any>>): Promise<void> {
    console.log('Starting cache warm-up...');
    
    const promises = warmUpTasks.map(async (task, index) => {
      try {
        await task();
        console.log(`Warm-up task ${index + 1} completed`);
      } catch (error) {
        console.warn(`Warm-up task ${index + 1} failed:`, error);
      }
    });

    await Promise.allSettled(promises);
    console.log('Cache warm-up completed');
  }

  /**
   * Batch cache operations for better performance
   */
  public batchSet(entries: Array<{ key: string; data: any; ttl?: number }>): void {
    entries.forEach(({ key, data, ttl }) => {
      this.set(key, data, ttl);
    });
  }

  /**
   * Get cache configuration
   */
  public getConfig(): {
    defaultTTL: number;
    maxCacheSize: number;
    currentSize: number;
  } {
    return {
      defaultTTL: this.defaultTTL,
      maxCacheSize: this.maxCacheSize,
      currentSize: this.cache.size,
    };
  }

  /**
   * Update cache configuration
   */
  public updateConfig(config: { defaultTTL?: number; maxCacheSize?: number }): void {
    if (config.defaultTTL !== undefined) {
      this.defaultTTL = config.defaultTTL;
    }
    if (config.maxCacheSize !== undefined) {
      this.maxCacheSize = config.maxCacheSize;
    }
  }

  /**
   * Preload analytics data for better performance
   */
  public async preloadAnalytics(): Promise<void> {
    const warmUpTasks = [
      // Simulate analytics data loading
      () => Promise.resolve().then(() => {
        this.set('analytics:overview', {
          totalQueries: 1250,
          avgResponseTime: 1.2,
          successRate: 0.94,
          activeEndpoints: ['ask-vedas', 'edumentor', 'wellness'],
        }, 2 * 60 * 1000); // 2 minutes TTL
      }),
      
      // Simulate system metrics
      () => Promise.resolve().then(() => {
        this.set('analytics:metrics', {
          requestsPerMinute: 45,
          errorRate: 0.06,
          uptime: '99.8%',
          lastUpdate: new Date().toISOString(),
        }, 30 * 1000); // 30 seconds TTL
      }),
    ];

    await this.warmUp(warmUpTasks);
  }

  /**
   * Get cache health status
   */
  public getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    message: string;
    details: any;
  } {
    const stats = this.getStats();
    const config = this.getConfig();

    // Determine health status based on metrics
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let message = 'Cache is operating normally';

    if (stats.hitRate < 50 && stats.totalRequests > 100) {
      status = 'degraded';
      message = 'Low cache hit rate detected';
    }

    if (config.currentSize >= config.maxCacheSize) {
      status = 'degraded';
      message = 'Cache is at capacity';
    }

    if (stats.totalRequests === 0) {
      status = 'unhealthy';
      message = 'No cache activity detected';
    }

    return {
      status,
      message,
      details: {
        hitRate: `${stats.hitRate}%`,
        size: `${config.currentSize}/${config.maxCacheSize}`,
        totalRequests: stats.totalRequests,
      },
    };
  }
}

// Export singleton instance
export const bhivCacheService = new BHIVCacheService();
export default bhivCacheService;