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