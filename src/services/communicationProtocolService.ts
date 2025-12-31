/**
 * Cross-Component Communication Protocols Service
 * Implements event-driven communication, real-time data synchronization,
 * WebSocket communication, and message queue protocols
 */

import { unifiedIntegrationService, IntegrationEvent, IntegrationEventType } from './unifiedIntegrationService';

// Communication protocol types
export enum CommunicationProtocol {
  HTTP = 'http',
  WEBSOCKET = 'websocket',
  MESSAGE_QUEUE = 'message_queue',
  SERVER_SENT_EVENTS = 'sse',
  POLLING = 'polling'
}

export enum MessagePriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  CRITICAL = 4
}

export interface Message {
  id: string;
  type: string;
  source: string;
  target: string | string[];
  payload: any;
  priority: MessagePriority;
  timestamp: string;
  correlationId?: string;
  replyTo?: string;
  ttl?: number; // Time to live in milliseconds
  retryCount?: number;
  maxRetries?: number;
  metadata?: Record<string, any>;
}

export interface CommunicationChannel {
  id: string;
  name: string;
  type: CommunicationProtocol;
  subscribers: Set<string>;
  config: {
    url?: string;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
    heartbeatInterval?: number;
    bufferSize?: number;
  };
  statistics: {
    messagesSent: number;
    messagesReceived: number;
    bytesSent: number;
    bytesReceived: number;
    errorCount: number;
    lastActivity: string;
  };
}

export interface EventSubscription {
  id: string;
  eventType: string | string[];
  callback: (event: IntegrationEvent) => void;
  filter?: (event: IntegrationEvent) => boolean;
  priority: MessagePriority;
  subscriberId: string;
  createdAt: string;
}

export interface SyncOperation {
  id: string;
  type: 'full_sync' | 'delta_sync' | 'real_time_sync';
  source: string;
  target: string;
  data: any;
  timestamp: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  conflicts?: any[];
  resolution?: any;
}

// Event Bus for cross-component communication
class EventBus {
  private subscriptions: Map<string, Set<EventSubscription>> = new Map();
  private eventHistory: IntegrationEvent[] = [];
  private maxHistorySize = 10000;

  subscribe(
    eventType: string | string[],
    callback: (event: IntegrationEvent) => void,
    options: {
      subscriberId?: string;
      filter?: (event: IntegrationEvent) => boolean;
      priority?: MessagePriority;
    } = {}
  ): () => void {
    const subscription: EventSubscription = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventType,
      callback,
      filter: options.filter,
      priority: options.priority || MessagePriority.NORMAL,
      subscriberId: options.subscriberId || 'anonymous',
      createdAt: new Date().toISOString()
    };

    // Handle both single event type and array of event types
    const eventTypes = Array.isArray(eventType) ? eventType : [eventType];
    
    eventTypes.forEach(eventType => {
      if (!this.subscriptions.has(eventType)) {
        this.subscriptions.set(eventType, new Set());
      }
      this.subscriptions.get(eventType)!.add(subscription);
    });

    // Return unsubscribe function
    return () => {
      this.unsubscribe(subscription.id);
    };
  }

  unsubscribe(subscriptionId: string): void {
    this.subscriptions.forEach(subscriptions => {
      subscriptions.forEach(subscription => {
        if (subscription.id === subscriptionId) {
          subscriptions.delete(subscription);
        }
      });
    });
  }

  publish(event: IntegrationEvent): void {
    // Add to history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Get subscribers for this event type
    const subscribers = this.subscriptions.get(event.type);
    if (subscribers) {
      // Sort by priority (higher priority first)
      const sortedSubscribers = Array.from(subscribers).sort(
        (a, b) => b.priority - a.priority
      );

      // Notify subscribers
      sortedSubscribers.forEach(subscription => {
        try {
          // Apply filter if present
          if (subscription.filter && !subscription.filter(event)) {
            return;
          }
          subscription.callback(event);
        } catch (error) {
          console.error(`Error in event subscriber ${subscription.id}:`, error);
        }
      });
    }

    // Also notify wildcard subscribers (*)
    const wildcardSubscribers = this.subscriptions.get('*');
    if (wildcardSubscribers) {
      wildcardSubscribers.forEach(subscription => {
        try {
          subscription.callback(event);
        } catch (error) {
          console.error(`Error in wildcard subscriber ${subscription.id}:`, error);
        }
      });
    }
  }

  getEventHistory(limit = 1000): IntegrationEvent[] {
    return this.eventHistory.slice(-limit);
  }

  clearHistory(): void {
    this.eventHistory = [];
  }

  getSubscriptionStats(): {
    totalSubscriptions: number;
    subscriptionsByType: Record<string, number>;
    recentEvents: number;
  } {
    const totalSubscriptions = Array.from(this.subscriptions.values())
      .reduce((sum, subs) => sum + subs.size, 0);
    
    const subscriptionsByType: Record<string, number> = {};
    this.subscriptions.forEach((subs, type) => {
      subscriptionsByType[type] = subs.size;
    });

    const recentEvents = this.eventHistory.filter(
      event => Date.now() - new Date(event.timestamp).getTime() < 60000
    ).length;

    return {
      totalSubscriptions,
      subscriptionsByType,
      recentEvents
    };
  }
}

