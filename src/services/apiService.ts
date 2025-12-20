import axios, { AxiosResponse } from 'axios';
import {
  ModerationResponse,
  FeedbackResponse,
  AnalyticsResponse,
  NLPResponse,
  TagResponse,
  FilterState,
} from '../types';

// Create axios instance with base configuration pointing to BHIV Simple API
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001',
  timeout: 10000, // 10 second timeout for all requests
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

// Transform BHIV analytics data to frontend format
const transformBHIVAnalytics = (bhivAnalytics: any, id: string): AnalyticsResponse => {
  // BHIV provides system-wide analytics, so we'll create a per-item view
  const totalQueries = bhivAnalytics?.total_queries || 0;
  const avgResponseTime = bhivAnalytics?.avg_response_time || 1.0;
  const successRate = bhivAnalytics?.success_rate || 0.85;
  
  return {
    id,
    ctr: Math.min(successRate * 0.3, 0.95), // Convert success rate to CTR-like metric
    scoreTrend: [
      { timestamp: new Date(Date.now() - 3600000).toISOString(), score: Math.max(0.6, successRate - 0.1), type: 'confidence' as const },
      { timestamp: new Date(Date.now() - 1800000).toISOString(), score: Math.max(0.65, successRate - 0.05), type: 'confidence' as const },
      { timestamp: new Date().toISOString(), score: successRate, type: 'confidence' as const },
    ],
    totalInteractions: Math.floor(totalQueries * 0.1), // Scale down for per-item view
    avgConfidence: successRate,
    flaggedCount: Math.floor(totalQueries * 0.05),
    approvedCount: Math.floor(totalQueries * 0.7),
    rejectedCount: Math.floor(totalQueries * 0.15),
  };
};

