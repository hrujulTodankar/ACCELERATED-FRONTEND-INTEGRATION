# API Contracts and Data Models Specification

## Data Models

### 1. Core Tag Model

```typescript
// src/types/Tag.ts
interface AdaptiveTag {
  // Identification
  id: string;
  name: string;
  slug: string;
  type: TagType;
  
  // Content & Configuration
  content: TagContent;
  configuration: TagConfiguration;
  
  // State Management
  state: TagState;
  status: TagStatus;
  version: number;
  
  // Analytics & Insights
  analytics: TagAnalytics;
  insights: TagInsights;
  
  // Metadata
  metadata: TagMetadata;
  createdAt: Date;
  updatedAt: Date;
  lastModifiedBy: string;
}

enum TagType {
  CONTENT = 'content',
  INTERACTION = 'interaction',
  ANALYTICS = 'analytics',
  SYSTEM = 'system'
}

enum TagStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  ARCHIVED = 'archived'
}

interface TagContent {
  title: string;
  description: string;
  html?: string;
  css?: string;
  javascript?: string;
  mediaUrls: string[];
  dataAttributes: Record<string, any>;
}

interface TagConfiguration {
  adaptiveRules: AdaptiveRule[];
  triggerConditions: TriggerCondition[];
  displayOptions: DisplayOptions;
  integrationSettings: IntegrationSettings;
}

interface TagState {
  currentView: string;
  userInteractions: UserInteraction[];
  sessionData: SessionData;
  crossDeviceSync: CrossDeviceSync;
  isPersonalized: boolean;
}

interface TagAnalytics {
  views: number;
  clicks: number;
  conversions: number;
  engagementRate: number;
  performanceScore: number;
  userSegments: string[];
  timeSeriesData: TimeSeriesData[];
}

interface TagInsights {
  recommendations: Recommendation[];
  predictions: Prediction[];
  anomalies: Anomaly[];
  optimizationSuggestions: OptimizationSuggestion[];
}

interface TagMetadata {
  author: string;
  category: string;
  tags: string[];
  priority: Priority;
  targetAudience: TargetAudience;
  accessibility: AccessibilityOptions;
}
```

### 2. User and Session Models

```typescript
interface User {
  id: string;
  email: string;
  profile: UserProfile;
  preferences: UserPreferences;
  deviceFingerprint: string;
  sessionHistory: SessionData[];
  tags: UserTag[];
}

interface UserProfile {
  firstName: string;
  lastName: string;
  timezone: string;
  locale: string;
  demographics: Demographics;
}

interface UserPreferences {
  tagDisplayDensity: DisplayDensity;
  animationPreferences: AnimationPreferences;
  accessibilityNeeds: AccessibilityNeeds;
  privacySettings: PrivacySettings;
}

interface SessionData {
  sessionId: string;
  deviceType: DeviceType;
  userAgent: string;
  ipAddress: string;
  startTime: Date;
  endTime?: Date;
  tagsViewed: string[];
  interactions: InteractionEvent[];
  deviceCapabilities: DeviceCapabilities;
}
```

### 3. Analytics and Insights Models

```typescript
interface InsightBridgeData {
  tagId: string;
  timestamp: Date;
  metrics: RealTimeMetrics;
  predictions: PredictiveInsights;
  recommendations: AIRecommendations;
  performance: PerformanceMetrics;
}

interface RealTimeMetrics {
  activeUsers: number;
  viewsPerMinute: number;
  engagementRate: number;
  bounceRate: number;
  conversionRate: number;
  sentimentScore: number;
  heatMapData: HeatMapPoint[];
}

interface PredictiveInsights {
  nextHourViews: number;
  optimalDisplayTime: Date;
  userBehaviorPrediction: UserBehaviorPrediction[];
  performanceForecast: PerformanceForecast;
}

interface AIRecommendations {
  contentOptimization: ContentOptimization[];
  placementOptimization: PlacementOptimization[];
  timingOptimization: TimingOptimization[];
  personalizationSuggestions: PersonalizationSuggestion[];
}
```

## API Contracts

### 1. BHIV Core Service APIs

#### Tag Management Endpoints

