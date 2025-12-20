import axios, { AxiosResponse } from 'axios';

interface BackendHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastCheck: string;
  features: string[];
}

export interface MultiBackendStatus {
  backends: BackendHealth[];
  activeBackends: string[];
  primaryBackend: string;
  secondaryBackends: string[];
  overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: string;
  totalBackends: number;
  healthyBackends: number;
  degradedBackends: number;
  unhealthyBackends: number;
}

export interface BackendFeatureStatus {
  backend: string;
  features: {
    moderation: boolean;
    analytics: boolean;
    nlp: boolean;
    tags: boolean;
    security: boolean;
    audit: boolean;
    signature: boolean;
    jwt: boolean;
    nonce: boolean;
    hashchain: boolean;
  };
  lastCheck: string;
}

class MultiBackendHealthService {
  private healthCache = new Map<string, { data: MultiBackendStatus; timestamp: number }>();
  private featureCache = new Map<string, { data: BackendFeatureStatus[]; timestamp: number }>();
  private cacheTimeout = 30000; // 30 seconds
  private healthCheckInterval: number | null = null;

  // Backend configurations
  private backends = [
    {
      name: 'bhiv',
      baseURL: import.meta.env.VITE_BHIV_API_URL || 'http://localhost:8001',
      timeout: parseInt(import.meta.env.VITE_BHIV_TIMEOUT || '10000'),
      features: {
        moderation: true,
        analytics: import.meta.env.VITE_USE_BHIV_ANALYTICS === 'true',
        nlp: import.meta.env.VITE_USE_BHIV_NLP === 'true',
        tags: import.meta.env.VITE_USE_BHIV_TAGS === 'true',
        security: false,
        audit: false,
        signature: false,
        jwt: false,
        nonce: false,
        hashchain: false,
      },
    },
    {
      name: 'insightbridge',
      baseURL: import.meta.env.VITE_INSIGHTBRIDGE_API_URL || 'http://localhost:8004',
      timeout: parseInt(import.meta.env.VITE_INSIGHTBRIDGE_TIMEOUT || '5000'),
      features: {
        moderation: false,
        analytics: import.meta.env.VITE_USE_INSIGHTBRIDGE_BACKEND === 'true',
        nlp: false,
        tags: false,
        security: import.meta.env.VITE_USE_INSIGHTBRIDGE_SECURITY === 'true',
        audit: import.meta.env.VITE_USE_INSIGHTBRIDGE_AUDIT === 'true',
        signature: import.meta.env.VITE_USE_INSIGHTBRIDGE_SIGNATURE === 'true',
        jwt: import.meta.env.VITE_ENABLE_JWT_AUTH === 'true',
        nonce: import.meta.env.VITE_ENABLE_NONCE_PROTECTION === 'true',
        hashchain: import.meta.env.VITE_ENABLE_HASHCHAIN_AUDIT === 'true',
      },
    },
  ];

  constructor() {
    if (import.meta.env.VITE_ENABLE_BACKEND_HEALTH_CHECKS === 'true') {
      this.startPeriodicHealthCheck();
    }
  }

