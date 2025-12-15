import axios, { AxiosResponse } from 'axios';
import {
  ModerationResponse,
  FeedbackResponse,
  AnalyticsResponse,
  NLPResponse,
  TagResponse,
  FilterState,
} from '../types';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth tokens if needed
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const getModerationItems = async (params: FilterState & { page: number; limit: number }) => {
  try {
    const response: AxiosResponse<{
      data: ModerationResponse[];
      total: number;
      page: number;
      limit: number;
    }> = await api.get('/moderate', { params });
    
    // If backend is not available, fallback to mock data with enhanced structure
    if (!response.data.data || response.data.data.length === 0) {
      console.log('Backend not available, using enhanced mock data');
      return getEnhancedMockModerationItems(params);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching moderation items:', error);
    console.log('Falling back to enhanced mock data');
    return getEnhancedMockModerationItems(params);
  }
};

// Enhanced mock data with full backend simulation
const getEnhancedMockModerationItems = (params: FilterState & { page: number; limit: number }) => {
  const enhancedItems = mockModerationItems.map((item, index) => ({
    ...item,
    analytics: generateMockAnalytics(item.id, index),
    nlpContext: generateMockNLPContext(item.id, item.content),
    tags: generateMockTags(item.id, index),
    statusBadge: index % 3 === 0 ? { type: 'updated' as const, timestamp: new Date().toISOString(), message: 'Updated after feedback' } :
                index % 3 === 1 ? { type: 'awaiting' as const, timestamp: new Date().toISOString(), message: 'Awaiting reward' } :
                { type: 'pending' as const, timestamp: new Date().toISOString(), message: 'Pending review' },
    lastUpdated: new Date(Date.now() - index * 300000).toISOString(),
    rewardStatus: (index % 2 === 0 ? 'awaiting' : 'received') as 'awaiting' | 'received',
  }));

  // Apply filters
  let filteredItems = enhancedItems;
  if (params.type !== 'all') {
    filteredItems = filteredItems.filter(item => item.type === params.type);
  }
  if (params.flagged === 'flagged') {
    filteredItems = filteredItems.filter(item => item.flagged);
  } else if (params.flagged === 'unflagged') {
    filteredItems = filteredItems.filter(item => !item.flagged);
  }
  if (params.search) {
    filteredItems = filteredItems.filter(item =>
      item.content.toLowerCase().includes(params.search.toLowerCase())
    );
  }

  const startIndex = (params.page - 1) * params.limit;
  const endIndex = startIndex + params.limit;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  return {
    data: paginatedItems,
    total: filteredItems.length,
    page: params.page,
    limit: params.limit,
  };
};

const generateMockAnalytics = (id: string, index: number) => ({
  id,
  ctr: 0.15 + (index * 0.05),
  scoreTrend: [
    { timestamp: new Date(Date.now() - 3600000).toISOString(), score: 0.7 + (index * 0.03), type: 'confidence' as const },
    { timestamp: new Date(Date.now() - 1800000).toISOString(), score: 0.75 + (index * 0.03), type: 'confidence' as const },
    { timestamp: new Date().toISOString(), score: 0.8 + (index * 0.03), type: 'confidence' as const },
  ],
  totalInteractions: 100 + (index * 20),
  avgConfidence: 0.75 + (index * 0.05),
  flaggedCount: index % 3,
  approvedCount: 5 + index,
  rejectedCount: 2 + (index % 2),
});

const generateMockNLPContext = (id: string, content: string) => {
  const topics = [
    { name: 'Technology', confidence: 0.9, category: 'tech' },
    { name: 'Business', confidence: 0.7, category: 'business' },
    { name: 'Entertainment', confidence: 0.6, category: 'media' },
  ];
  
  const sentiment = content.includes('good') || content.includes('positive')
    ? { label: 'positive' as const, score: 0.8, confidence: 0.9 }
    : content.includes('bad') || content.includes('inappropriate')
    ? { label: 'negative' as const, score: 0.3, confidence: 0.8 }
    : { label: 'neutral' as const, score: 0.5, confidence: 0.7 };

  const entities = [
    { text: 'content', type: 'misc' as const, confidence: 0.9 },
    { text: 'user', type: 'person' as const, confidence: 0.8 },
  ];

  return {
    id,
    topics: topics.slice(0, 2),
    sentiment,
    entities,
    context: `Analysis of content focusing on main themes and sentiment patterns.`,
  };
};

const generateMockTags = (id: string, index: number) => ({
  id,
  tags: [
    { label: 'technology', confidence: 0.9, category: 'topic' },
    { label: 'trending', confidence: 0.8, category: 'engagement' },
    { label: 'popular', confidence: 0.7, category: 'engagement' },
  ],
  confidence: 0.85,
  model: 'enhanced-moderation-v2',
  timestamp: new Date().toISOString(),
});

export const getModerationItem = async (id: string) => {
  try {
    const response: AxiosResponse<ModerationResponse> = await api.get(`/moderate/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching moderation item:', error);
    throw error;
  }
};

export const submitFeedback = async (feedback: Omit<FeedbackResponse, 'id' | 'timestamp'>) => {
  try {
    const response: AxiosResponse<{
      success: boolean;
      confidence: number;
      timestamp: string;
    }> = await api.post('/feedback', feedback);
    
    // For mock implementation, return a simulated response
    if (response.data.success) {
      return {
        id: `feedback_${Date.now()}`,
        thumbsUp: feedback.thumbsUp,
        comment: feedback.comment,
        timestamp: response.data.timestamp,
        userId: feedback.userId,
      };
    }
    
    throw new Error('Feedback submission failed');
  } catch (error) {
    console.error('Error submitting feedback:', error);
    throw error;
  }
};

export const getAnalytics = async (id: string) => {
  try {
    const response: AxiosResponse<AnalyticsResponse> = await api.get(`/bhiv/analytics/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw error;
  }
};

export const getNLPContext = async (id: string) => {
  try {
    const response: AxiosResponse<NLPResponse> = await api.get(`/nlp/context/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching NLP context:', error);
    throw error;
  }
};

export const getTags = async (id: string) => {
  try {
    const response: AxiosResponse<TagResponse> = await api.get(`/tag/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching tags:', error);
    throw error;
  }
};

// Mock data for development (remove in production)
export const mockModerationItems: ModerationResponse[] = [
  {
    id: '1',
    content: 'This is a sample content that needs moderation. It contains some text that might be inappropriate.',
    decision: 'pending',
    confidence: 0.75,
    timestamp: new Date().toISOString(),
    flagged: false,
    type: 'text',
    metadata: {
      source: 'user_submission',
      length: 125,
      language: 'en',
      url: 'https://example.com/content/1',
      userId: 'user_123',
      platform: 'web',
      uploadDate: new Date().toISOString(),
    },
  },
  {
    id: '2',
    content: 'Another piece of content with potentially harmful material that requires immediate attention.',
    decision: 'rejected',
    confidence: 0.92,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    flagged: true,
    type: 'text',
    metadata: {
      source: 'user_submission',
      length: 89,
      language: 'en',
      url: 'https://example.com/content/2',
      userId: 'user_456',
      platform: 'mobile',
      uploadDate: new Date(Date.now() - 3600000).toISOString(),
    },
  },
  {
    id: '3',
    content: 'Positive content that should be approved without any issues.',
    decision: 'approved',
    confidence: 0.98,
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    flagged: false,
    type: 'text',
    metadata: {
      source: 'user_submission',
      length: 67,
      language: 'en',
      url: 'https://example.com/content/3',
      userId: 'user_789',
      platform: 'web',
      uploadDate: new Date(Date.now() - 7200000).toISOString(),
    },
  },
  {
    id: '4',
    content: 'This content appears to contain suspicious links and may be spam. Please review carefully before making a decision.',
    decision: 'pending',
    confidence: 0.68,
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    flagged: true,
    type: 'text',
    metadata: {
      source: 'user_submission',
      length: 142,
      language: 'en',
      url: 'https://example.com/content/4',
      userId: 'user_101',
      platform: 'mobile',
      uploadDate: new Date(Date.now() - 1800000).toISOString(),
    },
  },
  {
    id: '5',
    content: 'Neutral content that does not violate any community guidelines but might benefit from manual review.',
    decision: 'pending',
    confidence: 0.55,
    timestamp: new Date(Date.now() - 900000).toISOString(),
    flagged: false,
    type: 'text',
    metadata: {
      source: 'user_submission',
      length: 118,
      language: 'en',
      url: 'https://example.com/content/5',
      userId: 'user_202',
      platform: 'web',
      uploadDate: new Date(Date.now() - 900000).toISOString(),
    },
  },
  {
    id: '6',
    content: 'This post contains copyrighted material that has been reported by the original content creator.',
    decision: 'pending',
    confidence: 0.87,
    timestamp: new Date(Date.now() - 300000).toISOString(),
    flagged: true,
    type: 'text',
    metadata: {
      source: 'user_submission',
      length: 134,
      language: 'en',
      url: 'https://example.com/content/6',
      userId: 'user_303',
      platform: 'mobile',
      uploadDate: new Date(Date.now() - 300000).toISOString(),
    },
  },
];

// Export the axios instance for custom requests
export { api };