```typescript
// GET /api/v1/tags
interface GetTagsRequest {
  query?: {
    status?: TagStatus[];
    type?: TagType[];
    category?: string;
    page?: number;
    limit?: number;
    sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'views';
    sortOrder?: 'asc' | 'desc';
  };
}

interface GetTagsResponse {
  tags: AdaptiveTag[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  meta: {
    lastSyncAt: Date;
    version: string;
  };
}

// POST /api/v1/tags
interface CreateTagRequest {
  name: string;
  type: TagType;
  content: TagContent;
  configuration: TagConfiguration;
  metadata: Partial<TagMetadata>;
}

interface CreateTagResponse {
  tag: AdaptiveTag;
  validationResults: ValidationResult[];
  analytics: TagAnalytics;
  syncStatus: SyncStatus;
}

// PUT /api/v1/tags/:id
interface UpdateTagRequest {
  content?: Partial<TagContent>;
  configuration?: Partial<TagConfiguration>;
  state?: Partial<TagState>;
  metadata?: Partial<TagMetadata>;
}

interface UpdateTagResponse {
  tag: AdaptiveTag;
  changes: ChangeLog[];
  analytics: TagAnalytics;
  version: number;
}

// DELETE /api/v1/tags/:id
interface DeleteTagRequest {
  reason?: string;
  force?: boolean;
}

interface DeleteTagResponse {
  success: boolean;
  deletedTagId: string;
  dependentTags: string[];
  archiveLocation?: string;
}
```

#### Real-time Tag State APIs

```typescript
// WebSocket: /ws/tags/:id
interface TagStateUpdate {
  tagId: string;
  timestamp: Date;
  state: TagState;
  analytics: TagAnalytics;
  insights: TagInsights;
}

// POST /api/v1/tags/:id/interact
interface TagInteractionRequest {
  action: InteractionType;
  metadata: {
    userAgent: string;
    viewport: Viewport;
    position: Position;
    timestamp: Date;
  };
  userData: {
    userId?: string;
    sessionId: string;
    deviceFingerprint: string;
  };
}

interface TagInteractionResponse {
  success: boolean;
  updatedAnalytics: TagAnalytics;
  newInsights: TagInsights;
  recommendations: Recommendation[];
}

enum InteractionType {
  VIEW = 'view',
  CLICK = 'click',
  HOVER = 'hover',
  SCROLL = 'scroll',
  SHARE = 'share',
  CONVERT = 'convert'
}
```

### 2. Insight Bridge Analytics APIs

#### Real-time Analytics Endpoints

```typescript
// GET /api/v1/analytics/tags/:id/realtime
interface RealTimeAnalyticsRequest {
  metrics: string[];
  timeRange: TimeRange;
  granularity: 'minute' | 'hour' | 'day';
}

interface RealTimeAnalyticsResponse {
  tagId: string;
  timestamp: Date;
  data: RealTimeMetrics;
  trends: TrendData[];
  predictions: PredictiveInsights;
  alerts: Alert[];
}

// POST /api/v1/analytics/tags/:id/events
interface AnalyticsEventRequest {
  eventType: AnalyticsEventType;
  eventData: Record<string, any>;
  userContext: UserContext;
  deviceContext: DeviceContext;
}

interface AnalyticsEventResponse {
  eventId: string;
  processedAt: Date;
  insights: TagInsights;
  recommendations: Recommendation[];
}

enum AnalyticsEventType {
  PAGE_VIEW = 'page_view',
  TAG_INTERACTION = 'tag_interaction',
  CONVERSION = 'conversion',
  ERROR = 'error',
  PERFORMANCE = 'performance'
}
```

#### Predictive Analytics APIs

```typescript
// GET /api/v1/analytics/tags/:id/predictions
interface PredictionRequest {
  timeHorizon: '1h' | '6h' | '24h' | '7d';
  predictionType: PredictionType[];
  confidence: number;
}

interface PredictionResponse {
  tagId: string;
  predictions: {
    performance: PerformancePrediction;
    engagement: EngagementPrediction;
    userBehavior: UserBehaviorPrediction[];
  };
  modelMetadata: {
    accuracy: number;
    lastTrained: Date;
    dataPoints: number;
  };
  recommendations: AIRecommendations;
}

enum PredictionType {
  PERFORMANCE = 'performance',
  ENGAGEMENT = 'engagement',
  CONVERSION = 'conversion',
  USER_BEHAVIOR = 'user_behavior'
}
```

### 3. Frontend Service APIs

#### Tag Rendering APIs

```typescript
// GET /api/v1/frontend/tags/render/:id
interface TagRenderRequest {
  userId?: string;
  sessionId: string;
  deviceInfo: DeviceInfo;
  context: RenderContext;
  adaptiveOptions: AdaptiveOptions;
}

interface TagRenderResponse {
  html: string;
  css: string;
  javascript: string;
  dataAttributes: Record<string, any>;
  adaptiveRules: AdaptiveRule[];
  eventHandlers: EventHandler[];
  dependencies: Dependency[];
  renderMetadata: {
    renderTime: number;
    cacheHit: boolean;
    adaptiveScore: number;
  };
}

// WebSocket: /ws/frontend/adaptive-tags
interface AdaptiveTagUpdate {
  tagId: string;
  changes: {
    content?: Partial<TagContent>;
    state?: Partial<TagState>;
    analytics?: Partial<TagAnalytics>;
  };
  timestamp: Date;
  source: 'user' | 'system' | 'analytics';
}
```