  /**
   * Start periodic health checks
   */
  private startPeriodicHealthCheck(): void {
    const interval = parseInt(import.meta.env.VITE_HEALTH_CHECK_INTERVAL || '30000');
    
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.getMultiBackendStatus(true); // Silent health check
      } catch (error) {
        console.warn('Periodic multi-backend health check failed:', error);
      }
    }, interval);
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
   * Get comprehensive multi-backend status
   */
  public async getMultiBackendStatus(silent = false): Promise<MultiBackendStatus> {
    const cacheKey = 'multi_backend_status';
    const cached = this.healthCache.get(cacheKey);

    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      if (!silent) {
        console.log('Returning cached multi-backend status');
      }
      return cached.data;
    }

    try {
      const healthPromises = this.backends.map(async (backend) => {
        const startTime = Date.now();
        
        try {
          const response = await axios.get(`${backend.baseURL}/health`, {
            timeout: backend.timeout,
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          const responseTime = Date.now() - startTime;
          
          return {
            name: backend.name,
            status: 'healthy' as const,
            responseTime,
            lastCheck: new Date().toISOString(),
            features: this.getEnabledFeatures(backend),
          };
        } catch (error) {
          const responseTime = Date.now() - startTime;
          console.warn(`Backend ${backend.name} health check failed:`, error);
          
          return {
            name: backend.name,
            status: 'degraded' as const,
            responseTime,
            lastCheck: new Date().toISOString(),
            features: [],
          };
        }
      });

      const results = await Promise.allSettled(healthPromises);
      const backends = results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            name: this.backends[index].name,
            status: 'unhealthy' as const,
            responseTime: 0,
            lastCheck: new Date().toISOString(),
            features: [],
          };
        }
      });

      // Calculate aggregate status
      const healthyCount = backends.filter(b => b.status === 'healthy').length;
      const degradedCount = backends.filter(b => b.status === 'degraded').length;
      const unhealthyCount = backends.filter(b => b.status === 'unhealthy').length;

      let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
      if (healthyCount > 0) {
        overallStatus = degradedCount === 0 ? 'healthy' : 'degraded';
      } else if (degradedCount > 0) {
        overallStatus = 'degraded';
      } else {
        overallStatus = 'unhealthy';
      }

      const activeBackends = backends
        .filter(b => b.status !== 'unhealthy')
        .map(b => b.name);

      const statusData: MultiBackendStatus = {
        backends,
        activeBackends,
        primaryBackend: import.meta.env.VITE_PRIMARY_BACKEND || 'bhiv',
        secondaryBackends: this.backends.map(b => b.name).filter(name => name !== (import.meta.env.VITE_PRIMARY_BACKEND || 'bhiv')),
        overallStatus,
        lastCheck: new Date().toISOString(),
        totalBackends: backends.length,
        healthyBackends: healthyCount,
        degradedBackends: degradedCount,
        unhealthyBackends: unhealthyCount,
      };

      // Cache the response
      this.healthCache.set(cacheKey, {
        data: statusData,
        timestamp: Date.now(),
      });

      if (!silent) {
        console.log('Multi-backend health check completed:', statusData.overallStatus);
      }

      return statusData;
    } catch (error) {
      console.error('Multi-backend health check failed:', error);
      
      // Return fallback status
      return {
        backends: [],
        activeBackends: [],
        primaryBackend: 'bhiv',
        secondaryBackends: [],
        overallStatus: 'unhealthy',
        lastCheck: new Date().toISOString(),
        totalBackends: 0,
        healthyBackends: 0,
        degradedBackends: 0,
        unhealthyBackends: 0,
      };
    }
  }

  /**
   * Get feature status for all backends
   */
  public async getFeatureStatus(): Promise<BackendFeatureStatus[]> {
    const cacheKey = 'feature_status';
    const cached = this.featureCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log('Returning cached feature status');
      return cached.data;
    }

    try {
      const featurePromises = this.backends.map(async (backend) => {
        try {
          // Test different endpoints based on backend type
          let endpoint = '/';
          if (backend.name === 'insightbridge') {
            endpoint = '/audit/status';
          }

          await axios.get(`${backend.baseURL}${endpoint}`, {
            timeout: backend.timeout,
          });

          return {
            backend: backend.name,
            features: backend.features,
            lastCheck: new Date().toISOString(),
          };
        } catch (error) {
          return {
            backend: backend.name,
            features: Object.keys(backend.features).reduce((acc, key) => {
              acc[key] = false;
              return acc;
            }, {} as any),
            lastCheck: new Date().toISOString(),
          };
        }
      });

      const results = await Promise.allSettled(featurePromises);
      const featureStatus = results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          const backend = this.backends[index];
          return {
            backend: backend.name,
            features: Object.keys(backend.features).reduce((acc, key) => {
              acc[key] = false;
              return acc;
            }, {} as any),
            lastCheck: new Date().toISOString(),
          };
        }
      });

      // Cache the response
      this.featureCache.set(cacheKey, {
        data: featureStatus,
        timestamp: Date.now(),
      });

      return featureStatus;
    } catch (error) {
      console.error('Feature status check failed:', error);
      throw error;
    }
  }

  /**
   * Test connectivity to a specific backend
   */
  public async testBackendConnectivity(backendName: string): Promise<{
    success: boolean;
    responseTime: number;
    status: string;
    features: string[];
  }> {
    const backend = this.backends.find(b => b.name === backendName);
    if (!backend) {
      throw new Error(`Backend ${backendName} not found`);
    }

    const startTime = Date.now();
    
    try {
      const response = await axios.get(`${backend.baseURL}/health`, {
        timeout: backend.timeout,
      });
      
      const responseTime = Date.now() - startTime;
      
      return {
        success: true,
        responseTime,
        status: 'healthy',
        features: this.getEnabledFeatures(backend),
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        success: false,
        responseTime,
        status: 'unreachable',
        features: [],
      };
    }
  }

  /**
   * Get the best available backend based on priority and health
   */
  public getBestBackend(): string {
    const sortedBackends = [...this.backends].sort((a, b) => {
      const aPriority = a.name === (import.meta.env.VITE_PRIMARY_BACKEND || 'bhiv') ? 1 : 2;
      const bPriority = b.name === (import.meta.env.VITE_PRIMARY_BACKEND || 'bhiv') ? 1 : 2;
      return aPriority - bPriority;
    });

    // For now, return the primary backend
    // In a real implementation, you'd check health status here
    return sortedBackends[0].name;
  }

  /**
   * Clear all caches
   */
  public clearCache(): void {
    this.healthCache.clear();
    this.featureCache.clear();
    console.log('Multi-backend caches cleared');
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    healthCacheSize: number;
    featureCacheSize: number;
    totalBackends: number;
  } {
    return {
      healthCacheSize: this.healthCache.size,
      featureCacheSize: this.featureCache.size,
      totalBackends: this.backends.length,
    };
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.stopPeriodicHealthCheck();
    this.clearCache();
  }

  /**
   * Get enabled features for a backend
   */
  private getEnabledFeatures(backend: any): string[] {
    return Object.entries(backend.features)
      .filter(([_, enabled]) => enabled)
      .map(([feature, _]) => feature);
  }
}

// Export singleton instance
export const multiBackendHealthService = new MultiBackendHealthService();
export default multiBackendHealthService;

// Export the class for testing
export { MultiBackendHealthService };