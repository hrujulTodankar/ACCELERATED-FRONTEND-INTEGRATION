// API Response Types
export interface ModerationResponse {
  id: string;
  content: string;
  decision: 'approved' | 'rejected' | 'pending';
  confidence: number;
  timestamp: string;
  flagged: boolean;
  type: 'text' | 'image' | 'video';
  metadata: ContentMetadata;
  // Enhanced data from backend services
  analytics?: AnalyticsResponse;
  nlpContext?: NLPResponse;
  tags?: TagResponse;
  // Adaptive UI tracking
  statusBadge?: StatusBadge;
  lastUpdated?: string;
  rewardStatus?: 'awaiting' | 'received';
  // RL integration
  rlMetrics?: RLMetrics;
}

export interface RLMetrics {
  confidenceScore: number;
  rewardHistory: RLReward[];
  lastReward: string;
}

export interface RLReward {
  timestamp: string;
  reward: number;
  action?: 'approve' | 'reject' | 'pending';
}

export interface FeedbackResponse {
  id: string;
  thumbsUp: boolean;
  comment?: string;
  timestamp: string;
  userId: string;
}

export interface AnalyticsResponse {
  id: string;
  ctr: number;
  scoreTrend: ScoreTrend[];
  totalInteractions: number;
  avgConfidence: number;
  flaggedCount: number;
  approvedCount: number;
  rejectedCount: number;
}

export interface NLPResponse {
  id: string;
  topics: Topic[];
  sentiment: Sentiment;
  entities: Entity[];
  context: string;
}

export interface TagResponse {
  id: string;
  tags: Tag[];
  confidence: number;
  model: string;
  timestamp: string;
}

// Supporting Types
export interface ContentMetadata {
  source: string;
  length: number;
  language?: string;
  url?: string;
  userId?: string;
  platform?: string;
  uploadDate?: string;
}

export interface ScoreTrend {
  timestamp: string;
  score: number;
  type: 'confidence' | 'quality' | 'engagement';
}

export interface Topic {
  name: string;
  confidence: number;
  category: string;
}

export interface Sentiment {
  label: 'positive' | 'negative' | 'neutral';
  score: number;
  confidence: number;
}

export interface Entity {
  text: string;
  type: 'person' | 'organization' | 'location' | 'misc';
  confidence: number;
}

export interface Tag {
  label: string;
  confidence: number;
  category: string;
}

// UI State Types
export interface FilterState {
  type: 'all' | 'text' | 'image' | 'video';
  score: 'all' | 'high' | 'medium' | 'low';
  flagged: 'all' | 'flagged' | 'unflagged';
  date: 'all' | 'today' | 'week' | 'month';
  search: string;
}

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
}

export interface LoadingState {
  moderation: boolean;
  feedback: boolean;
  analytics: boolean;
  nlp: boolean;
  tags: boolean;
}

export interface ErrorState {
  moderation?: string;
  feedback?: string;
  analytics?: string;
  nlp?: string;
  tags?: string;
}

// Component Props Types
export interface ModerationCardProps {
  content: ModerationResponse;
  onFeedback: (feedback: Omit<FeedbackResponse, 'id' | 'timestamp'>) => Promise<void>;
  loading?: boolean;
}

export interface MetadataPanelProps {
  metadata: ContentMetadata;
  nlpData?: NLPResponse;
  tagsData?: TagResponse;
  loading?: boolean;
}

export interface FeedbackBarProps {
  onFeedback: (feedback: Omit<FeedbackResponse, 'id' | 'timestamp'> & { itemId?: string }) => Promise<void>;
  currentFeedback?: FeedbackResponse;
  loading?: boolean;
  itemId?: string;
}

export interface ConfidenceProgressProps {
  confidence: number;
  decision: 'approved' | 'rejected' | 'pending';
  updating?: boolean;
}

export interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onSearch: (search: string) => void;
}

export interface StatusBadgeProps {
  status: 'updated' | 'awaiting' | 'pending';
  lastUpdated?: string;
}