// Message Queue for async communication
class MessageQueue {
  private queues: Map<string, Message[]> = new Map();
  private processing: Set<string> = new Set();
  private deadLetterQueue: Message[] = [];

  addMessage(queueName: string, message: Message): void {
    if (!this.queues.has(queueName)) {
      this.queues.set(queueName, []);
    }
    
    this.queues.get(queueName)!.push(message);
    this.sortQueue(queueName);
  }

  getMessage(queueName: string): Message | null {
    const queue = this.queues.get(queueName);
    if (!queue || queue.length === 0) {
      return null;
    }

    const message = queue.shift()!;
    this.processing.add(message.id);
    
    return message;
  }

  acknowledgeMessage(messageId: string, success: boolean): void {
    this.processing.delete(messageId);
    
    if (!success) {
      // Move to dead letter queue or retry
      const message = this.findProcessingMessage(messageId);
      if (message) {
        message.retryCount = (message.retryCount || 0) + 1;
        if ((message.retryCount || 0) >= (message.maxRetries || 3)) {
          this.deadLetterQueue.push(message);
        } else {
          // Re-queue for retry
          this.addMessage('retry', message);
        }
      }
    }
  }

  processQueue(
    queueName: string,
    processor: (message: Message) => Promise<void>,
    options: {
      batchSize?: number;
      concurrency?: number;
      timeout?: number;
    } = {}
  ): Promise<void> {
    const batchSize = options.batchSize || 10;
    const concurrency = options.concurrency || 5;
    const timeout = options.timeout || 30000;

    return new Promise((resolve, reject) => {
      let processed = 0;
      let active = 0;
      const messages: Message[] = [];

      const processBatch = async () => {
        if (active >= concurrency || messages.length === 0) {
          return;
        }

        const message = this.getMessage(queueName);
        if (!message) {
          if (active === 0 && processed > 0) {
            resolve();
          }
          return;
        }

        active++;
        messages.push(message);

        try {
          const timeoutPromise = new Promise((_, rejectTimeout) => {
            setTimeout(() => rejectTimeout(new Error('Message processing timeout')), timeout);
          });

          await Promise.race([processor(message), timeoutPromise]);
          this.acknowledgeMessage(message.id, true);
          processed++;
        } catch (error) {
          console.error(`Error processing message ${message.id}:`, error);
          this.acknowledgeMessage(message.id, false);
        } finally {
          active--;
          messages.splice(messages.indexOf(message), 1);
          
          // Process next message
          setImmediate(processBatch);
        }
      };

      // Start processing
      for (let i = 0; i < Math.min(concurrency, batchSize); i++) {
        processBatch();
      }
    });
  }

  getQueueStats(): {
    queues: Record<string, { size: number; processing: number }>;
    deadLetterQueueSize: number;
    totalMessages: number;
  } {
    const queueStats: Record<string, { size: number; processing: number }> = {};
    
    this.queues.forEach((messages, queueName) => {
      queueStats[queueName] = {
        size: messages.length,
        processing: Array.from(this.processing).filter(id => 
          messages.some(msg => msg.id === id)
        ).length
      };
    });

    const totalMessages = Array.from(this.queues.values())
      .reduce((sum, messages) => sum + messages.length, 0) + this.processing.size;

    return {
      queues: queueStats,
      deadLetterQueueSize: this.deadLetterQueue.length,
      totalMessages
    };
  }

  private sortQueue(queueName: string): void {
    const queue = this.queues.get(queueName);
    if (queue) {
      queue.sort((a, b) => b.priority - a.priority || 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }
  }

  private findProcessingMessage(messageId: string): Message | undefined {
    for (const messages of this.queues.values()) {
      const message = messages.find(msg => msg.id === messageId);
      if (message) {
        return message;
      }
    }
    return undefined;
  }
}

// WebSocket Manager for real-time communication
class WebSocketManager {
  private connections: Map<string, WebSocket> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private heartbeatTimers: Map<string, NodeJS.Timeout> = new Map();