#### Cross-device Synchronization APIs

```typescript
// POST /api/v1/frontend/tags/sync
interface SyncRequest {
  sourceDevice: DeviceInfo;
  targetDevices: DeviceInfo[];
  tags: string[];
  syncOptions: SyncOptions;
}

interface SyncResponse {
  syncId: string;
  status: SyncStatus;
  results: SyncResult[];
  conflicts: SyncConflict[];
  timestamp: Date;
}

interface SyncOptions {
  direction: 'bidirectional' | 'source_to_target' | 'target_to_source';
  conflictResolution: 'latest' | 'manual' | 'merge';
  includeAnalytics: boolean;
  includeUserData: boolean;
}
```

## Error Handling Contracts

### Standard Error Response Format

```typescript
interface APIError {
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, any>;
    timestamp: Date;
    requestId: string;
    service: string;
  };
  meta?: {
    retryAfter?: number;
    documentation?: string;
    supportContact?: string;
  };
}

enum ErrorCode {
  // Client Errors (4xx)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMITED = 'RATE_LIMITED',
  
  // Server Errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  CIRCUIT_BREAKER = 'CIRCUIT_BREAKER',
  
  // Integration Errors
  BHIV_SERVICE_ERROR = 'BHIV_SERVICE_ERROR',
  INSIGHT_BRIDGE_ERROR = 'INSIGHT_BRIDGE_ERROR',
  SYNCHRONIZATION_ERROR = 'SYNCHRONIZATION_ERROR',
  
  // Adaptive Tag Specific
  ADAPTIVE_RULE_ERROR = 'ADAPTIVE_RULE_ERROR',
  ANALYTICS_PROCESSING_ERROR = 'ANALYTICS_PROCESSING_ERROR',
  CROSS_DEVICE_SYNC_ERROR = 'CROSS_DEVICE_SYNC_ERROR'
}
```

### Rate Limiting Headers

```typescript
interface RateLimitHeaders {
  'X-RateLimit-Limit': string;
  'X-RateLimit-Remaining': string;
  'X-RateLimit-Reset': string;
  'X-RateLimit-Retry-After'?: string;
}
```

## Authentication and Authorization

### JWT Token Structure

```typescript
interface JWTPayload {
  // Standard claims
  sub: string; // user ID
  iss: string; // issuer
  aud: string; // audience
  exp: number; // expiration
  iat: number; // issued at
  
  // Custom claims
  role: UserRole;
  permissions: Permission[];
  sessionId: string;
  deviceFingerprint: string;
  serviceScope: ServiceScope[];
}

enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
  SYSTEM = 'system'
}

interface Permission {
  resource: string;
  actions: string[];
  conditions?: Record<string, any>;
}
```

### API Authentication Headers

```typescript
// Standard API requests
headers: {
  'Authorization': 'Bearer <jwt_token>',
  'X-API-Version': 'v1',
  'X-Request-ID': '<uuid>',
  'X-Session-ID': '<uuid>'
}

// Service-to-service authentication
headers: {
  'Authorization': 'Service <service_token>',
  'X-Service-Name': 'insight-bridge',
  'X-API-Version': 'v1'
}
```

## WebSocket Event Contracts

### Real-time Tag Events

```typescript
// Tag State Updates
interface TagStateEvent {
  type: 'tag_state_update';
  payload: {
    tagId: string;
    changes: Partial<TagState>;
    analytics: Partial<TagAnalytics>;
    timestamp: Date;
  };
}

// Analytics Updates
interface AnalyticsUpdateEvent {
  type: 'analytics_update';
  payload: {
    tagId: string;
    metrics: RealTimeMetrics;
    predictions: PredictiveInsights;
    timestamp: Date;
  };
}

// Cross-device Sync Events
interface SyncEvent {
  type: 'device_sync';
  payload: {
    syncId: string;
    tagId: string;
    changes: SyncChange[];
    timestamp: Date;
  };
}

// Error Events
interface ErrorEvent {
  type: 'error';
  payload: {
    code: ErrorCode;
    message: string;
    tagId?: string;
    timestamp: Date;
  };
}
```

This comprehensive API specification provides detailed contracts for all integration points between the BHIV Core, Insight Bridge, and Frontend components, ensuring seamless communication and data flow throughout the Adaptive Tag system.