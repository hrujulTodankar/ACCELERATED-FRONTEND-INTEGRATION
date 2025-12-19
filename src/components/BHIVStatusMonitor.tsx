import React, { useState, useEffect } from 'react';
import { BHIVHealthStatus, BHIVSystemInfo } from '../services/bhivHealthService';
import { CacheStats } from '../services/bhivCacheService';
import { bhivHealthService } from '../services/bhivHealthService';
import { bhivCacheService } from '../services/bhivCacheService';

interface BHIVStatusMonitorProps {
  className?: string;
}

const BHIVStatusMonitor: React.FC<BHIVStatusMonitorProps> = ({ className = '' }) => {
  const [healthStatus, setHealthStatus] = useState<BHIVHealthStatus | null>(null);
  const [systemInfo, setSystemInfo] = useState<BHIVSystemInfo | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [health, system, cache] = await Promise.all([
        bhivHealthService.getHealthStatus(),
        bhivHealthService.getSystemInfo(),
        Promise.resolve(bhivCacheService.getStats()),
      ]);

      setHealthStatus(health);
      setSystemInfo(system);
      setCacheStats(cache);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Set up periodic updates every 30 seconds
    const interval = setInterval(fetchStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getCacheHealthColor = (hitRate: number) => {
    if (hitRate >= 70) return 'text-green-600';
    if (hitRate >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading && !healthStatus) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">BHIV System Status</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchStatus}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Updating...' : 'Refresh'}
          </button>
          <span className="text-xs text-gray-500">
            Last: {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* API Health Status */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-700 mb-2">API Health</h3>
          {healthStatus ? (
            <div className="space-y-2">
              <div className={`inline-block px-2 py-1 rounded text-sm font-medium ${getStatusColor(healthStatus.status)}`}>
                {healthStatus.status.toUpperCase()}
              </div>
              <div className="text-sm text-gray-600">
                <div>Uptime: {Math.floor(healthStatus.uptime_seconds / 3600)}h {Math.floor((healthStatus.uptime_seconds % 3600) / 60)}m</div>
                <div>Requests: {healthStatus.metrics.total_requests}</div>
                <div>Success Rate: {healthStatus.metrics.total_requests > 0 
                  ? Math.round((healthStatus.metrics.successful_requests / healthStatus.metrics.total_requests) * 100)
                  : 0}%
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">No data available</div>
          )}
        </div>

        {/* System Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-700 mb-2">System Info</h3>
          {systemInfo ? (
            <div className="space-y-2 text-sm text-gray-600">
              <div>Mode: <span className="font-medium">{systemInfo.mode}</span></div>
              <div>Status: <span className="font-medium">{systemInfo.api_status}</span></div>
              <div>Active Endpoints: {Object.entries(systemInfo.features)
                .filter(([_, enabled]) => enabled)
                .map(([name]) => name)
                .join(', ')}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">No data available</div>
          )}
        </div>

        {/* Cache Performance */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-700 mb-2">Cache Performance</h3>
          {cacheStats ? (
            <div className="space-y-2 text-sm text-gray-600">
              <div>Hit Rate: <span className={`font-medium ${getCacheHealthColor(cacheStats.hitRate)}`}>
                {cacheStats.hitRate}%
              </span></div>
              <div>Entries: {cacheStats.totalEntries}</div>
              <div>Requests: {cacheStats.totalRequests}</div>
              <div>Memory: {Math.round(cacheStats.memoryUsage / 1024)}KB</div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">No data available</div>
          )}
        </div>
      </div>

      {/* Endpoint Status */}
      {systemInfo && (
        <div className="mt-6">
          <h3 className="font-semibold text-gray-700 mb-3">Endpoint Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Object.entries(systemInfo.features).map(([endpoint, enabled]) => (
              <div key={endpoint} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {endpoint.replace('_', ' ')}
                </span>
                <div className={`w-3 h-3 rounded-full ${enabled ? 'bg-green-400' : 'bg-red-400'}`}></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      {healthStatus && (
        <div className="mt-6">
          <h3 className="font-semibold text-gray-700 mb-3">Performance Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded">
              <div className="text-lg font-bold text-blue-600">{healthStatus.metrics.total_requests}</div>
              <div className="text-sm text-gray-600">Total Requests</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded">
              <div className="text-lg font-bold text-green-600">{healthStatus.metrics.successful_requests}</div>
              <div className="text-sm text-gray-600">Successful</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded">
              <div className="text-lg font-bold text-yellow-600">
                {healthStatus.metrics.total_requests - healthStatus.metrics.successful_requests}
              </div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded">
              <div className="text-lg font-bold text-purple-600">
                {healthStatus.metrics.total_requests > 0 
                  ? Math.round((healthStatus.metrics.successful_requests / healthStatus.metrics.total_requests) * 100)
                  : 0}%
              </div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
          </div>
        </div>
      )}

      {/* Connection Information */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Connection Information</h3>
        <div className="text-sm text-blue-700">
          <div>API Endpoint: {import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'}</div>
          <div>Web Interface: http://localhost:8003</div>
          <div>Mode: {systemInfo?.mode || 'Unknown'}</div>
        </div>
      </div>
    </div>
  );
};

export default BHIVStatusMonitor;