  connect(
    connectionId: string,
    url: string,
    options: {
      protocols?: string[];
      reconnectInterval?: number;
      maxReconnectAttempts?: number;
      heartbeatInterval?: number;
    } = {}
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const protocols = options.protocols || [];
        const ws = new WebSocket(url, protocols);

        ws.onopen = () => {
          console.log(`[WebSocket] Connected: ${connectionId}`);
          this.connections.set(connectionId, ws);
          this.reconnectAttempts.set(connectionId, 0);
          
          // Start heartbeat
          if (options.heartbeatInterval) {
            this.startHeartbeat(connectionId, options.heartbeatInterval);
          }
          
          resolve();
        };

        ws.onmessage = (event) => {
          this.handleMessage(connectionId, event.data);
        };

        ws.onerror = (error) => {
          console.error(`[WebSocket] Error on ${connectionId}:`, error);
        };

        ws.onclose = (event) => {
          console.log(`[WebSocket] Disconnected: ${connectionId}`, event.code, event.reason);
          this.connections.delete(connectionId);
          this.stopHeartbeat(connectionId);
          
          // Attempt reconnection
          if (!event.wasClean && options.maxReconnectAttempts) {
            this.attemptReconnect(connectionId, url, options);
          }
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(connectionId: string): void {
    const ws = this.connections.get(connectionId);
    if (ws) {
      ws.close();
      this.connections.delete(connectionId);
      this.stopHeartbeat(connectionId);
    }
  }

  send(connectionId: string, data: any): void {
    const ws = this.connections.get(connectionId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    } else {
      console.warn(`[WebSocket] Cannot send to ${connectionId}: connection not open`);
    }
  }

  broadcast(data: any): void {
    this.connections.forEach((ws, connectionId) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
      }
    });
  }

  onMessage(connectionId: string, handler: (data: any) => void): void {
    this.messageHandlers.set(connectionId, handler);
  }

  private handleMessage(connectionId: string, data: string): void {
    try {
      const handler = this.messageHandlers.get(connectionId);
      if (handler) {
        const parsed = JSON.parse(data);
        handler(parsed);
      }
    } catch (error) {
      console.error(`[WebSocket] Error parsing message from ${connectionId}:`, error);
    }
  }

  private startHeartbeat(connectionId: string, interval: number): void {
    const timer = setInterval(() => {
      this.send(connectionId, { type: 'ping', timestamp: Date.now() });
    }, interval);
    
    this.heartbeatTimers.set(connectionId, timer);
  }

  private stopHeartbeat(connectionId: string): void {
    const timer = this.heartbeatTimers.get(connectionId);
    if (timer) {
      clearInterval(timer);
      this.heartbeatTimers.delete(connectionId);
    }
  }

  private async attemptReconnect(
    connectionId: string,
    url: string,
    options: any
  ): Promise<void> {
    const attempts = this.reconnectAttempts.get(connectionId) || 0;
    if (attempts >= (options.maxReconnectAttempts || 5)) {
      console.error(`[WebSocket] Max reconnection attempts reached for ${connectionId}`);
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, attempts), 30000);
    
    setTimeout(async () => {
      try {
        await this.connect(connectionId, url, options);
        this.reconnectAttempts.set(connectionId, 0);
      } catch (error) {
        this.reconnectAttempts.set(connectionId, attempts + 1);
        console.error(`[WebSocket] Reconnection attempt ${attempts + 1} failed for ${connectionId}:`, error);
      }
    }, delay);
  }

  getConnectionStats(): {
    totalConnections: number;
    activeConnections: number;
    connections: Record<string, { readyState: number; url: string }>;
  } {
    const connections: Record<string, { readyState: number; url: string }> = {};
    
    this.connections.forEach((ws, connectionId) => {
      connections[connectionId] = {
        readyState: ws.readyState,
        url: ws.url || 'unknown'
      };
    });

    return {
      totalConnections: this.connections.size,
      activeConnections: Array.from(this.connections.values())
        .filter(ws => ws.readyState === WebSocket.OPEN).length,
      connections
    };
  }
}

// Data Synchronization Manager
class DataSyncManager {
  private syncOperations: Map<string, SyncOperation> = new Map();
  private conflictResolvers: Map<string, (conflict: any) => any> = new Map();
  private syncHistory: SyncOperation[] = [];

