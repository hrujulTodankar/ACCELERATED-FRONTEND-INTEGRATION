/**
 * Unified Integration Hooks
 * React hooks for the unified integration system providing seamless access
 * to all integration services and their features
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useIntegrationStore } from '../store/integrationStore';
import { unifiedIntegrationService } from '../services/unifiedIntegrationService';
import { enhancedAuthService } from '../services/enhancedAuthService';
import { communicationProtocolService } from '../services/communicationProtocolService';
import { 
  IntegrationEvent, 
  IntegrationEventType 
} from '../services/unifiedIntegrationService';
import { 
  MessagePriority,
  CommunicationProtocol 
} from '../services/communicationProtocolService';
import { 
  User, 
  AuthToken 
} from '../services/enhancedAuthService';

// Unified Authentication Hook
export const useUnifiedAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await enhancedAuthService.authenticateUser(
        email, 
        password, 
        '127.0.0.1', // Would get from browser
        navigator.userAgent
      );

      if (response.success && response.token && response.user) {
        setIsAuthenticated(true);
        setUser(response.user);
        setToken(response.token.accessToken);
        setPermissions(response.token.scope);
        
        // Store in localStorage for persistence
        localStorage.setItem('unified_token', response.token.accessToken);
        localStorage.setItem('unified_refresh_token', response.token.refreshToken);
        
        return response;
      } else {
        throw new Error(response.error || 'Authentication failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
    setPermissions([]);
    setError(null);
    
    // Clear stored tokens
    localStorage.removeItem('unified_token');
    localStorage.removeItem('unified_refresh_token');
  }, []);

  const validateToken = useCallback(async (tokenToValidate: string) => {
    try {
      const result = await enhancedAuthService.validateToken(tokenToValidate);
      if (result.valid && result.user) {
        setIsAuthenticated(true);
        setUser(result.user);
        setPermissions(result.permissions?.map(p => `${p.resource}:${p.action}`) || []);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const hasPermission = useCallback((resource: string, action: string) => {
    return permissions.some(permission => {
      const [permResource, permAction] = permission.split(':');
      return (permResource === resource || permResource === '*') && 
             (permAction === action || permAction === '*');
    });
  }, [permissions]);

  // Check for stored token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('unified_token');
    if (storedToken) {
      validateToken(storedToken);
    }
  }, [validateToken]);

  return {
    isAuthenticated,
    user,
    token,
    permissions,
    loading,
    error,
    login,
    logout,
    validateToken,
    hasPermission
  };
};

// Unified API Hook
export const useUnifiedAPI = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [baseURL] = useState(process.env.VITE_API_BASE_URL || 'http://localhost:3000');

  const sendRequest = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('unified_token');
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    };

    try {
      const response = await fetch(`${baseURL}${endpoint}`, {
        ...options,
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }, [baseURL]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    sendRequest,
    isOnline,
    baseURL
  };
};

// Event Bus Hook
export const useEventBus = () => {
  const [eventHistory, setEventHistory] = useState<IntegrationEvent[]>([]);
  const [subscribers, setSubscribers] = useState<Set<string>>(new Set());

  const publish = useCallback((event: any) => {
    const fullEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    communicationProtocolService.publishEvent(fullEvent);
  }, []);

  const subscribe = useCallback((
    eventType: string | string[],
    callback: (event: IntegrationEvent) => void,
    options: {
      subscriberId?: string;
      filter?: (event: IntegrationEvent) => boolean;
      priority?: MessagePriority;
    } = {}
  ) => {
    const unsubscribe = communicationProtocolService.subscribeToEvents(
      eventType, 
      callback, 
      options
    );

    const subscriptionId = options.subscriberId || `sub_${Date.now()}`;
    setSubscribers(prev => new Set([...prev, subscriptionId]));

    return () => {
      unsubscribe();
      setSubscribers(prev => {
        const newSet = new Set(prev);
        newSet.delete(subscriptionId);
        return newSet;
      });
    };
  }, []);

  const getEventHistory = useCallback(() => {
    return communicationProtocolService.getCommunicationStats();
  }, []);

  return {
    publish,
    subscribe,
    getEventHistory,
    subscribers: Array.from(subscribers),
    eventHistory
  };
};

// Integration Status Hook
export const useIntegrationStatus = () => {
  const [status, setStatus] = useState<'initializing' | 'ready' | 'degraded' | 'error'>('initializing');
  const [services, setServices] = useState<Record<string, any>>({});
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Subscribe to integration events
        const unsubscribe = useEventBus().subscribe('*', (event) => {
          if (event.type === IntegrationEventType.SERVICE_CONNECTED) {
            setStatus('ready');
          } else if (event.type === IntegrationEventType.SERVICE_ERROR) {
            setStatus('degraded');
          }
        });

        // Get initial service status
        const serviceHealth = unifiedIntegrationService.getMetrics();
        setServices(serviceHealth.serviceHealth);
        setMetrics(serviceHealth);

        return unsubscribe;
      } catch (error) {
        console.error('Failed to initialize integration status:', error);
        setStatus('error');
      }
    };

    const cleanupPromise = initialize();
    return () => {
      cleanupPromise.then(cleanup => cleanup && cleanup());
    };
  }, []);

  return {
    status,
    services,
    metrics,
    isReady: status === 'ready',
    isDegraded: status === 'degraded',
    hasError: status === 'error'
  };
};

// Content Processing Hook
export const useContentProcessing = () => {
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const processContent = useCallback(async (
    content: string,
    options: {
      includeTags?: boolean;
      includeModeration?: boolean;
      includeInsights?: boolean;
      userId?: string;
    } = {}
  ) => {
    setProcessing(true);
    setError(null);

    try {
      const result = await unifiedIntegrationService.processContent(content, options);
      setResults(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Content processing failed';
      setError(errorMessage);
      throw err;
    } finally {
      setProcessing(false);
    }
  }, []);

  const getUnifiedContent = useCallback(async (contentId: string) => {
    try {
      const content = await unifiedIntegrationService.getUnifiedContent(contentId);
      return content;
    } catch (err) {
      console.error('Failed to get unified content:', err);
      throw err;
    }
  }, []);

  return {
    processing,
    results,
    error,
    processContent,
    getUnifiedContent,
    clearResults: () => setResults(null),
    clearError: () => setError(null)
  };
};

// Real-time Updates Hook
export const useRealTimeUpdates = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    // Subscribe to real-time update events
    const unsubscribe = useEventBus().subscribe([
      IntegrationEventType.DATA_UPDATED,
      IntegrationEventType.DATA_SYNCHRONIZED,
      IntegrationEventType.CONTENT_MODERATED
    ], (event) => {
      setLastUpdate(new Date(event.timestamp));
      setIsConnected(true);
    });

    return unsubscribe;
  }, []);

  return {
    isConnected,
    lastUpdate,
    timeSinceLastUpdate: lastUpdate ? Date.now() - lastUpdate.getTime() : null
  };
};

// Notification Hook
export const useToast = () => {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message: string;
    timeout?: number;
  }>>([]);

  const showToast = useCallback((
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    timeout: number = 5000
  ) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const notification = {
      id,
      type,
      title: type.charAt(0).toUpperCase() + type.slice(1),
      message,
      timeout
    };

    setNotifications(prev => [...prev, notification]);

    if (timeout > 0) {
      setTimeout(() => {
        hideToast(id);
      }, timeout);
    }

    return id;
  }, []);

  const hideToast = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    showToast,
    hideToast,
    clearAll
  };
};

// Unified State Hook
export const useUnifiedState = () => {
  const integrationStore = useIntegrationStore();
  const { 
    services, 
    synchronization, 
    isInitialized,
    checkServiceHealth,
    initialize
  } = integrationStore;

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  return {
    services,
    synchronization,
    isInitialized,
    checkServiceHealth
  };
};

// Security Hook
export const useSecurity = () => {
  const [securityMetrics, setSecurityMetrics] = useState<any>(null);

  useEffect(() => {
    // Subscribe to security events
    const unsubscribe = useEventBus().subscribe([
      IntegrationEventType.AUTH_SUCCESS,
      IntegrationEventType.AUTH_FAILURE,
      IntegrationEventType.PERMISSION_DENIED
    ], (event) => {
      // Update security metrics based on events
      setSecurityMetrics((prev: any) => ({
        ...prev,
        [event.type]: (prev?.[event.type] || 0) + 1
      }));
    });

    return unsubscribe;
  }, []);

  const checkSecurityStatus = useCallback(async () => {
    try {
      const metrics = enhancedAuthService.getSecurityMetrics();
      return metrics;
    } catch (error) {
      console.error('Failed to get security metrics:', error);
      return null;
    }
  }, []);

  return {
    securityMetrics,
    checkSecurityStatus
  };
};

// Performance Hook
export const usePerformance = () => {
  const [performanceData, setPerformanceData] = useState<any>(null);

  useEffect(() => {
    // Subscribe to performance events
    const unsubscribe = useEventBus().subscribe([
      IntegrationEventType.PERFORMANCE_THRESHOLD,
      IntegrationEventType.LOAD_BALANCED
    ], (event) => {
      setPerformanceData((prev: any) => ({
        ...prev,
        lastEvent: event,
        timestamp: event.timestamp
      }));
    });

    return unsubscribe;
  }, []);

  const getPerformanceMetrics = useCallback(async () => {
    try {
      const metrics = unifiedIntegrationService.getMetrics();
      return metrics;
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      return null;
    }
  }, []);

  return {
    performanceData,
    getPerformanceMetrics
  };
};

export default {
  useUnifiedAuth,
  useUnifiedAPI,
  useEventBus,
  useIntegrationStatus,
  useContentProcessing,
  useRealTimeUpdates,
  useToast,
  useUnifiedState,
  useSecurity,
  usePerformance
};