export interface StatusBadge {
  type: 'updated' | 'awaiting' | 'pending';
  timestamp?: string;
  message?: string;
}

// Adaptive Tag Types
export interface AdaptiveTagProps {
  contentId: string;
  tag: Tag;
  behavior?: UserBehavior;
  context?: TagContext;
  onTagUpdate?: (tag: Tag) => void;
}

export interface UserBehavior {
  userId: string;
  sessionId: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  previousTags?: string[];
  engagementScore: number;
  interactionHistory: Interaction[];
}

export interface Interaction {
  type: 'click' | 'hover' | 'scroll' | 'focus';
  timestamp: string;
  duration?: number;
  target?: string;
}

export interface TagContext {
  contentType: 'text' | 'image' | 'video';
  contentId: string;
  currentTime: string;
  environment?: {
    theme: 'light' | 'dark';
    language: string;
    accessibilityMode: boolean;
  };
}

export interface AdaptiveTag {
  id: string;
  label: string;
  confidence: number;
  category: string;
  behavior?: TagBehavior;
  appearance?: TagAppearance;
  interactions?: TagInteraction[];
  lastUpdated: string;
}

export interface TagBehavior {
  adaptToUser: boolean;
  animationEnabled: boolean;
  hoverEffects: boolean;
  clickBehavior: 'none' | 'expand' | 'navigate' | 'filter';
}

export interface TagAppearance {
  color: string;
  size: 'small' | 'medium' | 'large';
  style: 'default' | 'outline' | 'filled' | 'gradient';
  icon?: string;
}

export interface TagInteraction {
  type: 'click' | 'hover' | 'focus' | 'blur';
  timestamp: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface AdaptiveTagStore {
  tags: AdaptiveTag[];
  loading: boolean;
  error: string | null;
  selectedTags: Set<string>;
  
  // Actions
  fetchTags: (contentId: string) => Promise<void>;
  createTag: (tag: Omit<AdaptiveTag, 'id' | 'lastUpdated'>) => Promise<AdaptiveTag>;
  updateTag: (id: string, updates: Partial<AdaptiveTag>) => Promise<AdaptiveTag>;
  deleteTag: (id: string) => Promise<void>;
  selectTag: (id: string) => void;
  deselectTag: (id: string) => void;
  clearSelection: () => void;
  trackInteraction: (tagId: string, interaction: Omit<TagInteraction, 'timestamp'>) => Promise<void>;
}

// Store Types
export interface ModerationState {
  items: ModerationResponse[];
  selectedItem: ModerationResponse | null;
  filters: FilterState;
  pagination: PaginationState;
  loading: LoadingState;
  error: ErrorState;
  
  // Actions
  setItems: (items: ModerationResponse[]) => void;
  setSelectedItem: (item: ModerationResponse | null) => void;
  updateFilters: (filters: Partial<FilterState>) => void;
  updatePagination: (pagination: Partial<PaginationState>) => void;
  setLoading: (key: keyof LoadingState, value: boolean) => void;
  setError: (key: keyof ErrorState, value?: string) => void;
  fetchItems: () => Promise<void>;
  submitFeedback: (feedback: Omit<FeedbackResponse, 'id' | 'timestamp'> & { itemId?: string }) => Promise<void>;
  fetchAnalytics: (id: string) => Promise<AnalyticsResponse>;
  fetchNLPContext: (id: string) => Promise<NLPResponse>;
  fetchTags: (id: string) => Promise<TagResponse>;
  updateItemStatus: (id: string, statusBadge: StatusBadge, rewardStatus?: 'awaiting' | 'received') => void;
  simulateRLUpdate: (id: string) => void;
  processRLReward: (id: string, action: 'approve' | 'reject' | 'pending') => Promise<any>;
  startRLPolling: () => void;
  stopRLPolling: () => void;
}

// Integration System Types
export interface UnifiedIntegrationService {
  // Health monitoring
  checkAllServices: () => Promise<ServiceHealthStatus>;
  
  // Authentication and authorization
  authenticate: (credentials: any) => Promise<AuthResult>;
  authorize: (resource: string, action: string, user: any) => Promise<boolean>;
  