  startSync(
    type: SyncOperation['type'],
    source: string,
    target: string,
    data: any
  ): string {
    const id = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const operation: SyncOperation = {
      id,
      type,
      source,
      target,
      data,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    this.syncOperations.set(id, operation);
    return id;
  }

  async executeSync(operationId: string): Promise<{ success: boolean; result?: any; error?: string }> {
    const operation = this.syncOperations.get(operationId);
    if (!operation) {
      return { success: false, error: 'Sync operation not found' };
    }

    operation.status = 'in_progress';

    try {
      let result;
      
      switch (operation.type) {
        case 'full_sync':
          result = await this.performFullSync(operation);
          break;
        case 'delta_sync':
          result = await this.performDeltaSync(operation);
          break;
        case 'real_time_sync':
          result = await this.performRealTimeSync(operation);
          break;
        default:
          throw new Error(`Unknown sync type: ${operation.type}`);
      }

      operation.status = 'completed';
      this.syncHistory.push({ ...operation });

      return { success: true, result };

    } catch (error) {
      operation.status = 'failed';
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }

  registerConflictResolver(syncType: string, resolver: (conflict: any) => any): void {
    this.conflictResolvers.set(syncType, resolver);
  }

  getSyncStatus(operationId: string): SyncOperation | null {
    return this.syncOperations.get(operationId) || null;
  }

  getSyncHistory(limit = 100): SyncOperation[] {
    return this.syncHistory.slice(-limit);
  }

  private async performFullSync(operation: SyncOperation): Promise<any> {
    // Simulate full synchronization
    console.log(`[Sync] Performing full sync from ${operation.source} to ${operation.target}`);
    return { syncedItems: Object.keys(operation.data || {}).length };
  }

  private async performDeltaSync(operation: SyncOperation): Promise<any> {
    // Simulate delta synchronization
    console.log(`[Sync] Performing delta sync from ${operation.source} to ${operation.target}`);
    return { deltaItems: Array.isArray(operation.data) ? operation.data.length : 0 };
  }

  private async performRealTimeSync(operation: SyncOperation): Promise<any> {
    // Simulate real-time synchronization
    console.log(`[Sync] Performing real-time sync from ${operation.source} to ${operation.target}`);
    return { realTimeItems: 1 };
  }
}

// Main Communication Protocol Service
export class CommunicationProtocolService {
  private eventBus: EventBus;
  private messageQueue: MessageQueue;
  private webSocketManager: WebSocketManager;
  private dataSyncManager: DataSyncManager;
  private channels: Map<string, CommunicationChannel> = new Map();

  constructor() {
    this.eventBus = new EventBus();
    this.messageQueue = new MessageQueue();
    this.webSocketManager = new WebSocketManager();
    this.dataSyncManager = new DataSyncManager();

    this.initializeChannels();
  }

  private initializeChannels(): void {
    // HTTP/REST communication channel
    this.channels.set('http', {
      id: 'http',
      name: 'HTTP Communication',
      type: CommunicationProtocol.HTTP,
      subscribers: new Set(),
      config: {
        reconnectInterval: 5000,
        maxReconnectAttempts: 3
      },
      statistics: {
        messagesSent: 0,
        messagesReceived: 0,
        bytesSent: 0,
        bytesReceived: 0,
        errorCount: 0,
        lastActivity: new Date().toISOString()
      }
    });

    // WebSocket real-time communication channel
    this.channels.set('websocket', {
      id: 'websocket',
      name: 'WebSocket Communication',
      type: CommunicationProtocol.WEBSOCKET,
      subscribers: new Set(),
      config: {
        reconnectInterval: 3000,
        maxReconnectAttempts: 5,
        heartbeatInterval: 30000,
        bufferSize: 1000
      },
      statistics: {
        messagesSent: 0,
        messagesReceived: 0,
        bytesSent: 0,
        bytesReceived: 0,
        errorCount: 0,
        lastActivity: new Date().toISOString()
      }
    });

    // Message queue async communication channel
    this.channels.set('message_queue', {
      id: 'message_queue',
      name: 'Message Queue Communication',
      type: CommunicationProtocol.MESSAGE_QUEUE,
      subscribers: new Set(),
      config: {
        bufferSize: 10000
      },
      statistics: {
        messagesSent: 0,
        messagesReceived: 0,
        bytesSent: 0,
        bytesReceived: 0,
        errorCount: 0,
        lastActivity: new Date().toISOString()
      }
    });
  }

  /**
   * Subscribe to integration events
   */
  subscribeToEvents(
    eventType: string | string[],
    callback: (event: IntegrationEvent) => void,
    options: {
      subscriberId?: string;
      filter?: (event: IntegrationEvent) => boolean;
      priority?: MessagePriority;
    } = {}
  ): () => void {
    return this.eventBus.subscribe(eventType, callback, options);
  }

  /**
   * Publish integration event
   */
  publishEvent(event: IntegrationEvent): void {
    this.eventBus.publish(event);
  }

  /**
   * Send message through specified protocol
   */
  async sendMessage(
    protocol: CommunicationProtocol,
    target: string,
    message: Omit<Message, 'id' | 'timestamp'>,
    options: {
      channelId?: string;
      timeout?: number;
      priority?: MessagePriority;
    } = {}
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const fullMessage: Message = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      priority: options.priority || MessagePriority.NORMAL
    };

    try {
      switch (protocol) {
        case CommunicationProtocol.HTTP:
          return await this.sendHttpMessage(target, fullMessage);
        
        case CommunicationProtocol.WEBSOCKET:
          return await this.sendWebSocketMessage(target, fullMessage);
        
        case CommunicationProtocol.MESSAGE_QUEUE:
          return await this.sendQueueMessage(target, fullMessage);
        
        case CommunicationProtocol.POLLING:
          return await this.sendPollingMessage(target, fullMessage);
        
        default:
          return { success: false, error: `Unsupported protocol: ${protocol}` };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }

  /**
   * Start data synchronization
   */
  startDataSync(
    type: SyncOperation['type'],
    source: string,
    target: string,
    data: any
  ): string {
    return this.dataSyncManager.startSync(type, source, target, data);
  }

  /**
   * Execute synchronization operation
   */
  async executeSync(operationId: string): Promise<{ success: boolean; result?: any; error?: string }> {
    return this.dataSyncManager.executeSync(operationId);
  }

  /**
   * Connect WebSocket channel
   */
  async connectWebSocket(
    connectionId: string,
    url: string,
    options: {
      protocols?: string[];
      reconnectInterval?: number;
      maxReconnectAttempts?: number;
      heartbeatInterval?: number;
    } = {}
  ): Promise<void> {
    await this.webSocketManager.connect(connectionId, url, options);
  }

  /**
   * Get communication statistics
   */
  getCommunicationStats(): {
    channels: Record<string, CommunicationChannel['statistics']>;
    eventBus: ReturnType<EventBus['getSubscriptionStats']>;
    messageQueue: ReturnType<MessageQueue['getQueueStats']>;
    webSocket: ReturnType<WebSocketManager['getConnectionStats']>;
    dataSync: {
      activeOperations: number;
      completedOperations: number;
      failedOperations: number;
    };
  } {
    const channelStats: Record<string, CommunicationChannel['statistics']> = {};
    this.channels.forEach((channel, channelId) => {
      channelStats[channelId] = channel.statistics;
    });

    const syncHistory = this.dataSyncManager.getSyncHistory();
    const activeOperations = syncHistory.filter(op => op.status === 'pending' || op.status === 'in_progress').length;
    const completedOperations = syncHistory.filter(op => op.status === 'completed').length;
    const failedOperations = syncHistory.filter(op => op.status === 'failed').length;

    return {
      channels: channelStats,
      eventBus: this.eventBus.getSubscriptionStats(),
      messageQueue: this.messageQueue.getQueueStats(),
      webSocket: this.webSocketManager.getConnectionStats(),
      dataSync: {
        activeOperations,
        completedOperations,
        failedOperations
      }
    };
  }

  // Private helper methods

  private async sendHttpMessage(target: string, message: Message): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Simulate HTTP message sending
      console.log(`[HTTP] Sending message to ${target}:`, message);
      
      // Update channel statistics
      const channel = this.channels.get('http');
      if (channel) {
        channel.statistics.messagesSent++;
        channel.statistics.lastActivity = new Date().toISOString();
      }

      return { success: true, messageId: message.id };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  private async sendWebSocketMessage(target: string, message: Message): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      this.webSocketManager.send(target, message);
      
      // Update channel statistics
      const channel = this.channels.get('websocket');
      if (channel) {
        channel.statistics.messagesSent++;
        channel.statistics.lastActivity = new Date().toISOString();
      }

      return { success: true, messageId: message.id };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  private async sendQueueMessage(target: string, message: Message): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      this.messageQueue.addMessage(target, message);
      
      // Update channel statistics
      const channel = this.channels.get('message_queue');
      if (channel) {
        channel.statistics.messagesSent++;
        channel.statistics.lastActivity = new Date().toISOString();
      }

      return { success: true, messageId: message.id };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  private async sendPollingMessage(target: string, message: Message): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Simulate polling message (stored temporarily and retrieved via polling)
      console.log(`[Polling] Storing message for polling:`, message);
      
      return { success: true, messageId: message.id };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
}

// Export singleton instance
export const communicationProtocolService = new CommunicationProtocolService();

export default CommunicationProtocolService;
