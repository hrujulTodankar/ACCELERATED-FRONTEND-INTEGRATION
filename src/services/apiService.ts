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

// Additional Service Base URLs
const taggingBaseURL = (typeof process !== 'undefined' && process.env.TAGGING_BASE_URL)
  ? process.env.TAGGING_BASE_URL
  : (import.meta.env?.VITE_TAGGING_BASE_URL || 'http://localhost:8002');

const insightsBaseURL = (typeof process !== 'undefined' && process.env.INSIGHTS_BASE_URL)
  ? process.env.INSIGHTS_BASE_URL
  : (import.meta.env?.VITE_INSIGHTS_BASE_URL || 'http://localhost:8003');

const defaultTimeout = parseInt((typeof process !== 'undefined' && process.env.VITE_BHIV_TIMEOUT) || import.meta.env?.VITE_BHIV_TIMEOUT || '10000');

// Helper to apply standard interceptors to any service instance
const setupInterceptors = (instance: any, serviceName: string) => {
  // Enhanced request interceptor with detailed logging
  instance.interceptors.request.use(
    (config: any) => {
      const startTime = Date.now();
      (config as any).metadata = { startTime };
      
      apiLogger.debug(`[${serviceName}] Making ${config.method?.toUpperCase()} request to ${config.url}`);
      
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Add request ID for tracking
      config.headers['X-Request-ID'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return config;
    },
    (error: any) => {
      apiLogger.error(`[${serviceName}] Request interceptor error`, error);
      return Promise.reject(error);
    }
  );

  // Enhanced response interceptor with performance tracking
  instance.interceptors.response.use(
    (response: any) => {
      const duration = Date.now() - ((response.config as any).metadata?.startTime || Date.now());
      apiLogger.debug(`[${serviceName}] Response received in ${duration}ms from ${response.config.url}`);
      
      // Add response metadata
      (response as any).metadata = {
        duration,
        requestId: response.config.headers['X-Request-ID'],
        timestamp: new Date().toISOString(),
      };
      
      return response;
    },
    (error: any) => {
      const duration = error.config ? ((error.config as any).metadata?.startTime ? 
        Date.now() - (error.config as any).metadata.startTime : 'unknown') : 'unknown';
      
      apiLogger.error(`[${serviceName}] Request failed after ${duration}ms: ${error.config?.url}`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response?.status === 401) {
        apiLogger.warn(`[${serviceName}] Unauthorized access detected, clearing auth token`);
        localStorage.removeItem('authToken');
      }
      return Promise.reject(error);
    }
  );
};

// Core Service (v1-BHIV_CORE)
const api = axios.create({ baseURL: resolvedBaseURL, timeout: defaultTimeout, headers: { 'Content-Type': 'application/json' } });
setupInterceptors(api, 'BHIV-Core');

// Tagging Service (adaptive-tagging)
const taggingApi = axios.create({ baseURL: taggingBaseURL, timeout: defaultTimeout, headers: { 'Content-Type': 'application/json' } });
setupInterceptors(taggingApi, 'Adaptive-Tagging');

// Insights Service (insightbridge-phase3)
const insightsApi = axios.create({ baseURL: insightsBaseURL, timeout: defaultTimeout, headers: { 'Content-Type': 'application/json' } });
setupInterceptors(insightsApi, 'Insight-Bridge');

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
    
    // Try to get items from BHIV backend
    const response: AxiosResponse<{
      data: ModerationResponse[];
      total: number;
      page: number;
      limit: number;
    }> = await api.get('/moderate', { params });
    
    apiLogger.info('Successfully fetched moderation items from backend', {
      count: response.data.data?.length || 0,
      total: response.data.total
    });
    
    // Transform real data to include UI-required fields if missing (Stability & Visual Indicators)
    const transformedData = response.data.data?.map((item: any) => {
      const enrichedItem = { ...item };
      
      // Ensure statusBadge exists for UI indicators
      if (!enrichedItem.statusBadge) {
        if (enrichedItem.decision === 'approved' || enrichedItem.decision === 'rejected') {
          enrichedItem.statusBadge = { 
            type: 'updated', 
            timestamp: new Date().toISOString(), 
            message: 'Updated after feedback' 
          };
        } else if ((enrichedItem.confidence || 0) < 0.7) {
          enrichedItem.statusBadge = { 
            type: 'awaiting', 
            timestamp: new Date().toISOString(), 
            message: 'Awaiting RL decision' 
          };
        } else {
          enrichedItem.statusBadge = { 
            type: 'pending', 
            timestamp: new Date().toISOString(), 
            message: 'Pending review' 
          };
        }
      }
      
      return enrichedItem;
    }) || [];

    return {
      ...response.data,
      data: transformedData
    };
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
    
    // Check if we should use mock data fallback
    if (import.meta.env.VITE_USE_MOCK_DATA_WHEN_BHIV_UNAVAILABLE === 'true') {
      apiLogger.info('VITE_USE_MOCK_DATA_WHEN_BHIV_UNAVAILABLE=true, using mock feedback response as fallback');
      
      // Return a mock successful response
      const mockResult = {
        id: `mock_feedback_${Date.now()}`,
        thumbsUp: feedback.thumbsUp,
        comment: feedback.comment,
        timestamp: new Date().toISOString(),
        userId: feedback.userId,
        rlReward: Math.random() * 0.2 + 0.1, // Simulate RL reward
        confidence: 0.85 + (Math.random() * 0.1), // Simulate confidence update
      };
      
      apiLogger.info('Mock feedback submitted successfully', { result: mockResult });
      return mockResult;
    }
    
    if (error instanceof Error && error.message.includes('timeout')) {
      throw new Error('Feedback submission timed out. Please try again.');
    }
    
    if (error instanceof Error && (error.message.includes('Network Error') || error.message.includes('ECONNREFUSED') || error.message.includes('AxiosError'))) {
      throw new Error('Unable to connect to the server. Please ensure the backend service is running, or enable mock data mode.');
    }
    
    throw error;
  }
};