  // Content processing
  processContent: (content: any) => Promise<IntegrationResponse>;
  
  // Event management
  publishEvent: (event: any) => Promise<void>;
  subscribe: (eventType: string, callback: (event: any) => void) => () => void;
  
  // API gateway operations
  routeRequest: (request: any) => Promise<any>;
  getAvailableEndpoints: () => Promise<EndpointInfo[]>;
}

export interface ServiceHealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: Record<string, ServiceHealth>;
  timestamp: string;
  issues?: string[];
}

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  lastCheck: string;
  error?: string;
  uptime?: number;
}

export interface AuthResult {
  success: boolean;
  token?: string;
  refreshToken?: string;
  user?: any;
  permissions?: string[];
  expiresAt?: string;
  error?: string;
}

export interface IntegrationResponse {
  success: boolean;
  data?: any;
  errors?: string[];
  metadata?: Record<string, any>;
  timestamp: string;
  correlationId?: string;
}

export interface EndpointInfo {
  path: string;
  method: string;
  description: string;
  requiresAuth: boolean;
  rateLimit?: number;
  supportedFormats: string[];
}

// Event Types
export interface IntegrationEvent {
  type: string;
  source: string;
  target?: string;
  data: any;
  timestamp: string;
  correlationId?: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  retryCount?: number;
  maxRetries?: number;
}

export interface EventSubscription {
  id: string;
  eventType: string;
  callback: (event: IntegrationEvent) => void;
  filters?: Record<string, any>;
  createdAt: string;
}

// Gateway Types
export interface GatewayConfig {
  services: ServiceConfig[];
  routes: RouteConfig[];
  middleware: MiddlewareConfig[];
  rateLimit: RateLimitConfig;
  security: SecurityConfig;
}

export interface ServiceConfig {
  name: string;
  url: string;
  healthCheck: string;
  timeout: number;
  retries: number;
  weight?: number;
  tags?: string[];
}

export interface RouteConfig {
  path: string;
  methods: string[];
  service: string;
  stripPath?: boolean;
  preserveHost?: boolean;
  plugins?: Record<string, any>;
}

export interface MiddlewareConfig {
  name: string;
  config: Record<string, any>;
  enabled: boolean;
}

export interface RateLimitConfig {
  enabled: boolean;
  windowMs: number;
  maxRequests: number;
  message?: string;
}

export interface SecurityConfig {
  cors: {
    enabled: boolean;
    origins: string[];
    methods: string[];
    allowedHeaders: string[];
  };
  auth: {
    required: boolean;
    provider: 'jwt' | 'oauth' | 'both';
    audience?: string;
    issuer?: string;
  };
}

// Security Types
export interface SecurityMetrics {
  totalRequests: number;
  blockedRequests: number;
  authFailures: number;
  rateLimitHits: number;
  averageResponseTime: number;
  uptime: number;
  lastUpdate: string;
}

export interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
  timestamp: string;
}

// Integration Store Types
export interface IntegrationState {
  // Service health
  services: Record<string, ServiceHealthStatus>;
  overallHealth: 'healthy' | 'degraded' | 'unhealthy';
  
  // Authentication
  isAuthenticated: boolean;
  user: any | null;
  permissions: string[];
  token: string | null;
  
  // Event system
  events: IntegrationEvent[];
  subscriptions: EventSubscription[];
  
  // Gateway
  availableEndpoints: EndpointInfo[];
  gatewayConfig: GatewayConfig | null;
  
  // Metrics
  securityMetrics: SecurityMetrics | null;
  performanceMetrics: PerformanceMetrics | null;
  
  // Loading and error states
  loading: {
    healthCheck: boolean;
    authentication: boolean;
    events: boolean;
    gateway: boolean;
  };
  errors: {
    healthCheck?: string;
    authentication?: string;
    events?: string;
    gateway?: string;
    general?: string;
  };
  
  // Actions
  checkServiceHealth: () => Promise<void>;
  authenticate: (credentials: any) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  authorize: (resource: string, action: string) => Promise<boolean>;
  
