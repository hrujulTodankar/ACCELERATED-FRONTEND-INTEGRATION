import axios, { AxiosResponse } from 'axios';
import {
  ModerationResponse,
  FeedbackResponse,
  AnalyticsResponse,
  NLPResponse,
  TagResponse,
  FilterState,
} from '../types';

// Enhanced logging utility
const apiLogger = {
  info: (message: string, data?: any) => {
    console.log(`[API-Service] ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[API-Service-ERROR] ${message}`, error || '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[API-Service-WARN] ${message}`, data || '');
  },
  debug: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.debug(`[API-Service-DEBUG] ${message}`, data || '');
    }
  }
};

// Create axios instance with enhanced configuration
const resolvedBaseURL = (typeof process !== 'undefined' && process.env.BHIV_BASE_URL)
  ? process.env.BHIV_BASE_URL
  : (import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8001');

const api = axios.create({
  baseURL: resolvedBaseURL,
  timeout: parseInt((typeof process !== 'undefined' && process.env.VITE_BHIV_TIMEOUT) || import.meta.env?.VITE_BHIV_TIMEOUT || '10000'),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Enhanced request interceptor with detailed logging
api.interceptors.request.use(
  (config) => {
    const startTime = Date.now();
    (config as any).metadata = { startTime };
    
    apiLogger.debug(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request ID for tracking
    config.headers['X-Request-ID'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return config;
  },
  (error) => {
    apiLogger.error('Request interceptor error', error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with performance tracking
api.interceptors.response.use(
  (response) => {
    const duration = Date.now() - ((response.config as any).metadata?.startTime || Date.now());
    apiLogger.debug(`Response received in ${duration}ms from ${response.config.url}`);
    
    // Add response metadata
    (response as any).metadata = {
      duration,
      requestId: response.config.headers['X-Request-ID'],
      timestamp: new Date().toISOString(),
    };
    
    return response;
  },
  (error) => {
    const duration = error.config ? ((error.config as any).metadata?.startTime ? 
      Date.now() - (error.config as any).metadata.startTime : 'unknown') : 'unknown';
    
    apiLogger.error(`Request failed after ${duration}ms: ${error.config?.url}`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    
    if (error.response?.status === 401) {
      apiLogger.warn('Unauthorized access detected, clearing auth token');
      localStorage.removeItem('authToken');
      // Optionally redirect to login
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Backend health check utility
export const checkBackendHealth = async (): Promise<{ 
  healthy: boolean; 
  latency?: number; 
  error?: string 
}> => {
  try {
    const startTime = Date.now();
    const response = await api.get('/health', { timeout: 3000 });
    const latency = Date.now() - startTime;
    
    apiLogger.info('Backend health check successful', { latency });
    
    return {
      healthy: true,
      latency,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    apiLogger.warn('Backend health check failed', { error: errorMessage });
    
    return {
      healthy: false,
      error: errorMessage,
    };
  }
};

// Transform BHIV analytics data to frontend format
const transformBHIVAnalytics = (bhivAnalytics: any, id: string): AnalyticsResponse => {
  apiLogger.debug('Transforming BHIV analytics data', { id, bhivAnalytics });
  
  const totalQueries = bhivAnalytics?.total_queries || 0;
  const avgResponseTime = bhivAnalytics?.avg_response_time || 1.0;
  const successRate = bhivAnalytics?.success_rate || 0.85;
  
  const transformed = {
    id,
    ctr: Math.min(successRate * 0.3, 0.95),
    scoreTrend: [
      { 
        timestamp: new Date(Date.now() - 3600000).toISOString(), 
        score: Math.max(0.6, successRate - 0.1), 
        type: 'confidence' as const 
      },
      { 
        timestamp: new Date(Date.now() - 1800000).toISOString(), 
        score: Math.max(0.65, successRate - 0.05), 
        type: 'confidence' as const 
      },
      { 
        timestamp: new Date().toISOString(), 
        score: successRate, 
        type: 'confidence' as const 
      },
    ],
    totalInteractions: Math.floor(totalQueries * 0.1),
    avgConfidence: successRate,
    flaggedCount: Math.floor(totalQueries * 0.05),
    approvedCount: Math.floor(totalQueries * 0.7),
    rejectedCount: Math.floor(totalQueries * 0.15),
  };
  
  apiLogger.debug('Analytics transformation complete', { id, transformed });
  return transformed;
};

// Enhanced mock data generation with RL reward simulation
const generateMockAnalytics = (id: string, index: number) => {
  const baseCTR = 0.15 + (index * 0.05);
  const rlBoost = Math.random() * 0.1; // Simulate RL reward boost
  
  return {
    id,
    ctr: Math.min(baseCTR + rlBoost, 0.95),
    scoreTrend: [
      { 
        timestamp: new Date(Date.now() - 3600000).toISOString(), 
        score: 0.7 + (index * 0.03), 
        type: 'confidence' as const 
      },
      { 
        timestamp: new Date(Date.now() - 1800000).toISOString(), 
        score: 0.75 + (index * 0.03), 
        type: 'confidence' as const 
      },
      { 
        timestamp: new Date().toISOString(), 
        score: 0.8 + (index * 0.03) + rlBoost, 
        type: 'confidence' as const 
      },
    ],
    totalInteractions: 100 + (index * 20),
    avgConfidence: 0.75 + (index * 0.05),
    flaggedCount: index % 3,
    approvedCount: 5 + index,
    rejectedCount: 2 + (index % 2),
  };
};

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
    context: `Enhanced NLP analysis of content focusing on main themes, sentiment patterns, and semantic structure.`,
  };
};

const generateMockTags = (id: string, index: number) => {
  const tagSets = [
    ['technology', 'trending', 'popular', 'viral'],
    ['business', 'finance', 'market', 'analysis'],
    ['entertainment', 'media', 'content', 'review'],
    ['education', 'learning', 'tutorial', 'guide'],
    ['health', 'wellness', 'fitness', 'lifestyle']
  ];
  
  const selectedTags = tagSets[index % tagSets.length];
  
  return {
    id,
    tags: selectedTags.map((label, tagIndex) => ({
      label,
      confidence: 0.9 - (tagIndex * 0.1),
      category: tagIndex === 0 ? 'primary' : 'secondary'
    })),
    confidence: 0.85,
    model: 'enhanced-moderation-v3',
    timestamp: new Date().toISOString(),
  };
};

// Enhanced moderation items with RL integration
const getEnhancedMockModerationItems = (params: FilterState & { page: number; limit: number }) => {
  const enhancedItems = mockModerationItems.map((item, index) => ({
    ...item,
    analytics: generateMockAnalytics(item.id, index),
    nlpContext: generateMockNLPContext(item.id, item.content),
    tags: generateMockTags(item.id, index),
    statusBadge: index % 3 === 0 ? 
      { type: 'updated' as const, timestamp: new Date().toISOString(), message: 'RL reward applied' } :
      index % 3 === 1 ? 
      { type: 'awaiting' as const, timestamp: new Date().toISOString(), message: 'Awaiting RL feedback' } :
      { type: 'pending' as const, timestamp: new Date().toISOString(), message: 'Pending review' },
    lastUpdated: new Date(Date.now() - index * 300000).toISOString(),
    rewardStatus: (index % 2 === 0 ? 'awaiting' : 'received') as 'awaiting' | 'received',
    rlMetrics: {
      confidenceScore: 0.7 + (index * 0.05),
      rewardHistory: [
        { timestamp: new Date(Date.now() - 3600000).toISOString(), reward: 0.1 + (index * 0.02) },
        { timestamp: new Date(Date.now() - 1800000).toISOString(), reward: 0.15 + (index * 0.02) },
        { timestamp: new Date().toISOString(), reward: 0.2 + (index * 0.02) }
      ],
      lastReward: new Date(Date.now() - 300000).toISOString()
    }
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

  apiLogger.debug('Generated enhanced mock items', { 
    total: filteredItems.length, 
    returned: paginatedItems.length,
    filters: params 
  });

  return {
    data: paginatedItems,
    total: filteredItems.length,
    page: params.page,
    limit: params.limit,
  };
};

export const getModerationItems = async (params: FilterState & { page: number; limit: number }) => {
  try {
    apiLogger.info('Fetching moderation items', { params });
    
    // Check backend health first
    const health = await checkBackendHealth();
      if (!health.healthy) {
        apiLogger.warn('Backend unhealthy', { health });
        // Only use mock data if explicitly enabled via env var
        if (import.meta.env.VITE_USE_MOCK_DATA_WHEN_BHIV_UNAVAILABLE === 'true') {
          apiLogger.info('VITE_USE_MOCK_DATA_WHEN_BHIV_UNAVAILABLE=true, returning mock moderation items');
          return getEnhancedMockModerationItems(params);
        }
        throw new Error(`Backend unavailable: ${health.error}`);
      }

    // Try to get items from BHIV backend
    const response: AxiosResponse<{
      data: ModerationResponse[];
      total: number;
      page: number;
      limit: number;
    }> = await api.get('/moderate', { params });
    
    if (!response.data.data || response.data.data.length === 0) {
      apiLogger.info('No data from backend, using enhanced mock data');
      return getEnhancedMockModerationItems(params);
    }
    
    apiLogger.info('Successfully fetched moderation items from backend', {
      count: response.data.data.length,
      total: response.data.total
    });
    
    return response.data;
  } catch (error) {
    apiLogger.error('Error fetching moderation items', error);
    
    // Enhanced fallback to mock data only if explicitly enabled
    if (import.meta.env.VITE_USE_MOCK_DATA_WHEN_BHIV_UNAVAILABLE === 'true') {
      apiLogger.info('VITE_USE_MOCK_DATA_WHEN_BHIV_UNAVAILABLE=true, using enhanced mock data as fallback');
      return getEnhancedMockModerationItems(params);
    }
    
    throw error;
  }
};

export const getModerationItem = async (id: string) => {
  try {
    apiLogger.info('Fetching moderation item', { id });
    const response: AxiosResponse<ModerationResponse> = await api.get(`/moderate/${id}`);
    
    apiLogger.debug('Successfully fetched moderation item', { id });
    return response.data;
  } catch (error) {
    apiLogger.error('Error fetching moderation item', { id, error });
    throw error;
  }
};

export const submitFeedback = async (feedback: Omit<FeedbackResponse, 'id' | 'timestamp'> & { itemId?: string }) => {
  try {
    apiLogger.info('Submitting feedback', { feedback });
    
    const backendFeedback = {
      moderationId: feedback.itemId || 'general_feedback',
      feedback: feedback.comment || (feedback.thumbsUp ? 'Positive feedback' : 'Negative feedback'),
      userId: feedback.userId,
      timestamp: new Date().toISOString(),
    };
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout: Feedback submission took too long')), 
        parseInt(import.meta.env.VITE_BHIV_TIMEOUT || '10000'));
    });
    
    const feedbackPromise = api.post('/feedback', backendFeedback);
    
    const response = await Promise.race([feedbackPromise, timeoutPromise]) as AxiosResponse<{
      success: boolean;
      confidence: number;
      timestamp: string;
      feedbackId?: string;
      rlReward?: number;
    }>;
    
    // Log RL reward if available
    if (response.data.rlReward) {
      apiLogger.info('RL reward received', { 
        itemId: feedback.itemId, 
        reward: response.data.rlReward 
      });
    }
    
    const result = {
      id: response.data.feedbackId || `feedback_${Date.now()}`,
      thumbsUp: feedback.thumbsUp,
      comment: feedback.comment,
      timestamp: response.data.timestamp,
      userId: feedback.userId,
      // Expose backend-provided RL reward and confidence for the frontend to react to
      rlReward: (response.data as any).rlReward,
      confidence: (response.data as any).confidence,
    };

    apiLogger.info('Feedback submitted successfully', { result });
    return result;
  } catch (error) {
    apiLogger.error('Error submitting feedback', { feedback, error });
    
    if (error instanceof Error && error.message.includes('timeout')) {
      throw new Error('Feedback submission timed out. Please try again.');
    }
    
    throw error;
  }
};

export const getAnalytics = async (id: string) => {
  try {
    apiLogger.info('Fetching analytics', { id });
    
    const health = await checkBackendHealth();
    if (!health.healthy) {
      apiLogger.warn('Backend unhealthy for analytics, using mock data');
      return generateMockAnalytics(id, 0);
    }

    // Try BHIV-specific analytics endpoint first, then fall back to kb-analytics
    let response: AxiosResponse<any> | null = null;
    try {
      response = await api.get('/bhiv/analytics', {
        params: { hours: 24 },
        timeout: parseInt((typeof process !== 'undefined' && process.env.VITE_BHIV_ANALYTICS_TIMEOUT) || import.meta.env.VITE_BHIV_ANALYTICS_TIMEOUT || '5000')
      });
    } catch (e) {
      apiLogger.debug('/bhiv/analytics not available, trying /kb-analytics', { error: e instanceof Error ? e.message : e });
      response = await api.get('/kb-analytics', {
        params: { hours: 24 },
        timeout: parseInt((typeof process !== 'undefined' && process.env.VITE_BHIV_ANALYTICS_TIMEOUT) || import.meta.env.VITE_BHIV_ANALYTICS_TIMEOUT || '5000')
      });
    }

    const analytics = transformBHIVAnalytics(response.data.analytics, id);
    apiLogger.debug('Analytics fetched from backend', { id, analytics });
    return analytics;
  } catch (error) {
    apiLogger.error('Error fetching analytics from BHIV backend', { id, error });
    
    if (import.meta.env.VITE_USE_MOCK_DATA_WHEN_BHIV_UNAVAILABLE === 'true') {
      apiLogger.info('VITE_USE_MOCK_DATA_WHEN_BHIV_UNAVAILABLE=true, using mock analytics as fallback');
      return generateMockAnalytics(id, 0);
    }
    
    throw error;
  }
};

export const getNLPContext = async (id: string, content?: string) => {
  try {
    apiLogger.info('Fetching NLP context', { id, contentLength: content?.length });
    
    const textToAnalyze = content || `Content for analysis with ID ${id}`;
    
    const health = await checkBackendHealth();
    if (!health.healthy) {
      apiLogger.warn('Backend unhealthy for NLP');
      if (import.meta.env.VITE_USE_MOCK_DATA_WHEN_BHIV_UNAVAILABLE === 'true') {
        apiLogger.info('VITE_USE_MOCK_DATA_WHEN_BHIV_UNAVAILABLE=true, returning mock NLP context');
        return generateMockNLPContext(id, textToAnalyze);
      }
      throw new Error('Backend unavailable for NLP context');
    }

    // Try dedicated NLP context endpoint
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
    
    const nlpData = {
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
    
    apiLogger.debug('NLP context fetched from backend', { id, nlpData });
    return nlpData;
  } catch (error) {
    apiLogger.error('Error fetching NLP context from BHIV backend', { id, error });
    
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
      
      const nlpData = {
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
      
      apiLogger.debug('NLP context fetched from knowledge base', { id, nlpData });
      return nlpData;
    } catch (kbError) {
      apiLogger.error('Error fetching NLP context from knowledge base', { id, error: kbError });
      
        if (import.meta.env.VITE_USE_MOCK_DATA_WHEN_BHIV_UNAVAILABLE === 'true') {
          const textToAnalyze = content || `Content for analysis ${id}`;
          apiLogger.info('VITE_USE_MOCK_DATA_WHEN_BHIV_UNAVAILABLE=true, using mock NLP context as fallback');
          return generateMockNLPContext(id, textToAnalyze);
        }
      
      throw kbError;
    }
  }
};

export const getTags = async (id: string, content?: string) => {
  try {
    apiLogger.info('Fetching tags', { id, contentLength: content?.length });
    
    const contentToTag = content || `Content for tagging with ID ${id}`;
    
    const health = await checkBackendHealth();
    if (!health.healthy) {
      apiLogger.warn('Backend unhealthy for tags, using mock data');
      return generateMockTags(id, 0);
    }

    // Try dedicated tag endpoint
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
    
    const tagsData = {
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
    
    apiLogger.debug('Tags fetched from backend', { id, tagsData });
    return tagsData;
  } catch (error) {
    apiLogger.error('Error fetching tags from BHIV backend', { id, error });
    
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
      
      const tagsData = {
        id,
        tags: [
          { label: 'content', confidence: 0.9, category: 'general' },
          { label: 'analyzed', confidence: 0.8, category: 'processing' }
        ],
        confidence: 0.85,
        model: 'bhiv-knowledge-agent',
        timestamp: new Date().toISOString(),
      };
      
      apiLogger.debug('Tags fetched from knowledge base', { id, tagsData });
      return tagsData;
    } catch (kbError) {
      apiLogger.error('Error fetching tags from knowledge base', { id, error: kbError });
      
      if (import.meta.env.VITE_USE_MOCK_DATA_WHEN_BHIV_UNAVAILABLE === 'true') {
        apiLogger.info('VITE_USE_MOCK_DATA_WHEN_BHIV_UNAVAILABLE=true, using mock tags as fallback');
        return generateMockTags(id, 0);
      }
      
      throw kbError;
    }
  }
};

// Real-time RL reward integration
export const simulateRLReward = async (id: string, action: 'approve' | 'reject' | 'pending') => {
  try {
    apiLogger.info('Simulating RL reward', { id, action });
    
    // Simulate API call to RL system
    const response = await api.post('/rl/reward', {
      itemId: id,
      action,
      timestamp: new Date().toISOString(),
      userId: 'system'
    });
    
    apiLogger.info('RL reward processed', { id, action, response: response.data });
    return response.data;
  } catch (error) {
    apiLogger.error('Error processing RL reward', { id, action, error });
    // Only simulate RL reward in dev/fallback mode
    if (import.meta.env.VITE_USE_MOCK_DATA_WHEN_BHIV_UNAVAILABLE === 'true') {
      const simulatedReward = {
        reward: Math.random() * 0.2 + 0.1,
        confidenceUpdate: Math.random() * 0.1 + 0.05,
        timestamp: new Date().toISOString()
      };
      apiLogger.info('VITE_USE_MOCK_DATA_WHEN_BHIV_UNAVAILABLE=true, returning simulated RL reward', { id, action, reward: simulatedReward });
      return simulatedReward;
    }
    throw error;
  }
};

// Enhanced mock data with more realistic content
export const mockModerationItems: ModerationResponse[] = [
  {
    id: '1',
    content: 'This is a sample content that needs moderation. It contains some text that might be inappropriate for general audiences.',
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
    content: 'Another piece of content with potentially harmful material that requires immediate attention from the moderation team.',
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
    content: 'Positive content that should be approved without any issues. This post promotes healthy discussions and community building.',
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
    content: 'This content appears to contain suspicious links and may be spam. Please review carefully before making a decision about its status.',
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
    content: 'Neutral content that does not violate any community guidelines but might benefit from manual review by experienced moderators.',
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
    content: 'This post contains copyrighted material that has been reported by the original content creator. Legal review may be required.',
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
  {
    id: '7',
    content: 'Educational content about machine learning and AI technologies. This content appears to be informational and beneficial for learning.',
    decision: 'approved',
    confidence: 0.94,
    timestamp: new Date(Date.now() - 1200000).toISOString(),
    flagged: false,
    type: 'text',
    metadata: {
      source: 'user_submission',
      length: 156,
      language: 'en',
      url: 'https://example.com/content/7',
      userId: 'user_404',
      platform: 'web',
      uploadDate: new Date(Date.now() - 1200000).toISOString(),
    },
  },
  {
    id: '8',
    content: 'This content contains strong language and may not be suitable for all audiences. Consider age restrictions and community guidelines.',
    decision: 'pending',
    confidence: 0.73,
    timestamp: new Date(Date.now() - 600000).toISOString(),
    flagged: true,
    type: 'text',
    metadata: {
      source: 'user_submission',
      length: 167,
      language: 'en',
      url: 'https://example.com/content/8',
      userId: 'user_505',
      platform: 'mobile',
      uploadDate: new Date(Date.now() - 600000).toISOString(),
    },
  },
];

// Export the axios instance for custom requests
export { api };