import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  IntegrationState,
  ServiceHealthStatus,
  SynchronizationStatus,
  IntegrationEvent,
  ServiceMetrics,
  CrossComponentMessage,
  ConfigurationState,
} from '../types/integration';
import { useNotificationStore } from './notificationStore';

// Service health monitoring
const initialServiceHealth: Record<string, ServiceHealthStatus> = {
  'bhiv-core': {
    status: 'unknown',
    latency: 0,
    uptime: 0,
    lastCheck: new Date().toISOString(),
    health: {},
  },
  'adaptive-tags': {
    status: 'unknown',
    latency: 0,
    uptime: 0,
    lastCheck: new Date().toISOString(),
    health: {},
  },
  'api-gateway': {
    status: 'unknown',
    latency: 0,
    uptime: 0,
    lastCheck: new Date().toISOString(),
    health: {},
  },
  'auth-service': {
    status: 'unknown',
    latency: 0,
    uptime: 0,
    lastCheck: new Date().toISOString(),
    health: {},
  },
};

// Synchronization status
const initialSyncStatus: SynchronizationStatus = {
  isActive: false,
  lastSync: null,
  pendingUpdates: [],
  conflicts: [],
  lastHeartbeat: null,
};

// Configuration state
const initialConfiguration: ConfigurationState = {
  integration: {
    enabled: true,
    autoSync: true,
    syncInterval: 30000,
    retryAttempts: 3,
    timeout: 10000,
  },
  security: {
    jwtEnabled: true,
    oauthEnabled: true,
    rbacEnabled: true,
    sessionTimeout: 3600000,
  },
  performance: {
    caching: true,
    compression: true,
    connectionPooling: true,
    rateLimiting: true,
  },
  monitoring: {
    healthChecks: true,
    metricsCollection: true,
    alerting: true,
    logging: true,
  },
};

