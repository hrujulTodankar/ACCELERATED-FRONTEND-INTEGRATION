import axios, { AxiosResponse } from 'axios';

export interface BHIVHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime_seconds: number;
  services: {
    api: string;
    engine: string;
  };
  metrics: {
    total_requests: number;
    successful_requests: number;
  };
}

export interface BHIVCacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export interface BHIVSystemInfo {
  api_status: string;
  mode: string;
  features: Record<string, boolean>;
  ports: Record<string, string>;
  timestamp: string;
}

class BHIVHealthService {
  private healthCache: Map<string, BHIVCacheEntry<BHIVHealthStatus>> = new Map();
  private systemCache: Map<string, BHIVCacheEntry<BHIVSystemInfo>> = new Map();
  private cacheTimeout = 30000; // 30 seconds
  private healthCheckInterval: number | null = null;
  private lastHealthCheck: BHIVHealthStatus | null = null;

  private api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001',
    timeout: 5000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    this.startPeriodicHealthCheck();
  }

  /**
   * Start periodic health checks every 30 seconds
   */
  private startPeriodicHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.getHealthStatus(true); // Silent health check
      } catch (error) {
        console.warn('Periodic health check failed:', error);
      }
    }, this.cacheTimeout);
  }

  /**
   * Stop periodic health checks
   */
  public stopPeriodicHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Get cached or fresh health status
   */
  public async getHealthStatus(silent = false): Promise<BHIVHealthStatus> {
    const cacheKey = 'bhiv_health';
    const cached = this.healthCache.get(cacheKey);

    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      if (!silent) {
        console.log('Returning cached BHIV health status');
      }
      return cached.data;
    }

    try {
      const response: AxiosResponse<BHIVHealthStatus> = await this.api.get('/health');
      const healthData = response.data;
      
      // Cache the response
      this.healthCache.set(cacheKey, {
        data: healthData,
        timestamp: Date.now(),
        ttl: this.cacheTimeout,
      });

      this.lastHealthCheck = healthData;
      
      if (!silent) {
        console.log('BHIV API health check successful:', healthData.status);
      }
      
      return healthData;
    } catch (error) {
      console.error('BHIV API health check failed:', error);
      
      // Return last known good status if available
      if (this.lastHealthCheck) {
        return {
          ...this.lastHealthCheck,
          status: 'degraded' as const,
          timestamp: new Date().toISOString(),
        };
      }

      // Return unhealthy status
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime_seconds: 0,
        services: {
          api: 'unreachable',
          engine: 'unknown',
        },
        metrics: {
          total_requests: 0,
          successful_requests: 0,
        },
      };
    }
  }

  /**
   * Get cached or fresh system information
   */
  public async getSystemInfo(): Promise<BHIVSystemInfo> {
    const cacheKey = 'bhiv_system';
    const cached = this.systemCache.get(cacheKey);

    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      console.log('Returning cached BHIV system info');
      return cached.data;
    }

    try {
      const response: AxiosResponse<BHIVSystemInfo> = await this.api.get('/status');
      const systemData = response.data;
      
      // Cache the response
      this.systemCache.set(cacheKey, {
        data: systemData,
        timestamp: Date.now(),
        ttl: this.cacheTimeout,
      });

      console.log('BHIV system info retrieved successfully');
      return systemData;
    } catch (error) {
      console.error('Failed to get BHIV system info:', error);
      
      // Return fallback system info
      return {
        api_status: 'unknown',
        mode: 'offline',
        features: {
          vedas_endpoint: false,
          edumentor_endpoint: false,
          wellness_endpoint: false,
          health_monitoring: true,
          cors_enabled: true,
        },
        ports: {
          api: '8001',
          web_interface: '8003',
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Clear all caches
   */
  public clearCache(): void {
    this.healthCache.clear();
    this.systemCache.clear();
    console.log('BHIV caches cleared');
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    healthCacheSize: number;
    systemCacheSize: number;
    lastHealthCheck: string | null;
  } {
    return {
      healthCacheSize: this.healthCache.size,
      systemCacheSize: this.systemCache.size,
      lastHealthCheck: this.lastHealthCheck?.timestamp || null,
    };
  }

  /**
   * Test connectivity to BHIV API
   */
  public async testConnectivity(): Promise<{
    success: boolean;
    responseTime: number;
    status: string;
  }> {
    const startTime = Date.now();
    
    try {
      const response = await this.api.get('/');
      const responseTime = Date.now() - startTime;
      
      return {
        success: true,
        responseTime,
        status: response.data.status || 'running',
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        success: false,
        responseTime,
        status: 'unreachable',
      };
    }
  }

  /**
   * Batch process queries for performance
   */
  public async batchQuery(endpoint: string, queries: string[]): Promise<any[]> {
    const promises = queries.map(query => 
      this.api.get(`/${endpoint}`, { params: { query } })
        .then(response => response.data)
        .catch(error => ({ error: error.message, query }))
    );

    try {
      const results = await Promise.allSettled(promises);
      return results.map((result, index) => ({
        query: queries[index],
        result: result.status === 'fulfilled' ? result.value : { error: 'Failed' },
      }));
    } catch (error) {
      console.error('Batch query failed:', error);
      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.stopPeriodicHealthCheck();
    this.clearCache();
  }
}

// Export singleton instance
export const bhivHealthService = new BHIVHealthService();
export default bhivHealthService;