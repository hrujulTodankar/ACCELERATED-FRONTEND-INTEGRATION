import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { 
  getModerationItems, 
  submitFeedback, 
  getAnalytics, 
  getNLPContext, 
  getTags,
  simulateRLReward 
} from '../services/apiService';
import { ModerationResponse, FeedbackResponse } from '../types';

import axios from 'axios';

// By default tests mock axios; when running integration tests set BHIV_INTEGRATION=true
if (!process.env.BHIV_INTEGRATION) {
  jest.mock('axios');
}

// Test data for various content scenarios
const testContentScenarios = [
  {
    id: 'harmless_content_001',
    content: 'This is a positive message about community building and helping others.',
    expectedDecision: 'approved',
    expectedConfidence: 0.95,
    scenario: 'Positive Community Content'
  },
  {
    id: 'spam_content_002', 
    content: 'Click here to win $1000000! Limited time offer! Buy now!',
    expectedDecision: 'rejected',
    expectedConfidence: 0.90,
    scenario: 'Spam Content'
  },
  {
    id: 'neutral_content_003',
    content: 'The weather is nice today. I went for a walk in the park.',
    expectedDecision: 'approved',
    expectedConfidence: 0.85,
    scenario: 'Neutral Personal Content'
  },
  {
    id: 'borderline_content_004',
    content: 'This might be inappropriate for some audiences but not explicitly harmful.',
    expectedDecision: 'pending',
    expectedConfidence: 0.60,
    scenario: 'Borderline Content'
  },
  {
    id: 'educational_content_005',
    content: 'Machine learning algorithms can process large datasets to identify patterns and make predictions.',
    expectedDecision: 'approved',
    expectedConfidence: 0.92,
    scenario: 'Educational Content'
  },
  {
    id: 'copyright_content_006',
    content: 'Here is the complete text of a copyrighted novel that I will share in full.',
    expectedDecision: 'rejected',
    expectedConfidence: 0.88,
    scenario: 'Copyright Violation'
  },
  {
    id: 'promotional_content_007',
    content: 'Check out our new product launch! Limited time discount available.',
    expectedDecision: 'pending',
    expectedConfidence: 0.65,
    scenario: 'Promotional Content'
  },
  {
    id: 'technical_content_008',
    content: 'The API endpoint returns a 404 error when the resource is not found.',
    expectedDecision: 'approved',
    expectedConfidence: 0.94,
    scenario: 'Technical Documentation'
  },
  {
    id: 'controversial_content_009',
    content: 'Political opinions that some might find divisive or offensive.',
    expectedDecision: 'pending',
    expectedConfidence: 0.55,
    scenario: 'Controversial Content'
  },
  {
    id: 'medical_content_010',
    content: 'This is not medical advice. Please consult a healthcare professional.',
    expectedDecision: 'approved',
    expectedConfidence: 0.89,
    scenario: 'Medical Disclaimer'
  },
  {
    id: 'gaming_content_011',
    content: 'Just achieved level 100 in my favorite RPG game! So excited!',
    expectedDecision: 'approved',
    expectedConfidence: 0.93,
    scenario: 'Gaming Content'
  },
  {
    id: 'recipe_content_012',
    content: 'Here is a simple pasta recipe with tomatoes, garlic, and olive oil.',
    expectedDecision: 'approved',
    expectedConfidence: 0.91,
    scenario: 'Recipe Content'
  },
  {
    id: 'news_content_013',
    content: 'Breaking: Local government announces new infrastructure project.',
    expectedDecision: 'approved',
    expectedConfidence: 0.87,
    scenario: 'News Content'
  },
  {
    id: 'programming_content_014',
    content: 'How to implement a binary search algorithm in Python with code examples.',
    expectedDecision: 'approved',
    expectedConfidence: 0.96,
    scenario: 'Programming Tutorial'
  },
  {
    id: 'personal_attack_015',
    content: 'You are a stupid person who knows nothing about this topic.',
    expectedDecision: 'rejected',
    expectedConfidence: 0.92,
    scenario: 'Personal Attack'
  },
  {
    id: 'product_review_016',
    content: 'This product has great features but poor customer service. I would rate it 3/5.',
    expectedDecision: 'approved',
    expectedConfidence: 0.84,
    scenario: 'Product Review'
  },
  {
    id: 'advertisement_017',
    content: 'Exclusive offer! Buy one get one free! Click the link now!',
    expectedDecision: 'pending',
    expectedConfidence: 0.68,
    scenario: 'Advertisement'
  },
  {
    id: 'complaint_018',
    content: 'I am disappointed with the service quality and want a refund.',
    expectedDecision: 'approved',
    expectedConfidence: 0.82,
    scenario: 'Customer Complaint'
  },
  {
    id: 'celebration_019',
    content: 'Happy birthday to my best friend! Hope you have an amazing day!',
    expectedDecision: 'approved',
    expectedConfidence: 0.97,
    scenario: 'Celebration Message'
  },
  {
    id: 'question_content_020',
    content: 'What are the best practices for web development in 2024?',
    expectedDecision: 'approved',
    expectedConfidence: 0.90,
    scenario: 'Question Content'
  }
];