export const getAnalytics = async (id: string) => {
  try {
    apiLogger.info('Fetching analytics', { id });
    
    // Try InsightBridge analytics endpoint first, then fall back to Core kb-analytics
    let response: AxiosResponse<any> | null = null;
    try {
      response = await insightsApi.get('/bhiv/analytics', {
        params: { hours: 24 },
        timeout: parseInt((typeof process !== 'undefined' && process.env.VITE_BHIV_ANALYTICS_TIMEOUT) || import.meta.env.VITE_BHIV_ANALYTICS_TIMEOUT || '5000')
      });
    } catch (e) {
      apiLogger.debug('InsightBridge analytics not available, trying Core /kb-analytics', { error: e instanceof Error ? e.message : e });
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

    // Try dedicated NLP context endpoint (InsightBridge)
    const response: AxiosResponse<{
      status: string;
      analysis: any;
      timestamp: string;
    }> = await insightsApi.get('/nlp/context', {
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
    apiLogger.error('Error fetching NLP context from InsightBridge', { id, error });
    
    // Fallback to knowledge base endpoint (Core)
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

// Enhanced Tag Generation with InsightBridge Integration
export const getTags = async (id: string, content?: string) => {
  try {
    apiLogger.info('Fetching enhanced tags', { id, contentLength: content?.length });
    
    const contentToTag = content || `Content for tagging with ID ${id}`;
    let enrichedTags: any[] = [];
    let primaryModel = 'bhiv-tag-generator';

    // Phase 1: Try InsightBridge for enriched NLP-based tagging
    try {
      apiLogger.debug('Attempting InsightBridge enriched tagging', { id });
      const insightResponse = await insightsApi.post('/nlp/analyze', {
        text: contentToTag,
        analysis_types: ['entities', 'topics', 'sentiment', 'keywords'],
        extract_tags: true,
        max_tags: 8
      });
      
      if (insightResponse.data && insightResponse.data.tags) {
        enrichedTags = insightResponse.data.tags.map((tag: any) => ({
          label: tag.label || tag.text,
          confidence: tag.confidence || tag.score || 0.8,
          category: tag.category || tag.type || 'insightbridge',
          source: 'insightbridge'
        }));
        primaryModel = 'insightbridge-nlp-v2';
        apiLogger.info('Successfully fetched enriched tags from InsightBridge', { id, tagCount: enrichedTags.length });
      }
    } catch (insightError) {
      apiLogger.debug('InsightBridge tagging failed, trying alternative methods', { id, error: insightError });
    }

    // Phase 2: Try Adaptive Tagging Service for additional tags
    if (enrichedTags.length < 5) {
      try {
        apiLogger.debug('Attempting Adaptive Tagging Service', { id });
        const taggingResponse: AxiosResponse<{
          status: string;
          tags: any[];
          total_tags: number;
          timestamp: string;
        }> = await taggingApi.get('/tag', {
          params: {
            content: contentToTag,
            max_tags: Math.max(3, 8 - enrichedTags.length)
          }
        });
        
        if (taggingResponse.data.tags) {
          const adaptiveTags = taggingResponse.data.tags.map((tag: any) => ({
            label: tag.tag,
            confidence: tag.score || 0.7,
            category: tag.category || 'adaptive',
            source: 'adaptive-tagging'
          }));
          
          // Merge and deduplicate tags
          enrichedTags = mergeAndDeduplicateTags([...enrichedTags, ...adaptiveTags]);
          primaryModel = 'hybrid-insightbridge-adaptive';
          apiLogger.info('Successfully enhanced tags with Adaptive Tagging', { id, totalTags: enrichedTags.length });
        }
      } catch (taggingError) {
        apiLogger.debug('Adaptive tagging failed, proceeding with existing tags', { id, error: taggingError });
      }
    }

    // Phase 3: Fallback to BHIV Core knowledge base
    if (enrichedTags.length < 3) {
      try {
        apiLogger.debug('Attempting BHIV Core knowledge base tagging', { id });
        const kbResponse: AxiosResponse<{
          response: string;
          sources: any[];
          query_id: string;
        }> = await api.post('/query-kb', {
          query: `Analyze and generate relevant tags for: ${contentToTag}`,
          limit: 3,
          user_id: 'frontend_user'
        });
        
        // Extract tags from knowledge base response
        const kbTags = extractTagsFromText(kbResponse.data.response).map((label: string) => ({
          label,
          confidence: 0.6,
          category: 'knowledge-base',
          source: 'bhiv-core'
        }));
        
        enrichedTags = mergeAndDeduplicateTags([...enrichedTags, ...kbTags]);
        primaryModel = 'hybrid-enhanced';
        apiLogger.info('Enhanced tags with BHIV Core knowledge base', { id, totalTags: enrichedTags.length });
      } catch (kbError) {
        apiLogger.debug('BHIV Core tagging failed, using existing tags', { id, error: kbError });
      }
    }

    // Final fallback to mock data if no tags were generated
    if (enrichedTags.length === 0) {
      if (import.meta.env.VITE_USE_MOCK_DATA_WHEN_BHIV_UNAVAILABLE === 'true') {
        apiLogger.info('Using mock tags as final fallback', { id });
        const mockTags = generateMockTags(id, 0).tags;
        enrichedTags = mockTags.map(tag => ({ ...tag, source: 'mock' }));
        primaryModel = 'mock-fallback';
      } else {
        throw new Error('No tags could be generated from any backend service');
      }
    }

    const tagsData = {
      id,
      tags: enrichedTags.slice(0, 8), // Limit to 8 tags for UI
      confidence: Math.min(...enrichedTags.map(t => t.confidence)) || 0.75,
      model: primaryModel,
      timestamp: new Date().toISOString(),
      metadata: {
        totalSources: [...new Set(enrichedTags.map(t => t.source))].length,
        averageConfidence: enrichedTags.reduce((sum, tag) => sum + tag.confidence, 0) / enrichedTags.length
      }
    };
    
    apiLogger.info('Enhanced tagging completed successfully', { 
      id, 
      tagsCount: tagsData.tags.length,
      model: primaryModel,
      sources: tagsData.metadata.totalSources
    });
    return tagsData;
    
  } catch (error) {
    apiLogger.error('All tagging methods failed', { id, error });
    
    if (import.meta.env.VITE_USE_MOCK_DATA_WHEN_BHIV_UNAVAILABLE === 'true') {
      apiLogger.info('Emergency fallback to mock tags');
      const mockTags = generateMockTags(id, 0);
      return {
        ...mockTags,
        tags: mockTags.tags.map(tag => ({ ...tag, source: 'emergency-mock' })),
        model: 'emergency-mock'
      };
    }
    
    throw error;
  }
};

// Helper function to merge and deduplicate tags
const mergeAndDeduplicateTags = (tags: any[]): any[] => {
  const tagMap = new Map<string, any>();
  
  tags.forEach(tag => {
    const key = tag.label.toLowerCase().trim();
    const existing = tagMap.get(key);
    
    if (!existing || tag.confidence > existing.confidence) {
      tagMap.set(key, {
        label: tag.label,
        confidence: tag.confidence,
        category: tag.category || 'general',
        source: tag.source || 'unknown'
      });
    }
  });
  
  return Array.from(tagMap.values())
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 10); // Keep top 10 tags
};

// Helper function to extract tags from text
const extractTagsFromText = (text: string): string[] => {
  if (!text || typeof text !== 'string') return [];
  
  // Simple keyword extraction
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !['that', 'this', 'with', 'from', 'they', 'have', 'been', 'were', 'said', 'each', 'which', 'their', 'time'].includes(word));
  
  // Count word frequency
  const wordCount = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Return top words as tags
  return Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
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

// ==================== INSIGHTBRIDGE SECURITY API INTEGRATION ====================

// Types for InsightBridge Security API
export interface SignatureRequest {
  message: string;
  key_id?: string;
}

export interface SignatureResponse {
  success: boolean;
  signature?: string;
  key_id: string;
  message: string;
}

export interface VerifyRequest {
  message: string;
  signature: string;
  public_key_id?: string;
}

export interface VerifyResponse {
  valid: boolean;
  message: string;
  details?: string;
}

export interface JWTRequest {
  payload: Record<string, any>;
  exp_seconds?: number;
}

export interface JWTResponse {
  token: string;
  payload: Record<string, any>;
  expires_at: number;
}

export interface VerifyJWTRequest {
  token: string;
}

export interface JWTVerifyResponse {
  valid: boolean;
  payload?: Record<string, any>;
  error?: string;
}

export interface NonceRequest {
  nonce: string;
}

export interface NonceResponse {
  accepted: boolean;
  message: string;
}

export interface HashChainEntry {
  data: Record<string, any>;
}

export interface HashChainResponse {
  hash: string;
  previous_hash: string;
  entry_count: number;
  data: Record<string, any>;
}

export interface MessageRequest {
  message: Record<string, any>;
}

export interface ReceiverResponse {
  success: boolean;
  buffer_length: number;
  message: string;
}

export interface AuditResponse {
  chain_length: number;
  last_hash: string;
  total_messages: number;
  buffer_status: string;
}

// InsightBridge Security API Functions
export const signMessage = async (request: SignatureRequest): Promise<SignatureResponse> => {
  try {
    apiLogger.info('Signing message with InsightBridge', { key_id: request.key_id });
    
    const response = await insightsApi.post('/signature/sign', request);
    
    apiLogger.info('Message signed successfully', { key_id: response.data.key_id });
    return response.data;
  } catch (error) {
    apiLogger.error('Error signing message', { request, error });
    throw error;
  }
};

export const verifySignature = async (request: VerifyRequest): Promise<VerifyResponse> => {
  try {
    apiLogger.info('Verifying signature with InsightBridge', { public_key_id: request.public_key_id });
    
    const response = await insightsApi.post('/signature/verify', request);
    
    apiLogger.info('Signature verification completed', { valid: response.data.valid });
    return response.data;
  } catch (error) {
    apiLogger.error('Error verifying signature', { request, error });
    throw error;
  }
};

export const createJWTToken = async (request: JWTRequest): Promise<JWTResponse> => {
  try {
    apiLogger.info('Creating JWT token with InsightBridge', { exp_seconds: request.exp_seconds });
    
    const response = await insightsApi.post('/auth/jwt/create', request);
    
    apiLogger.info('JWT token created successfully', { expires_at: response.data.expires_at });
    return response.data;
  } catch (error) {
    apiLogger.error('Error creating JWT token', { request, error });
    throw error;
  }
};

export const verifyJWTToken = async (request: VerifyJWTRequest): Promise<JWTVerifyResponse> => {
  try {
    apiLogger.info('Verifying JWT token with InsightBridge');
    
    const response = await insightsApi.post('/auth/jwt/verify', request);
    
    apiLogger.info('JWT token verification completed', { valid: response.data.valid });
    return response.data;
  } catch (error) {
    apiLogger.error('Error verifying JWT token', { request, error });
    throw error;
  }
};

export const checkNonce = async (request: NonceRequest): Promise<NonceResponse> => {
  try {
    apiLogger.info('Checking nonce with InsightBridge');
    
    const response = await insightsApi.post('/security/nonce/check', request);
    
    apiLogger.info('Nonce check completed', { accepted: response.data.accepted });
    return response.data;
  } catch (error) {
    apiLogger.error('Error checking nonce', { request, error });
    throw error;
  }
};

export const appendToHashChain = async (request: HashChainEntry): Promise<HashChainResponse> => {
  try {
    apiLogger.info('Appending to hash chain with InsightBridge');
    
    const response = await insightsApi.post('/audit/hashchain/append', request);
    
    apiLogger.info('Hash chain entry added successfully', { entry_count: response.data.entry_count });
    return response.data;
  } catch (error) {
    apiLogger.error('Error appending to hash chain', { request, error });
    throw error;
  }
};

export const getHashChain = async (): Promise<Array<Record<string, any>>> => {
  try {
    apiLogger.info('Getting hash chain from InsightBridge');
    
    const response = await insightsApi.get('/audit/hashchain');
    
    apiLogger.info('Hash chain retrieved successfully', { length: response.data.length });
    return response.data;
  } catch (error) {
    apiLogger.error('Error getting hash chain', error);
    throw error;
  }
};

export const receiveMessage = async (request: MessageRequest): Promise<ReceiverResponse> => {
  try {
    apiLogger.info('Receiving message with InsightBridge');
    
    const response = await insightsApi.post('/receiver/message', request);
    
    apiLogger.info('Message received successfully', { 
      success: response.data.success, 
      buffer_length: response.data.buffer_length 
    });
    return response.data;
  } catch (error) {
    apiLogger.error('Error receiving message', { request, error });
    throw error;
  }
};

export const sendHeartbeat = async (): Promise<{ message: string; status: string }> => {
  try {
    apiLogger.info('Sending heartbeat to InsightBridge');
    
    const response = await insightsApi.post('/receiver/heartbeat');
    
    apiLogger.info('Heartbeat sent successfully');
    return response.data;
  } catch (error) {
    apiLogger.error('Error sending heartbeat', error);
    throw error;
  }
};

export const getAuditStatus = async (): Promise<AuditResponse> => {
  try {
    apiLogger.info('Getting audit status from InsightBridge');
    
    const response = await insightsApi.get('/audit/status');
    
    apiLogger.info('Audit status retrieved successfully', { 
      chain_length: response.data.chain_length,
      total_messages: response.data.total_messages
    });
    return response.data;
  } catch (error) {
    apiLogger.error('Error getting audit status', error);
    throw error;
  }
};

// Enhanced InsightBridge health check
export const checkInsightBridgeHealth = async (): Promise<{
  healthy: boolean;
  latency?: number;
  error?: string;
  services?: Record<string, string>;
}> => {
  try {
    const startTime = Date.now();
    const response = await insightsApi.get('/health', { timeout: 3000 });
    const latency = Date.now() - startTime;
    
    apiLogger.info('InsightBridge health check successful', { latency, services: response.data.services });
    
    return {
      healthy: true,
      latency,
      services: response.data.services,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    apiLogger.warn('InsightBridge health check failed', { error: errorMessage });
    
    return {
      healthy: false,
      error: errorMessage,
    };
  }
};

// Combined security operations
export const performSecureOperation = async (
  operation: string,
  data: Record<string, any>,
  options: {
    requireSignature?: boolean;
    requireJWT?: boolean;
    requireNonce?: boolean;
    keyId?: string;
  } = {}
): Promise<{
  success: boolean;
  data?: any;
  audit_hash?: string;
  error?: string;
}> => {
  try {
    apiLogger.info('Performing secure operation', { operation, options });
    
    // Step 1: Generate nonce for replay protection
    let nonce: string | undefined;
    if (options.requireNonce) {
      nonce = `nonce_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await checkNonce({ nonce });
    }
    
    // Step 2: Create JWT if required
    let jwtToken: string | undefined;
    if (options.requireJWT) {
      const jwtResponse = await createJWTToken({
        payload: {
          operation,
          timestamp: new Date().toISOString(),
          nonce,
          data_hash: btoa(JSON.stringify(data)).slice(0, 16) // Simple hash
        },
        exp_seconds: 300 // 5 minutes
      });
      jwtToken = jwtResponse.token;
    }
    
    // Step 3: Sign the operation if required
    let signature: string | undefined;
    if (options.requireSignature) {
      const messageToSign = JSON.stringify({ operation, data, nonce, jwtToken });
      const signResponse = await signMessage({ 
        message: messageToSign, 
        key_id: options.keyId 
      });
      signature = signResponse.signature;
    }
    
    // Step 4: Perform the actual operation
    const operationData = {
      operation,
      data,
      nonce,
      jwt_token: jwtToken,
      signature,
      timestamp: new Date().toISOString()
    };
    
    // Step 5: Log to audit trail
    const auditResponse = await appendToHashChain({
      data: {
        operation,
        success: true,
        timestamp: new Date().toISOString(),
        data_size: JSON.stringify(data).length
      }
    });
    
    apiLogger.info('Secure operation completed successfully', { 
      operation, 
      audit_hash: auditResponse.hash 
    });
    
    return {
      success: true,
      data: operationData,
      audit_hash: auditResponse.hash
    };
  } catch (error) {
    apiLogger.error('Secure operation failed', { operation, error });
    
    // Log failure to audit trail
    try {
      await appendToHashChain({
        data: {
          operation,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      });
    } catch (auditError) {
      apiLogger.error('Failed to log operation failure to audit trail', auditError);
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// ==================== BHIV CORE COMPREHENSIVE API INTEGRATION ====================

// Types for BHIV Core API
export interface BHIVQueryRequest {
  query: string;
  user_id?: string;
}

export interface BHIVQueryResponse {
  query_id: string;
  query: string;
  response: string;
  sources: Array<{
    text: string;
    source: string;
  }>;
  timestamp: string;
  endpoint: string;
  status: number;
}

export interface BHIVKBRequest {
  query: string;
  limit?: number;
  user_id?: string;
  filters?: Record<string, any>;
}

export interface BHIVKBResponse {
  response: string;
  sources: Array<{
    text: string;
    source: string;
  }>;
  query_id: string;
  timestamp: string;
}

export interface BHIVNasKBStatus {
  status: string;
  system_tests: Record<string, boolean>;
  statistics: Record<string, any>;
  timestamp: string;
}

export interface BHIVNasKBDocument {
  status: string;
  documents: Array<{
    id: string;
    title: string;
    path: string;
    size: number;
    modified: string;
  }>;
  count: number;
  timestamp: string;
}

export interface BHIVNasKBSearchResult {
  status: string;
  query: string;
  results: Array<{
    document_id: string;
    content: string;
    score: number;
  }>;
  count: number;
  timestamp: string;
}

export interface BHIVKBFeedbackRequest {
  query_id: string;
  feedback: Record<string, any>;
}

export interface BHIVKBFeedbackResponse {
  status: string;
  message: string;
  query_id: string;
}

// BHIV Core Service Functions
export const askVedas = async (request: BHIVQueryRequest): Promise<BHIVQueryResponse> => {
  try {
    apiLogger.info('Asking Vedas endpoint', { query: request.query });
    
    const response = await api.post('/ask-vedas', request);
    
    apiLogger.info('Vedas response received', { query_id: response.data.query_id });
    return response.data;
  } catch (error) {
    apiLogger.error('Error calling ask-vedas', { request, error });
    throw error;
  }
};

export const askVedasGet = async (query: string, user_id?: string): Promise<BHIVQueryResponse> => {
  try {
    apiLogger.info('GET ask-vedas', { query, user_id });
    
    const response = await api.get('/ask-vedas', {
      params: { query, user_id }
    });
    
    apiLogger.info('Vedas GET response received', { query_id: response.data.query_id });
    return response.data;
  } catch (error) {
    apiLogger.error('Error calling ask-vedas GET', { query, user_id, error });
    throw error;
  }
};

export const askEdumentor = async (request: BHIVQueryRequest): Promise<BHIVQueryResponse> => {
  try {
    apiLogger.info('Asking Edumentor endpoint', { query: request.query });
    
    const response = await api.post('/edumentor', request);
    
    apiLogger.info('Edumentor response received', { query_id: response.data.query_id });
    return response.data;
  } catch (error) {
    apiLogger.error('Error calling edumentor', { request, error });
    throw error;
  }
};

export const askEdumentorGet = async (query: string, user_id?: string): Promise<BHIVQueryResponse> => {
  try {
    apiLogger.info('GET edumentor', { query, user_id });
    
    const response = await api.get('/edumentor', {
      params: { query, user_id }
    });
    
    apiLogger.info('Edumentor GET response received', { query_id: response.data.query_id });
    return response.data;
  } catch (error) {
    apiLogger.error('Error calling edumentor GET', { query, user_id, error });
    throw error;
  }
};

export const askWellness = async (request: BHIVQueryRequest): Promise<BHIVQueryResponse> => {
  try {
    apiLogger.info('Asking Wellness endpoint', { query: request.query });
    
    const response = await api.post('/wellness', request);
    
    apiLogger.info('Wellness response received', { query_id: response.data.query_id });
    return response.data;
  } catch (error) {
    apiLogger.error('Error calling wellness', { request, error });
    throw error;
  }
};

export const askWellnessGet = async (query: string, user_id?: string): Promise<BHIVQueryResponse> => {
  try {
    apiLogger.info('GET wellness', { query, user_id });
    
    const response = await api.get('/wellness', {
      params: { query, user_id }
    });
    
    apiLogger.info('Wellness GET response received', { query_id: response.data.query_id });
    return response.data;
  } catch (error) {
    apiLogger.error('Error calling wellness GET', { query, user_id, error });
    throw error;
  }
};

export const queryKnowledgeBase = async (request: BHIVKBRequest): Promise<BHIVKBResponse> => {
  try {
    apiLogger.info('Querying knowledge base', { query: request.query, limit: request.limit });
    
    const response = await api.post('/query-kb', request);
    
    apiLogger.info('Knowledge base response received', { query_id: response.data.query_id });
    return response.data;
  } catch (error) {
    apiLogger.error('Error querying knowledge base', { request, error });
    throw error;
  }
};

export const queryKnowledgeBaseGet = async (query: string, limit?: number, user_id?: string): Promise<BHIVKBResponse> => {
  try {
    apiLogger.info('GET query-kb', { query, limit, user_id });
    
    const response = await api.get('/query-kb', {
      params: { query, limit, user_id }
    });
    
    apiLogger.info('Knowledge base GET response received', { query_id: response.data.query_id });
    return response.data;
  } catch (error) {
    apiLogger.error('Error querying knowledge base GET', { query, limit, user_id, error });
    throw error;
  }
};

// NAS Knowledge Base Functions
export const getNasKBStatus = async (): Promise<BHIVNasKBStatus> => {
  try {
    apiLogger.info('Getting NAS KB status');
    
    const response = await api.get('/nas-kb/status');
    
    apiLogger.info('NAS KB status retrieved', { status: response.data.status });
    return response.data;
  } catch (error) {
    apiLogger.error('Error getting NAS KB status', error);
    throw error;
  }
};

export const listNasKBDocuments = async (): Promise<BHIVNasKBDocument> => {
  try {
    apiLogger.info('Listing NAS KB documents');
    
    const response = await api.get('/nas-kb/documents');
    
    apiLogger.info('NAS KB documents listed', { count: response.data.count });
    return response.data;
  } catch (error) {
    apiLogger.error('Error listing NAS KB documents', error);
    throw error;
  }
};

export const searchNasKB = async (query: string, limit?: number): Promise<BHIVNasKBSearchResult> => {
  try {
    apiLogger.info('Searching NAS KB', { query, limit });
    
    const response = await api.get('/nas-kb/search', {
      params: { query, limit }
    });
    
    apiLogger.info('NAS KB search completed', { count: response.data.count });
    return response.data;
  } catch (error) {
    apiLogger.error('Error searching NAS KB', { query, limit, error });
    throw error;
  }
};

export const getNasKBDocument = async (document_id: string): Promise<{
  status: string;
  document_id: string;
  content: string;
  timestamp: string;
}> => {
  try {
    apiLogger.info('Getting NAS KB document', { document_id });
    
    const response = await api.get(`/nas-kb/document/${document_id}`);
    
    apiLogger.info('NAS KB document retrieved', { document_id });
    return response.data;
  } catch (error) {
    apiLogger.error('Error getting NAS KB document', { document_id, error });
    throw error;
  }
};

// Feedback and Analytics Functions
export const submitKBFeedback = async (request: BHIVKBFeedbackRequest): Promise<BHIVKBFeedbackResponse> => {
  try {
    apiLogger.info('Submitting KB feedback', { query_id: request.query_id });
    
    const response = await api.post('/kb-feedback', request);
    
    apiLogger.info('KB feedback submitted', { query_id: request.query_id });
    return response.data;
  } catch (error) {
    apiLogger.error('Error submitting KB feedback', { request, error });
    throw error;
  }
};

export const getKBAnalytics = async (hours?: number): Promise<{
  status: string;
  analytics: {
    total_queries: number;
    avg_response_time: number;
    success_rate: number;
    queries_by_endpoint: Record<string, number>;
  };
  timestamp: string;
}> => {
  try {
    apiLogger.info('Getting KB analytics', { hours });
    
    const response = await api.get('/kb-analytics', {
      params: { hours }
    });
    
    apiLogger.info('KB analytics retrieved', { 
      total_queries: response.data.analytics?.total_queries 
    });
    return response.data;
  } catch (error) {
    apiLogger.error('Error getting KB analytics', { hours, error });
    throw error;
  }
};

// Enhanced BHIV Core health check with comprehensive diagnostics
export const checkBHIVCoreHealth = async (): Promise<{
  healthy: boolean;
  latency?: number;
  error?: string;
  services?: Record<string, string>;
  uptime_seconds?: number;
  version?: string;
  endpoints?: string[];
}> => {
  try {
    const startTime = Date.now();
    const response = await api.get('/health', { timeout: 3000 });
    const latency = Date.now() - startTime;
    
    apiLogger.info('BHIV Core health check successful', { latency, services: response.data.services });
    
    return {
      healthy: true,
      latency,
      services: response.data.services,
      uptime_seconds: response.data.uptime_seconds,
      version: response.data.version,
      endpoints: response.data.endpoints || []
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    apiLogger.warn('BHIV Core health check failed', { error: errorMessage });
    
    return {
      healthy: false,
      error: errorMessage,
    };
  }
};

// Comprehensive backend connectivity test
export const testAllBackendConnections = async (): Promise<{
  bhiv_core: { healthy: boolean; latency?: number; error?: string };
  insightbridge: { healthy: boolean; latency?: number; error?: string };
  tagging_service: { healthy: boolean; latency?: number; error?: string };
  overall_status: 'all_healthy' | 'partial' | 'all_unhealthy';
}> => {
  apiLogger.info('Testing all backend connections');
  
  const tests = await Promise.allSettled([
    checkBHIVCoreHealth(),
    checkInsightBridgeHealth(),
    checkBackendHealth() // Using existing health check for tagging service
  ]);
  
  const bhiv_core = tests[0].status === 'fulfilled' ? tests[0].value : { healthy: false, error: tests[0].reason?.message };
  const insightbridge = tests[1].status === 'fulfilled' ? tests[1].value : { healthy: false, error: tests[1].reason?.message };
  const tagging_service = tests[2].status === 'fulfilled' ? tests[2].value : { healthy: false, error: tests[2].reason?.message };
  
  const healthyCount = [bhiv_core, insightbridge, tagging_service].filter(conn => conn.healthy).length;
  let overall_status: 'all_healthy' | 'partial' | 'all_unhealthy';
  
  if (healthyCount === 3) overall_status = 'all_healthy';
  else if (healthyCount === 0) overall_status = 'all_unhealthy';
  else overall_status = 'partial';
  
  apiLogger.info('Backend connectivity test completed', { 
    overall_status, 
    healthy_services: healthyCount,
    total_services: 3 
  });
  
  return {
    bhiv_core,
    insightbridge,
    tagging_service,
    overall_status
  };
};

// Enhanced content analysis combining multiple backends
export const analyzeContentComprehensive = async (content: string, options: {
  includeTags?: boolean;
  includeNLP?: boolean;
  includeAnalytics?: boolean;
  includeSecurity?: boolean;
} = {}) => {
  const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  apiLogger.info('Starting comprehensive content analysis', { analysisId, contentLength: content.length, options });
  
  const results: any = {
    analysisId,
    content,
    timestamp: new Date().toISOString(),
    results: {}
  };
  
  try {
    // Parallel analysis from multiple sources
    const analysisPromises = [];
    
    if (options.includeTags !== false) {
      analysisPromises.push(
        getTags(analysisId, content).then(tags => ({ type: 'tags', data: tags })).catch(err => ({ type: 'tags', error: err.message }))
      );
    }
    
    if (options.includeNLP !== false) {
      analysisPromises.push(
        getNLPContext(analysisId, content).then(nlp => ({ type: 'nlp', data: nlp })).catch(err => ({ type: 'nlp', error: err.message }))
      );
    }
    
    if (options.includeAnalytics) {
      analysisPromises.push(
        getAnalytics(analysisId).then(analytics => ({ type: 'analytics', data: analytics })).catch(err => ({ type: 'analytics', error: err.message }))
      );
    }
    
    if (options.includeSecurity) {
      analysisPromises.push(
        performSecureOperation('content_analysis', { content }, {
          requireJWT: true,
          requireNonce: true
        }).then(security => ({ type: 'security', data: security })).catch(err => ({ type: 'security', error: err.message }))
      );
    }
    
    const analysisResults = await Promise.allSettled(analysisPromises);
    
    // Process results
    analysisResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.results[result.value.type] = result.value.data || { error: result.value.error };
      } else {
        const promise = analysisPromises[index] as Promise<any>;
        promise.catch(err => {
          results.results[err.type || 'unknown'] = { error: err.message };
        });
      }
    });
    
    // Calculate overall confidence score
    const successfulAnalyses = Object.values(results.results).filter((result: any) => !result.error);
    results.overallConfidence = successfulAnalyses.length > 0 
      ? successfulAnalyses.reduce((sum: number, result: any) => sum + (result.confidence || 0.7), 0) / successfulAnalyses.length
      : 0.5;
    
    apiLogger.info('Comprehensive content analysis completed', { 
      analysisId, 
      successfulAnalyses: successfulAnalyses.length,
      totalAnalyses: Object.keys(results.results).length,
      overallConfidence: results.overallConfidence
    });
    
    return results;
    
  } catch (error) {
    apiLogger.error('Comprehensive content analysis failed', { analysisId, error });
    throw error;
  }
};

// Smart content routing based on backend availability
export const smartContentProcessing = async (content: string, preferences: {
  preferInsightBridge?: boolean;
  preferBHIVCore?: boolean;
  fallbackToMock?: boolean;
} = {}) => {
  const processingId = `smart_${Date.now()}`;
  apiLogger.info('Starting smart content processing', { processingId, preferences });
  
  try {
    // Check backend availability
    const connectivity = await testAllBackendConnections();
    
    let selectedStrategy = 'mock'; // default
    
    if (connectivity.overall_status === 'all_healthy') {
      selectedStrategy = preferences.preferInsightBridge ? 'insightbridge_first' : 'bhiv_first';
    } else if (connectivity.overall_status === 'partial') {
      if (connectivity.insightbridge.healthy && preferences.preferInsightBridge) {
        selectedStrategy = 'insightbridge_only';
      } else if (connectivity.bhiv_core.healthy) {
        selectedStrategy = 'bhiv_only';
      } else {
        selectedStrategy = 'available_backend';
      }
    } else if (connectivity.overall_status === 'all_unhealthy' && preferences.fallbackToMock) {
      selectedStrategy = 'mock_fallback';
    }
    
    let result;
    
    switch (selectedStrategy) {
      case 'insightbridge_first':
        result = await performBHIVOperation('kb_query', { 
          query: `Analyze and process: ${content}`,
          limit: 3,
          user_id: 'smart_processor'
        }, { includeSources: true, fallback: preferences.fallbackToMock });
        break;
        
      case 'bhiv_first':
        result = await performBHIVOperation('kb_query', { 
          query: `Analyze and process: ${content}`,
          limit: 3,
          user_id: 'smart_processor'
        }, { includeSources: true, fallback: preferences.fallbackToMock });
        break;
        
      case 'insightbridge_only':
        // Use only InsightBridge endpoints
        result = await insightsApi.post('/nlp/analyze', {
          text: content,
          analysis_types: ['full']
        }).then(response => ({
          success: true,
          data: response.data,
          endpoint: 'insightbridge',
          strategy: 'insightbridge_only'
        }));
        break;
        
      case 'bhiv_only':
        // Use only BHIV Core endpoints
        result = await api.post('/query-kb', {
          query: `Analyze and process: ${content}`,
          limit: 3,
          user_id: 'smart_processor'
        }).then(response => ({
          success: true,
          data: response.data,
          endpoint: 'bhiv_core',
          strategy: 'bhiv_only'
        }));
        break;
        
      case 'mock_fallback':
      default:
        result = {
          success: true,
          data: {
            response: `Smart processing of content: "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}". Backend services are currently unavailable.`,
            sources: [],
            analysis: 'Mock analysis due to backend unavailability'
          },
          endpoint: 'mock',
          strategy: 'mock_fallback'
        };
        break;
    }
    
    apiLogger.info('Smart content processing completed', { 
      processingId, 
      strategy: selectedStrategy,
      backendUsed: result.endpoint,
      success: result.success
    });
    
    return {
      ...result,
      processingId,
      strategy: selectedStrategy,
      connectivityStatus: connectivity.overall_status
    };
    
  } catch (error) {
    apiLogger.error('Smart content processing failed', { processingId, error });
    
    if (preferences.fallbackToMock) {
      return {
        success: true,
        data: {
          response: `Content processed with fallback: "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"`,
          sources: [],
          analysis: 'Fallback processing due to error'
        },
        endpoint: 'emergency_fallback',
        strategy: 'emergency_fallback',
        processingId,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    
    throw error;
  }
};

// Combined BHIV operations for complex workflows
export const performBHIVOperation = async (
  operation: 'vedas' | 'edumentor' | 'wellness' | 'kb_query',
  data: {
    query?: string;
    content?: string;
    limit?: number;
    user_id?: string;
  },
  options: {
    includeSources?: boolean;
    useGet?: boolean;
    fallback?: boolean;
  } = {}
): Promise<{
  success: boolean;
  data?: any;
  sources?: Array<{ text: string; source: string }>;
  error?: string;
  endpoint?: string;
}> => {
  try {
    apiLogger.info('Performing BHIV operation', { operation, data, options });
    
    let result;
    
    switch (operation) {
      case 'vedas':
        result = options.useGet 
          ? await askVedasGet(data.query!, data.user_id)
          : await askVedas({ query: data.query!, user_id: data.user_id });
        break;
        
      case 'edumentor':
        result = options.useGet
          ? await askEdumentorGet(data.query!, data.user_id)
          : await askEdumentor({ query: data.query!, user_id: data.user_id });
        break;
        
      case 'wellness':
        result = options.useGet
          ? await askWellnessGet(data.query!, data.user_id)
          : await askWellness({ query: data.query!, user_id: data.user_id });
        break;
        
      case 'kb_query':
        result = options.useGet
          ? await queryKnowledgeBaseGet(data.query!, data.limit, data.user_id)
          : await queryKnowledgeBase({ 
              query: data.query!, 
              limit: data.limit, 
              user_id: data.user_id 
            });
        break;
        
      default:
        throw new Error(`Unknown BHIV operation: ${operation}`);
    }
    
    const response = {
      success: true,
      data: result.response,
      sources: options.includeSources ? result.sources : undefined,
      endpoint: (result as any).endpoint || operation,
      query_id: result.query_id,
      timestamp: result.timestamp
    };
    
    apiLogger.info('BHIV operation completed successfully', { operation, query_id: result.query_id });
    return response;
    
  } catch (error) {
    apiLogger.error('BHIV operation failed', { operation, data, error });
    
    if (options.fallback) {
      // Return a fallback response
      const fallbackResponses = {
        vedas: "The ancient Vedic texts teach us to seek truth through self-reflection and righteous action. Practice mindfulness and seek wisdom within.",
        edumentor: "This is an important topic to understand. Let me break it down with practical examples to help you learn effectively.",
        wellness: "Taking care of your wellbeing is important. Consider practices like meditation, exercise, and maintaining healthy relationships.",
        kb_query: "Based on available knowledge, here's what I can tell you about this topic."
      };
      
      return {
        success: true,
        data: fallbackResponses[operation] || "I'm here to help with your question.",
        sources: [],
        endpoint: operation,
        error: `Fallback response due to: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Export the axios instance for custom requests
export { api, taggingApi, insightsApi };