  publishEvent: (event: Omit<IntegrationEvent, 'timestamp'>) => Promise<void>;
  subscribe: (eventType: string, callback: (event: IntegrationEvent) => void) => () => void;
  unsubscribe: (subscriptionId: string) => void;
  
  loadGatewayConfig: () => Promise<void>;
  routeRequest: (request: any) => Promise<any>;
  
  updateSecurityMetrics: (metrics: SecurityMetrics) => void;
  updatePerformanceMetrics: (metrics: PerformanceMetrics) => void;
  
  setLoading: (key: keyof IntegrationState['loading'], value: boolean) => void;
  setError: (key: keyof IntegrationState['errors'], value?: string) => void;
  clearErrors: () => void;
}

// Additional types for integration system
export interface TagItem {
  name: string;
  category: string;
  confidence: number;
}

export interface TagsData {
  autoGenerated: TagItem[];
  userDefined: TagItem[];
}

export interface UnifiedTagOperation {
  name: string;
  category: string;
  confidence: number;
  operation: 'create' | 'update' | 'delete';
  metadata?: Record<string, any>;
}

export interface TagCategory {
  id: string;
  name: string;
  description: string;
  color: string;
}

export interface IntegrationStatus {
  coreConnected: boolean;
  adaptiveConnected: boolean;
  apiGatewayConnected: boolean;
  lastSync: string | null;
  syncStatus: 'connected' | 'disconnected' | 'syncing' | 'error';
}

export interface UserPermission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface AuthContext {
  isAuthenticated: boolean;
  hasPermission: (permission: UserPermission) => boolean;
  hasRole: (role: string) => boolean;
  user: any | null;
  token: string | null;
  permissions: string[];
}

export interface APIContext {
  baseURL: string;
  headers: Record<string, string>;
  timeout: number;
  retryAttempts: number;
}

export interface UnifiedAPI {
  auth: AuthContext;
  api: APIContext;
  sendRequest: (endpoint: string, options: any) => Promise<any>;
  isOnline: boolean;
}

export interface EventBus {
  publish: (event: IntegrationEvent) => void;
  subscribe: (eventType: string, callback: (event: IntegrationEvent) => void) => () => void;
  unsubscribe: (eventType: string, callback: (event: IntegrationEvent) => void) => void;
}

export interface UnifiedAuth {
  login: (credentials: any) => Promise<AuthResult>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<AuthResult>;
  getUserInfo: () => Promise<any>;
  hasPermission: (permission: UserPermission) => boolean;
  isAuthenticated: boolean;
}

export interface UnifiedState {
  moderation: ModerationState;
  tags: any; // AdaptiveTagsState type would be imported
  integration: IntegrationState;
  notifications: {
    notifications: any[];
    addNotification: (n: any) => string;
    removeNotification: (id: string) => void;
  };
}

export interface UseUnifiedAuth {
  isAuthenticated: boolean;
  hasPermission: (permission: UserPermission) => boolean;
  user: any | null;
  permissions: string[];
  login: (credentials: any) => Promise<AuthResult>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<AuthResult>;
}

export interface UseUnifiedAPI {
  sendRequest: (endpoint: string, options: any) => Promise<any>;
  isOnline: boolean;
  baseURL: string;
}

export interface UseEventBus {
  publish: (event: IntegrationEvent) => void;
  subscribe: (eventType: string, callback: (event: IntegrationEvent) => void) => () => void;
  unsubscribe: (eventType: string, callback: (event: IntegrationEvent) => void) => void;
}

export interface UseToast {
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  hideToast: (id: string) => void;
}

// Service interfaces
export interface ServiceHealthCheck {
  serviceName: string;
  endpoint: string;
  timeout: number;
  expectedStatus: number;
}

export interface LoadBalancerStrategy {
  type: 'round-robin' | 'least-connections' | 'weighted' | 'random';
  healthCheck: ServiceHealthCheck;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  timeout: number;
  resetTimeout: number;
}

export interface RateLimiterConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number;
  maxSize: number;
  strategy: 'lru' | 'lfu' | 'fifo';
}