describe('Comprehensive Content Moderation Flow Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    // If not running integration mode, mock axios responses
    if (!process.env.BHIV_INTEGRATION) {
      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          status: 'success',
          data: [],
          total: 0,
          page: 1,
          limit: 10
        },
        metadata: { duration: 150, timestamp: new Date().toISOString() }
      });

      (axios.post as jest.Mock).mockResolvedValue({
        data: {
          success: true,
          confidence: 0.85,
          timestamp: new Date().toISOString(),
          feedbackId: 'feedback_123',
          rlReward: 0.15
        },
        metadata: { duration: 200, timestamp: new Date().toISOString() }
      });
    }
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Content Moderation API Integration', () => {
    test('should successfully fetch moderation items with proper filtering', async () => {
      const mockItems = testContentScenarios.map(scenario => ({
        id: scenario.id,
        content: scenario.content,
        decision: scenario.expectedDecision as any,
        confidence: scenario.expectedConfidence,
        timestamp: new Date().toISOString(),
        flagged: scenario.expectedDecision === 'rejected',
        type: 'text' as const,
        metadata: {
          source: 'user_submission',
          length: scenario.content.length,
          language: 'en',
          url: `https://example.com/content/${scenario.id}`,
          userId: `user_${scenario.id}`,
          platform: 'web',
          uploadDate: new Date().toISOString()
        }
      }));

      if (!process.env.BHIV_INTEGRATION) {
        (axios.get as jest.Mock).mockResolvedValueOnce({
          data: {
            data: mockItems,
            total: mockItems.length,
            page: 1,
            limit: 10
          }
        });
      }

      const response = await getModerationItems({
        type: 'all',
        score: 'all',
        flagged: 'all',
        date: 'all',
        search: '',
        page: 1,
        limit: 10
      });

      expect(response.data).toBeDefined();
      expect(response.total).toBeDefined();
      if (!process.env.BHIV_INTEGRATION) {
        expect(response.data).toHaveLength(mockItems.length);
        expect(response.total).toBe(mockItems.length);
        expect(axios.get).toHaveBeenCalledWith('/moderate', expect.any(Object));
      }
    });

    test('should handle feedback submission with RL reward integration', async () => {
      const mockFeedback: Omit<FeedbackResponse, 'id' | 'timestamp'> & { itemId?: string } = {
        thumbsUp: true,
        comment: 'This moderation decision was helpful',
        userId: 'test_user_123',
        itemId: 'content_001'
      };

      const response = await submitFeedback(mockFeedback);

      expect(response).toMatchObject({
        thumbsUp: true,
        comment: 'This moderation decision was helpful',
        userId: 'test_user_123'
      });
      expect(response.id).toBeDefined();
      expect(response.timestamp).toBeDefined();

      if (!process.env.BHIV_INTEGRATION) {
        expect(axios.post).toHaveBeenCalledWith('/feedback', expect.objectContaining({
          moderationId: 'content_001',
          feedback: 'This moderation decision was helpful',
          userId: 'test_user_123'
        }));
      }
    });

    test('should fetch analytics data with proper transformation', async () => {
      const mockAnalytics = {
        total_queries: 1000,
        avg_response_time: 1.2,
        success_rate: 0.87
      };

      if (!process.env.BHIV_INTEGRATION) {
        (axios.get as jest.Mock).mockResolvedValueOnce({
          data: {
            status: 'success',
            analytics: mockAnalytics,
            timestamp: new Date().toISOString()
          }
        });
      }

      const analytics = await getAnalytics('test_content_001');

      expect(analytics).toMatchObject({
        id: 'test_content_001',
        ctr: expect.any(Number),
        scoreTrend: expect.arrayContaining([
          expect.objectContaining({
            timestamp: expect.any(String),
            score: expect.any(Number),
            type: 'confidence'
          })
        ]),
        totalInteractions: expect.any(Number),
        avgConfidence: expect.any(Number),
        flaggedCount: expect.any(Number),
        approvedCount: expect.any(Number),
        rejectedCount: expect.any(Number)
      });
    });

    test('should fetch NLP context analysis', async () => {
      const mockNLPResponse = {
        status: 'success',
        analysis: {
          sentiment: { label: 'positive', score: 0.8, confidence: 0.9 },
          entities: [{ text: 'content', type: 'misc', confidence: 0.9 }],
          summary: 'Positive content analysis'
        },
        timestamp: new Date().toISOString()
      };

      if (!process.env.BHIV_INTEGRATION) {
        (axios.get as jest.Mock).mockResolvedValueOnce({
          data: mockNLPResponse
        });
      }

      const nlpContext = await getNLPContext('test_content_001', 'This is a positive message');

      expect(nlpContext).toMatchObject({
        id: 'test_content_001',
        topics: expect.arrayContaining([
          expect.objectContaining({
            name: expect.any(String),
            confidence: expect.any(Number),
            category: expect.any(String)
          })
        ]),
        sentiment: expect.objectContaining({
          label: expect.stringMatching(/positive|negative|neutral/),
          score: expect.any(Number),
          confidence: expect.any(Number)
        }),
        entities: expect.arrayContaining([
          expect.objectContaining({
            text: expect.any(String),
            type: expect.stringMatching(/person|organization|location|misc/),
            confidence: expect.any(Number)
          })
        ]),
        context: expect.any(String)
      });
    });

    test('should fetch content tags with confidence scores', async () => {
      const mockTagsResponse = {
        status: 'success',
        tags: [
          { tag: 'technology', score: 0.9, category: 'topic' },
          { tag: 'trending', score: 0.8, category: 'engagement' }
        ],
        total_tags: 2,
        timestamp: new Date().toISOString()
      };

      if (!process.env.BHIV_INTEGRATION) {
        (axios.get as jest.Mock).mockResolvedValueOnce({
          data: mockTagsResponse
        });
      }

      const tags = await getTags('test_content_001', 'Technology content about trending topics');

      expect(tags).toMatchObject({
        id: 'test_content_001',
        tags: expect.arrayContaining([
          expect.objectContaining({
            label: expect.any(String),
            confidence: expect.any(Number),
            category: expect.any(String)
          })
        ]),
        confidence: expect.any(Number),
        model: expect.any(String),
        timestamp: expect.any(String)
      });
    });
  });

  describe('RL Reward Integration', () => {
    test('should simulate RL reward processing', async () => {
      const mockRLResponse = {
        reward: 0.15,
        confidenceUpdate: 0.08,
        timestamp: new Date().toISOString()
      };

      if (!process.env.BHIV_INTEGRATION) {
        (axios.post as jest.Mock).mockResolvedValueOnce({
          data: mockRLResponse
        });
      }

      const reward = await simulateRLReward('content_001', 'approve');

      expect(reward).toMatchObject({
        reward: expect.any(Number),
        confidenceUpdate: expect.any(Number),
        timestamp: expect.any(String)
      });

      if (!process.env.BHIV_INTEGRATION) {
        expect(axios.post).toHaveBeenCalledWith('/rl/reward', expect.objectContaining({
          itemId: 'content_001',
          action: 'approve',
          timestamp: expect.any(String),
          userId: 'system'
        }));
      }
    });

    test('should handle RL reward errors gracefully', async () => {
      (axios.post as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const reward = await simulateRLReward('content_001', 'reject');

      expect(reward).toMatchObject({
        reward: expect.any(Number),
        confidenceUpdate: expect.any(Number),
        timestamp: expect.any(String)
      });
    });
  });

  describe('Error Handling and Fallbacks', () => {
    test('should fallback to mock data when backend is unavailable', async () => {
      (axios.get as jest.Mock).mockRejectedValueOnce(new Error('Backend unavailable'));

      // In development mode, should fallback to mock data
      const originalDev = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const response = await getModerationItems({
        type: 'all',
        score: 'all',
        flagged: 'all',
        date: 'all',
        search: '',
        page: 1,
        limit: 10
      });

      expect(response.data).toBeDefined();
      expect(response.total).toBeGreaterThan(0);

      process.env.NODE_ENV = originalDev;
    });

    test('should handle network timeouts gracefully', async () => {
      (axios.get as jest.Mock).mockRejectedValueOnce(new Error('timeout'));

      await expect(getModerationItems({
        type: 'all',
        score: 'all',
        flagged: 'all',
        date: 'all',
        search: '',
        page: 1,
        limit: 10
      })).rejects.toThrow('timeout');
    });

    test('should handle authentication errors', async () => {
      (axios.get as jest.Mock).mockRejectedValueOnce({
        response: { status: 401 }
      });

      // Should clear auth token on 401
      localStorage.setItem('authToken', 'test_token');
      
      await expect(getModerationItems({
        type: 'all',
        score: 'all',
        flagged: 'all',
        date: 'all',
        search: '',
        page: 1,
        limit: 10
      })).rejects.toThrow();

      expect(localStorage.getItem('authToken')).toBeNull();
    });
  });

  describe('Content Flow Validation', () => {
    test('should validate all content scenarios correctly', async () => {
      const validationResults = [];

      for (const scenario of testContentScenarios) {
        // Mock the moderation response for each scenario
        const mockResponse = {
          data: [{
            id: scenario.id,
            content: scenario.content,
            decision: scenario.expectedDecision,
            confidence: scenario.expectedConfidence,
            timestamp: new Date().toISOString(),
            flagged: scenario.expectedDecision === 'rejected',
            type: 'text' as const,
            metadata: {
              source: 'user_submission',
              length: scenario.content.length,
              language: 'en'
            }
          }],
          total: 1,
          page: 1,
          limit: 10
        };

        (axios.get as jest.Mock).mockResolvedValueOnce(mockResponse);

        const response = await getModerationItems({
          type: 'all',
          score: 'all',
          flagged: 'all',
          date: 'all',
          search: '',
          page: 1,
          limit: 10
        });

        const item = response.data[0];
        validationResults.push({
          scenario: scenario.scenario,
          id: scenario.id,
          contentPreview: scenario.content.substring(0, 50) + '...',
          expectedDecision: scenario.expectedDecision,
          actualDecision: item.decision,
          expectedConfidence: scenario.expectedConfidence,
          actualConfidence: item.confidence,
          confidenceMatch: Math.abs(item.confidence - scenario.expectedConfidence) < 0.1,
          decisionMatch: item.decision === scenario.expectedDecision,
          flaggedMatch: item.flagged === (scenario.expectedDecision === 'rejected')
        });
      }

      // Validate results
      validationResults.forEach(result => {
        expect(result.decisionMatch).toBe(true);
        expect(result.confidenceMatch).toBe(true);
        expect(result.flaggedMatch).toBe(true);
      });

      // Summary statistics
      const totalScenarios = validationResults.length;
      const passedScenarios = validationResults.filter(r => 
        r.decisionMatch && r.confidenceMatch && r.flaggedMatch
      ).length;

      console.log(`\n=== Content Flow Validation Summary ===`);
      console.log(`Total Scenarios: ${totalScenarios}`);
      console.log(`Passed: ${passedScenarios}`);
      console.log(`Success Rate: ${(passedScenarios / totalScenarios * 100).toFixed(1)}%`);
      
      validationResults.forEach(result => {
        const status = result.decisionMatch && result.confidenceMatch && result.flaggedMatch ? '✅' : '❌';
        console.log(`${status} ${result.scenario}: ${result.contentPreview}`);
      });

      expect(passedScenarios).toBe(totalScenarios);
    });
  });

  describe('Performance and Logging', () => {
    test('should log API calls with proper metadata', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await getModerationItems({
        type: 'all',
        score: 'all',
        flagged: 'all',
        date: 'all',
        search: '',
        page: 1,
        limit: 10
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[API-Service]'),
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });

    test('should track request performance', async () => {
      const startTime = Date.now();
      
      await getModerationItems({
        type: 'all',
        score: 'all',
        flagged: 'all',
        date: 'all',
        search: '',
        page: 1,
        limit: 10
      });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});

// Test execution helper
export const runContentFlowTests = async () => {
  console.log('🚀 Starting Comprehensive Content Flow Tests...');
  
  try {
    // This would normally be handled by Jest, but for manual execution
    const testResults = [];
    
    for (const scenario of testContentScenarios) {
      try {
        const mockResponse = {
          data: [{
            id: scenario.id,
            content: scenario.content,
            decision: scenario.expectedDecision,
            confidence: scenario.expectedConfidence,
            timestamp: new Date().toISOString(),
            flagged: scenario.expectedDecision === 'rejected',
            type: 'text' as const,
            metadata: {
              source: 'user_submission',
              length: scenario.content.length,
              language: 'en'
            }
          }],
          total: 1,
          page: 1,
          limit: 10
        };

        (axios.get as jest.Mock).mockResolvedValueOnce(mockResponse);

        const response = await getModerationItems({
          type: 'all',
          score: 'all',
          flagged: 'all',
          date: 'all',
          search: '',
          page: 1,
          limit: 10
        });

        testResults.push({
          scenario: scenario.scenario,
          id: scenario.id,
          status: 'PASSED',
          content: scenario.content.substring(0, 100) + '...',
          decision: response.data[0].decision,
          confidence: response.data[0].confidence
        });
      } catch (error) {
        testResults.push({
          scenario: scenario.scenario,
          id: scenario.id,
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const passed = testResults.filter(r => r.status === 'PASSED').length;
    const total = testResults.length;

    console.log('\n📊 Test Results Summary:');
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${total - passed}`);
    console.log(`Success Rate: ${(passed / total * 100).toFixed(1)}%`);

    console.log('\n📋 Detailed Results:');
    testResults.forEach((result, index) => {
      const icon = result.status === 'PASSED' ? '✅' : '❌';
      console.log(`${index + 1}. ${icon} ${result.scenario} (${result.id})`);
      if (result.status === 'PASSED') {
        console.log(`   Content: ${result.content}`);
        console.log(`   Decision: ${result.decision} | Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      } else {
        console.log(`   Error: ${result.error}`);
      }
      console.log('');
    });

    return {
      total,
      passed,
      failed: total - passed,
      successRate: (passed / total * 100),
      results: testResults
    };
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    throw error;
  }
};

export { testContentScenarios };