export const useIntegrationStore = create<IntegrationState>()(
  devtools(
    immer((set, get) => ({
      // Core integration state
      isInitialized: false,
      services: initialServiceHealth,
      synchronization: initialSyncStatus,
      configuration: initialConfiguration,
      eventBus: new Map(),
      
      // Metrics and monitoring
      metrics: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageLatency: 0,
        activeConnections: 0,
        cacheHitRate: 0,
      },
      
      // Cross-component communication
      messageQueue: [],
      activeSubscriptions: new Set(),
      
      // Real-time updates
      realTimeUpdates: {
        enabled: true,
        heartbeatInterval: 30000,
        reconnectAttempts: 3,
        lastActivity: null,
      },

      // Initialize integration system
      initialize: async () => {
        try {
          console.log('Initializing integration system...');
          
          // Load configuration from backend
          await get().loadConfiguration();
          
          // Initialize service health monitoring
          await get().initializeHealthMonitoring();
          
          // Start real-time synchronization
          await get().startRealTimeSync();
          
          // Setup cross-component event bus
          get().initializeEventBus();
          
          set((state) => {
            state.isInitialized = true;
          });
          
          useNotificationStore.getState().addNotification({
            title: 'Integration System Initialized',
            message: 'Unified integration layer is now active',
            type: 'success',
            timeout: 3000,
          });
          
          console.log('Integration system initialized successfully');
        } catch (error) {
          console.error('Failed to initialize integration system:', error);
          useNotificationStore.getState().addNotification({
            title: 'Integration Error',
            message: 'Failed to initialize integration system',
            type: 'error',
            timeout: 5000,
          });
          throw error;
        }
      },

      // Service health management
      updateServiceHealth: (serviceName: string, health: Partial<ServiceHealthStatus>) => {
        set((state) => {
          const existing = state.services[serviceName] || {
            status: 'unknown',
            latency: 0,
            uptime: 0,
            lastCheck: new Date().toISOString(),
            health: {},
          };
          
          state.services[serviceName] = {
            ...existing,
            ...health,
            lastCheck: new Date().toISOString(),
          };
        });
        
        // Broadcast health update
        get().broadcastEvent({
          type: 'service_health_update',
          source: 'integration-store',
          target: 'all',
          data: { serviceName, health: get().services[serviceName] },
          timestamp: new Date().toISOString(),
        });
      },

      checkServiceHealth: async (serviceName: string) => {
        const startTime = Date.now();
        
        try {
          const health = await get().performHealthCheck(serviceName);
          const latency = Date.now() - startTime;
          
          get().updateServiceHealth(serviceName, {
            ...health,
            latency,
            status: health.healthy ? 'healthy' : 'unhealthy',
          });
          
          return health;
        } catch (error) {
          const latency = Date.now() - startTime;
          
          get().updateServiceHealth(serviceName, {
            status: 'unhealthy',
            latency,
            health: {
              healthy: false,
              error: error instanceof Error ? error.message : 'Health check failed',
            },
          });
          
          throw error;
        }
      },

      // Configuration management
      loadConfiguration: async () => {
        try {
          const response = await fetch('/api/integration/configuration');
          if (!response.ok) throw new Error('Failed to load configuration');
          
          const config = await response.json();
          
          set((state) => {
            Object.assign(state.configuration, config);
          });
          
          console.log('Configuration loaded successfully');
        } catch (error) {
          console.warn('Failed to load configuration, using defaults:', error);
          // Configuration is already set to defaults, so we continue
        }
      },

      updateConfiguration: async (section: keyof ConfigurationState, updates: any) => {
        try {
          set((state) => {
            Object.assign(state.configuration[section], updates);
          });
          
          // Persist to backend
          await fetch('/api/integration/configuration', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [section]: updates }),
          });
          
          useNotificationStore.getState().addNotification({
            title: 'Configuration Updated',
            message: `Integration ${section} configuration has been updated`,
            type: 'success',
            timeout: 3000,
          });
        } catch (error) {
          console.error('Failed to update configuration:', error);
          throw error;
        }
      },

      // Real-time synchronization
      startRealTimeSync: async () => {
        if (!get().configuration.integration.autoSync) return;
        
        const interval = get().configuration.integration.syncInterval;
        
        set((state) => {
          state.synchronization.isActive = true;
        });
        
        // Start periodic sync
        const syncTimer = setInterval(async () => {
          try {
            await get().performSynchronization();
          } catch (error) {
            console.error('Synchronization failed:', error);
          }
        }, interval);
        
        // Store timer reference for cleanup
        (get() as any)._syncTimer = syncTimer;
        
        // Perform initial sync
        await get().performSynchronization();
      },

      stopRealTimeSync: () => {
        set((state) => {
          state.synchronization.isActive = false;
        });
        
        const timer = (get() as any)._syncTimer;
        if (timer) {
          clearInterval(timer);
          delete (get() as any)._syncTimer;
        }
      },

      performSynchronization: async () => {
        const syncStartTime = Date.now();
        
        try {
          // Check all services
          const serviceNames = Object.keys(get().services);
          const healthPromises = serviceNames.map(name => 
            get().checkServiceHealth(name).catch(() => null)
          );
          
          await Promise.allSettled(healthPromises);
          
          // Sync state across components
          await get().syncCrossComponentState();
          
          // Update synchronization metrics
          const syncDuration = Date.now() - syncStartTime;
          
          set((state) => {
            state.synchronization.lastSync = new Date().toISOString();
            state.synchronization.pendingUpdates = [];
            state.synchronization.conflicts = [];
          });
          
          console.log(`Synchronization completed in ${syncDuration}ms`);
        } catch (error) {
          console.error('Synchronization failed:', error);
          throw error;
        }
      },

      // Cross-component event bus
      initializeEventBus: () => {
        const eventBus = get().eventBus;
        
        // Setup WebSocket connection for real-time events
        const ws = new WebSocket(getWebSocketUrl());
        
        ws.onopen = () => {
          console.log('Event bus WebSocket connected');
          set((state) => {
            state.realTimeUpdates.lastActivity = new Date().toISOString();
          });
        };
        
        ws.onmessage = (event) => {
          try {
            const message: IntegrationEvent = JSON.parse(event.data);
            get().handleIntegrationEvent(message);
          } catch (error) {
            console.error('Failed to parse event message:', error);
          }
        };
        
        ws.onclose = () => {
          console.log('Event bus WebSocket disconnected');
          // Attempt reconnection
          setTimeout(() => get().initializeEventBus(), 5000);
        };
        
        ws.onerror = (error) => {
          console.error('Event bus WebSocket error:', error);
        };
        
        // Store WebSocket reference
        (get() as any)._eventBusWebSocket = ws;
      },

      broadcastEvent: (event: IntegrationEvent) => {
        const ws = (get() as any)._eventBusWebSocket;
        
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(event));
        } else {
          // Fallback to local event bus
          const eventBus = get().eventBus;
          const listeners = eventBus.get(event.type) || new Set();
          
          listeners.forEach(callback => {
            try {
              callback(event);
            } catch (error) {
              console.error('Event listener error:', error);
            }
          });
        }
      },

      subscribe: (eventType: string, callback: (event: IntegrationEvent) => void) => {
        const eventBus = get().eventBus;
        const listeners = eventBus.get(eventType) || new Set();
        
        listeners.add(callback);
        eventBus.set(eventType, listeners);
        
        // Track active subscriptions
        set((state) => {
          state.activeSubscriptions.add(eventType);
        });
        
        // Return unsubscribe function
        return () => {
          const listeners = eventBus.get(eventType);
          if (listeners) {
            listeners.delete(callback);
            if (listeners.size === 0) {
              eventBus.delete(eventType);
              set((state) => {
                state.activeSubscriptions.delete(eventType);
              });
            }
          }
        };
      },

      handleIntegrationEvent: (event: IntegrationEvent) => {
        console.log('Handling integration event:', event.type, event.data);
        
        set((state) => {
          state.realTimeUpdates.lastActivity = event.timestamp;
        });
        
        // Handle specific event types
        switch (event.type) {
          case 'service_health_update':
            // Update service health in local state
            if (event.data.serviceName) {
              set((state) => {
                if (state.services[event.data.serviceName]) {
                  Object.assign(state.services[event.data.serviceName], event.data.health);
                }
              });
            }
            break;
            
          case 'state_update':
            // Handle state updates from other components
            get().applyStateUpdate(event.data);
            break;
            
          case 'configuration_change':
            // Reload configuration if changed
            get().loadConfiguration();
            break;
            
          case 'user_action':
            // Handle user actions across components
            get().handleCrossComponentUserAction(event.data);
            break;
        }
        
        // Broadcast to local listeners
        const eventBus = get().eventBus;
        const listeners = eventBus.get(event.type) || new Set();
        
        listeners.forEach(callback => {
          try {
            callback(event);
          } catch (error) {
            console.error('Event listener error:', error);
          }
        });
      },

      // Message queue management
      sendMessage: (message: CrossComponentMessage) => {
        set((state) => {
          state.messageQueue.push({
            ...message,
            id: `msg_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
            timestamp: new Date().toISOString(),
          });
        });
        
        // Process message queue
        get().processMessageQueue();
      },

      processMessageQueue: () => {
        const { messageQueue } = get();
        
        if (messageQueue.length === 0) return;
        
        const messagesToProcess = [...messageQueue];
        
        set((state) => {
          state.messageQueue = [];
        });
        
        messagesToProcess.forEach(message => {
          get().handleCrossComponentMessage(message);
        });
      },

      // Utility methods
      getServiceHealth: (serviceName: string): ServiceHealthStatus | null => {
        return get().services[serviceName] || null;
      },

      getAllServiceHealth: (): Record<string, ServiceHealthStatus> => {
        return get().services;
      },

      isIntegrationHealthy: (): boolean => {
        const services = get().services;
        return Object.values(services).every(service => service.status === 'healthy');
      },

      // Cleanup
      cleanup: () => {
        get().stopRealTimeSync();
        
        const ws = (get() as any)._eventBusWebSocket;
        if (ws) {
          ws.close();
        }
        
        set((state) => {
          state.eventBus.clear();
          state.activeSubscriptions.clear();
        });
      },

      // Private helper methods
      performHealthCheck: async (serviceName: string) => {
        const endpoints: Record<string, string> = {
          'bhiv-core': '/health/bhiv',
          'adaptive-tags': '/health/tags',
          'api-gateway': '/health/gateway',
          'auth-service': '/health/auth',
        };
        
        const endpoint = endpoints[serviceName];
        if (!endpoint) {
          throw new Error(`No health check endpoint for service: ${serviceName}`);
        }
        
        const response = await fetch(endpoint, {
          method: 'GET',
          timeout: get().configuration.integration.timeout,
        });
        
        if (!response.ok) {
          throw new Error(`Health check failed: ${response.status}`);
        }
        
        const healthData = await response.json();
        
        return {
          healthy: response.ok,
          responseTime: Date.now(),
          services: healthData.services || {},
          version: healthData.version || 'unknown',
          uptime: healthData.uptime || 0,
        };
      },

      syncCrossComponentState: async () => {
        // Sync state between different components
        try {
          const response = await fetch('/api/integration/state/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              timestamp: new Date().toISOString(),
              components: ['moderation', 'tags', 'analytics', 'auth'],
            }),
          });
          
          if (!response.ok) {
            throw new Error('State sync failed');
          }
          
          const syncData = await response.json();
          
          // Apply synchronized state
          set((state) => {
            Object.assign(state, syncData.updates);
          });
          
        } catch (error) {
          console.error('Cross-component state sync failed:', error);
        }
      },

      applyStateUpdate: (updateData: any) => {
        // Apply state updates received from other components
        set((state) => {
          // Merge update data with existing state
          Object.keys(updateData).forEach(key => {
            if (state[key as keyof IntegrationState] !== undefined) {
              (state as any)[key] = { ...(state as any)[key], ...updateData[key] };
            }
          });
        });
      },

      handleCrossComponentUserAction: (actionData: any) => {
        // Handle user actions that need to be coordinated across components
        console.log('Handling cross-component user action:', actionData);
        
        // Add notification for user
        useNotificationStore.getState().addNotification({
          title: actionData.title || 'System Update',
          message: actionData.message || 'A system update has occurred',
          type: 'info',
          timeout: 3000,
        });
      },

      handleCrossComponentMessage: (message: CrossComponentMessage) => {
        // Handle messages between components
        console.log('Processing cross-component message:', message.type);
        
        switch (message.type) {
          case 'auth_required':
            // Handle authentication requirements
            get().broadcastEvent({
              type: 'auth_request',
              source: 'integration-store',
              target: 'auth-service',
              data: message.data,
              timestamp: new Date().toISOString(),
            });
            break;
            
          case 'data_sync':
            // Handle data synchronization requests
            get().performSynchronization();
            break;
            
          case 'service_call':
            // Handle service calls between components
            get().broadcastEvent({
              type: 'service_request',
              source: 'integration-store',
              target: message.data.targetService,
              data: message.data.requestData,
              timestamp: new Date().toISOString(),
            });
            break;
        }
      },
    })),
    {
      name: 'integration-store',
    }
  )
);

// Helper function to get WebSocket URL
function getWebSocketUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}/ws/integration`;
}

// Provider component
export const IntegrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { initialize, isInitialized } = useIntegrationStore();
  
  React.useEffect(() => {
    if (!isInitialized) {
      initialize().catch(console.error);
    }
    
    // Cleanup on unmount
    return () => {
      useIntegrationStore.getState().cleanup();
    };
  }, [initialize, isInitialized]);
  
  return <>{children}</>;
};