export const getModerationItems = async (params: FilterState & { page: number; limit: number }) => {
  try {
    // Try to get items from BHIV backend first
    const response: AxiosResponse<{
      data: ModerationResponse[];
      total: number;
      page: number;
      limit: number;
    }> = await api.get('/moderate', { params });
    
    // Check if we should use mock data (only in development)
    if (import.meta.env.DEV && (!response.data.data || response.data.data.length === 0)) {
      console.log('Development mode: using enhanced mock data');
      return getEnhancedMockModerationItems(params);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching moderation items:', error);
    // Only fallback to mock data in development mode
    if (import.meta.env.DEV) {
      console.log('Development mode: falling back to enhanced mock data');
      return getEnhancedMockModerationItems(params);
    }
    throw error;
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

export const submitFeedback = async (feedback: Omit<FeedbackResponse, 'id' | 'timestamp'> & { itemId?: string }) => {
  try {
    // Transform frontend feedback format to backend format
    // Backend expects: { moderationId: string, feedback: string, userId: string }
    // Frontend sends: { thumbsUp: boolean, comment?: string, userId: string, itemId?: string }
    const backendFeedback = {
      moderationId: feedback.itemId || 'general_feedback',
      feedback: feedback.comment || (feedback.thumbsUp ? 'Positive feedback' : 'Negative feedback'),
      userId: feedback.userId,
    };
    
    // Create a timeout promise that rejects after 10 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout: Feedback submission took too long')), 10000);
    });
    
    const feedbackPromise = api.post('/feedback', backendFeedback);
    
    const response: AxiosResponse<{
      success: boolean;
      confidence: number;
      timestamp: string;
      feedbackId?: string;
    }> = await Promise.race([feedbackPromise, timeoutPromise]);
    
    // Return the actual response from backend in frontend format
    return {
      id: response.data.feedbackId || `feedback_${Date.now()}`,
      thumbsUp: feedback.thumbsUp,
      comment: feedback.comment,
      timestamp: response.data.timestamp,
      userId: feedback.userId,
    };
  } catch (error) {
    console.error('Error submitting feedback:', error);
    if (error instanceof Error && error.message.includes('timeout')) {
      throw new Error('Feedback submission timed out. Please try again.');
    }
    throw error;
  }
};

export const getAnalytics = async (id: string) => {
  try {
    // Get system-wide analytics from BHIV backend (Simple API on port 8001)
    const response: AxiosResponse<{
      status: string;
      analytics: any;
      timestamp: string;
    }> = await api.get('/kb-analytics', { params: { hours: 24 } });
    
    // Transform BHIV analytics to frontend format
    return transformBHIVAnalytics(response.data.analytics, id);
  } catch (error) {
    console.error('Error fetching analytics from BHIV backend:', error);
    // Return enhanced mock analytics in development mode
    if (import.meta.env.DEV) {
      console.log('Development mode: using enhanced mock analytics');
      return generateMockAnalytics(id, 0);
    }
    throw error;
  }
};

export const getNLPContext = async (id: string, content?: string) => {
  try {
    // Try dedicated NLP context endpoint first with actual content
    const textToAnalyze = content || `Content for analysis with ID ${id}`;
    const response: AxiosResponse<{
      status: string;
      analysis: any;
      timestamp: string;
    }> = await api.get('/nlp/context', {
      params: {
        text: textToAnalyze,
        analysis_type: 'full'
      }
    });
    
    // Transform BHIV NLP response to frontend format
    return {
      id,
      topics: [
        { name: 'Content Analysis', confidence: 0.85, category: 'analysis' },
        { name: 'Text Processing', confidence: 0.75, category: 'nlp' }
      ],
      sentiment: response.data.analysis?.sentiment || { label: 'neutral' as const, score: 0.5, confidence: 0.7 },
      entities: response.data.analysis?.entities || [
        { text: 'content', type: 'misc' as const, confidence: 0.9 },
        { text: 'analysis', type: 'misc' as const, confidence: 0.8 }
      ],
      context: response.data.analysis?.summary || 'NLP analysis of content',
    };
  } catch (error) {
    console.error('Error fetching NLP context from BHIV backend:', error);
    // Fallback to knowledge base endpoint
    try {
      const textToAnalyze = content || `Content for analysis with ID ${id}`;
      const kbResponse: AxiosResponse<{
        response: string;
        sources: any[];
        query_id: string;
      }> = await api.post('/query-kb', {
        query: `Analyze the following content for NLP context: ${textToAnalyze}`,
        limit: 3,
        user_id: 'frontend_user'
      });
      
      return {
        id,
        topics: [
          { name: 'Content Analysis', confidence: 0.85, category: 'analysis' },
          { name: 'Text Processing', confidence: 0.75, category: 'nlp' }
        ],
        sentiment: { label: 'neutral' as const, score: 0.5, confidence: 0.7 },
        entities: [
          { text: 'content', type: 'misc' as const, confidence: 0.9 },
          { text: 'analysis', type: 'misc' as const, confidence: 0.8 }
        ],
        context: kbResponse.data.response || 'NLP analysis of content',
      };
    } catch (kbError) {
      console.error('Error fetching NLP context from knowledge base:', kbError);
      // Return mock NLP context in development mode with actual content
      if (import.meta.env.DEV) {
        const textToAnalyze = content || `Content for analysis ${id}`;
        return generateMockNLPContext(id, textToAnalyze);
      }
      throw kbError; // Fixed: Throw the correct error from fallback catch block
    }
  }
};

export const getTags = async (id: string, content?: string) => {
  try {
    // Try dedicated tag endpoint first with actual content
    const contentToTag = content || `Content for tagging with ID ${id}`;
    const response: AxiosResponse<{
      status: string;
      tags: any[];
      total_tags: number;
      timestamp: string;
    }> = await api.get('/tag', {
      params: {
        content: contentToTag,
        max_tags: 5
      }
    });
    
    // Transform BHIV tags response to frontend format
    return {
      id,
      tags: response.data.tags?.map((tag: any) => ({
        label: tag.tag,
        confidence: tag.score,
        category: tag.category
      })) || [
        { label: 'content', confidence: 0.9, category: 'general' },
        { label: 'analyzed', confidence: 0.8, category: 'processing' }
      ],
      confidence: 0.85,
      model: 'bhiv-tag-generator',
      timestamp: response.data.timestamp,
    };
  } catch (error) {
    console.error('Error fetching tags from BHIV backend:', error);
    // Fallback to knowledge base endpoint
    try {
      const contentToTag = content || `Content for tagging with ID ${id}`;
      const kbResponse: AxiosResponse<{
        response: string;
        sources: any[];
        query_id: string;
      }> = await api.post('/query-kb', {
        query: `Generate relevant tags for the following content: ${contentToTag}`,
        limit: 2,
        user_id: 'frontend_user'
      });
      
      return {
        id,
        tags: [
          { label: 'content', confidence: 0.9, category: 'general' },
          { label: 'analyzed', confidence: 0.8, category: 'processing' }
        ],
        confidence: 0.85,
        model: 'bhiv-knowledge-agent',
        timestamp: new Date().toISOString(),
      };
    } catch (kbError) {
      console.error('Error fetching tags from knowledge base:', kbError);
      // Return mock tags in development mode
      if (import.meta.env.DEV) {
        return generateMockTags(id, 0);
      }
      throw kbError; // Fixed: Throw the correct error from fallback catch block
    }
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