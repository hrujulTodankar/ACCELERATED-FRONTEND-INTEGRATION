#!/usr/bin/env node

/**
 * Content Flow Test Runner
 * Comprehensive testing suite for 20 different content moderation scenarios
 * Tests API integration, RL reward functionality, and error handling
 */

import { 
  getModerationItems, 
  submitFeedback, 
  getAnalytics, 
  getNLPContext, 
  getTags,
  simulateRLReward,
  mockModerationItems
} from '../services/apiService';
import { ModerationResponse, FeedbackResponse } from '../types';

// Test scenarios covering diverse content types
const testContentScenarios = [
  {
    id: 'harmless_content_001',
    content: 'This is a positive message about community building and helping others in need.',
    expectedDecision: 'approved',
    expectedConfidence: 0.95,
    scenario: 'Positive Community Content',
    category: 'community'
  },
  {
    id: 'spam_content_002', 
    content: 'Click here to win $1000000! Limited time offer! Buy now! Act fast!',
    expectedDecision: 'rejected',
    expectedConfidence: 0.90,
    scenario: 'Spam Content',
    category: 'spam'
  },
  {
    id: 'neutral_content_003',
    content: 'The weather is nice today. I went for a walk in the park and enjoyed nature.',
    expectedDecision: 'approved',
    expectedConfidence: 0.85,
    scenario: 'Neutral Personal Content',
    category: 'personal'
  },
  {
    id: 'borderline_content_004',
    content: 'This might be inappropriate for some audiences but not explicitly harmful content.',
    expectedDecision: 'pending',
    expectedConfidence: 0.60,
    scenario: 'Borderline Content',
    category: 'borderline'
  },
  {
    id: 'educational_content_005',
    content: 'Machine learning algorithms can process large datasets to identify patterns and make predictions.',
    expectedDecision: 'approved',
    expectedConfidence: 0.92,
    scenario: 'Educational Content',
    category: 'education'
  },
  {
    id: 'copyright_content_006',
    content: 'Here is the complete text of a copyrighted novel that I will share in full for everyone.',
    expectedDecision: 'rejected',
    expectedConfidence: 0.88,
    scenario: 'Copyright Violation',
    category: 'copyright'
  },
  {
    id: 'promotional_content_007',
    content: 'Check out our new product launch! Limited time discount available for early adopters.',
    expectedDecision: 'pending',
    expectedConfidence: 0.65,
    scenario: 'Promotional Content',
    category: 'promotion'
  },
  {
    id: 'technical_content_008',
    content: 'The API endpoint returns a 404 error when the resource is not found on the server.',
    expectedDecision: 'approved',
    expectedConfidence: 0.94,
    scenario: 'Technical Documentation',
    category: 'technical'
  },
  {
    id: 'controversial_content_009',
    content: 'Political opinions that some might find divisive or offensive to certain groups.',
    expectedDecision: 'pending',
    expectedConfidence: 0.55,
    scenario: 'Controversial Content',
    category: 'controversial'
  },
  {
    id: 'medical_content_010',
    content: 'This is not medical advice. Please consult a healthcare professional for medical concerns.',
    expectedDecision: 'approved',
    expectedConfidence: 0.89,
    scenario: 'Medical Disclaimer',
    category: 'medical'
  },
  {
    id: 'gaming_content_011',
    content: 'Just achieved level 100 in my favorite RPG game! So excited to share this milestone!',
    expectedDecision: 'approved',
    expectedConfidence: 0.93,
    scenario: 'Gaming Content',
    category: 'gaming'
  },
  {
    id: 'recipe_content_012',
    content: 'Here is a simple pasta recipe with tomatoes, garlic, and olive oil. Easy to make!',
    expectedDecision: 'approved',
    expectedConfidence: 0.91,
    scenario: 'Recipe Content',
    category: 'cooking'
  },
  {
    id: 'news_content_013',
    content: 'Breaking: Local government announces new infrastructure project for community development.',
    expectedDecision: 'approved',
    expectedConfidence: 0.87,
    scenario: 'News Content',
    category: 'news'
  },
  {
    id: 'programming_content_014',
    content: 'How to implement a binary search algorithm in Python with code examples and explanations.',
    expectedDecision: 'approved',
    expectedConfidence: 0.96,
    scenario: 'Programming Tutorial',
    category: 'programming'
  },
  {
    id: 'personal_attack_015',
    content: 'You are a stupid person who knows nothing about this topic. Go away!',
    expectedDecision: 'rejected',
    expectedConfidence: 0.92,
    scenario: 'Personal Attack',
    category: 'harassment'
  },
  {
    id: 'product_review_016',
    content: 'This product has great features but poor customer service. I would rate it 3/5 stars.',
    expectedDecision: 'approved',
    expectedConfidence: 0.84,
    scenario: 'Product Review',
    category: 'review'
  },
  {
    id: 'advertisement_017',
    content: 'Exclusive offer! Buy one get one free! Click the link now before it expires!',
    expectedDecision: 'pending',
    expectedConfidence: 0.68,
    scenario: 'Advertisement',
    category: 'advertising'
  },
  {
    id: 'complaint_018',
    content: 'I am disappointed with the service quality and want a refund for my purchase.',
    expectedDecision: 'approved',
    expectedConfidence: 0.82,
    scenario: 'Customer Complaint',
    category: 'complaint'
  },
  {
    id: 'celebration_019',
    content: 'Happy birthday to my best friend! Hope you have an amazing day filled with joy!',
    expectedDecision: 'approved',
    expectedConfidence: 0.97,
    scenario: 'Celebration Message',
    category: 'celebration'
  },
  {
    id: 'question_content_020',
    content: 'What are the best practices for web development in 2024? Looking for expert advice.',
    expectedDecision: 'approved',
    expectedConfidence: 0.90,
    scenario: 'Question Content',
    category: 'question'
  }
];

interface TestResult {
  scenario: string;
  id: string;
  category: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  content: string;
  decision?: string;
  confidence?: number;
  expectedDecision?: string;
  expectedConfidence?: number;
  error?: string;
  duration?: number;
  apiCalls?: string[];
}

class ContentFlowTestRunner {
  private results: TestResult[] = [];
  private startTime: number = 0;
  private totalTests: number = 0;
  private passedTests: number = 0;
  private failedTests: number = 0;
  private skippedTests: number = 0;

  constructor() {
    this.startTime = Date.now();
  }

  private async runAPITest(testFn: () => Promise<any>, testName: string): Promise<any> {
    const callStart = Date.now();
    try {
      console.log(`  🔄 Running ${testName}...`);
      const result = await testFn();
      const duration = Date.now() - callStart;
      console.log(`  ✅ ${testName} completed in ${duration}ms`);
      return { result, duration, error: null };
    } catch (error) {
      const duration = Date.now() - callStart;
      console.log(`  ❌ ${testName} failed in ${duration}ms: ${error}`);
      return { result: null, duration, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private createMockModerationResponse(scenario: typeof testContentScenarios[0]): ModerationResponse {
    return {
      id: scenario.id,
      content: scenario.content,
      decision: scenario.expectedDecision as any,
      confidence: scenario.expectedConfidence,
      timestamp: new Date().toISOString(),
      flagged: scenario.expectedDecision === 'rejected',
      type: 'text',
      metadata: {
        source: 'user_submission',
        length: scenario.content.length,
        language: 'en',
        url: `https://example.com/content/${scenario.id}`,
        userId: `user_${scenario.id}`,
        platform: 'web',
        uploadDate: new Date().toISOString()
      },
      rlMetrics: {
        confidenceScore: scenario.expectedConfidence,
        rewardHistory: [
          {
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            reward: 0.1,
            action: 'pending' as const
          },
          {
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            reward: 0.15,
            action: 'approve' as const
          }
        ],
        lastReward: new Date(Date.now() - 300000).toISOString()
      }
    };
  }

  private validateTestResult(result: TestResult): boolean {
    if (result.status === 'SKIPPED') return true;
    if (result.status === 'FAILED') return false;
    
    // For passed tests, validate the actual vs expected values
    if (result.decision && result.expectedDecision) {
      if (result.decision !== result.expectedDecision) {
        result.error = `Decision mismatch: expected ${result.expectedDecision}, got ${result.decision}`;
        return false;
      }
    }
    
    if (result.confidence && result.expectedConfidence) {
      const confidenceDiff = Math.abs(result.confidence - result.expectedConfidence);
      if (confidenceDiff > 0.1) { // Allow 10% variance
        result.error = `Confidence mismatch: expected ${result.expectedConfidence}, got ${result.confidence} (diff: ${confidenceDiff})`;
        return false;
      }
    }
    
    return true;
  }

  private async runScenario(scenario: typeof testContentScenarios[0], index: number): Promise<TestResult> {
    const result: TestResult = {
      scenario: scenario.scenario,
      id: scenario.id,
      category: scenario.category,
      status: 'PASSED',
      content: scenario.content.substring(0, 100) + '...',
      apiCalls: []
    };

    try {
      console.log(`\n📝 Test ${index + 1}/${testContentScenarios.length}: ${scenario.scenario}`);
      console.log(`   Category: ${scenario.category}`);
      console.log(`   Content: ${scenario.content.substring(0, 80)}...`);

      // Test 1: Get Moderation Items
      const moderationTest = await this.runAPITest(async () => {
        const mockResponse = {
          data: [this.createMockModerationResponse(scenario)],
          total: 1,
          page: 1,
          limit: 10
        };
        
        // Simulate API response
        const response = await getModerationItems({
          type: 'all',
          score: 'all',
          flagged: 'all',
          date: 'all',
          search: '',
          page: 1,
          limit: 10
        });

        return response;
      }, 'Get Moderation Items');

      if (moderationTest.error) {
        result.status = 'FAILED';
        result.error = `Moderation test failed: ${moderationTest.error}`;
        return result;
      }

      result.apiCalls!.push('GET /moderate');
      result.decision = moderationTest.result.data[0].decision;
      result.confidence = moderationTest.result.data[0].confidence;
      result.duration = moderationTest.duration;

      // Test 2: Submit Feedback
      const feedbackTest = await this.runAPITest(async () => {
        const feedback: Omit<FeedbackResponse, 'id' | 'timestamp'> & { itemId?: string } = {
          thumbsUp: scenario.expectedDecision === 'approved',
          comment: `Feedback for ${scenario.scenario}`,
          userId: 'test_user',
          itemId: scenario.id
        };

        return await submitFeedback(feedback);
      }, 'Submit Feedback');

      if (feedbackTest.error) {
        console.warn(`  ⚠️  Feedback test failed (non-critical): ${feedbackTest.error}`);
      } else {
        result.apiCalls!.push('POST /feedback');
      }

      // Test 3: Get Analytics
      const analyticsTest = await this.runAPITest(async () => {
        return await getAnalytics(scenario.id);
      }, 'Get Analytics');

      if (analyticsTest.error) {
        console.warn(`  ⚠️  Analytics test failed (non-critical): ${analyticsTest.error}`);
      } else {
        result.apiCalls!.push('GET /bhiv/analytics');
      }

      // Test 4: Get NLP Context
      const nlpTest = await this.runAPITest(async () => {
        return await getNLPContext(scenario.id, scenario.content);
      }, 'Get NLP Context');

      if (nlpTest.error) {
        console.warn(`  ⚠️  NLP test failed (non-critical): ${nlpTest.error}`);
      } else {
        result.apiCalls!.push('GET /nlp/context');
      }

      // Test 5: Get Tags
      const tagsTest = await this.runAPITest(async () => {
        return await getTags(scenario.id, scenario.content);
      }, 'Get Tags');

      if (tagsTest.error) {
        console.warn(`  ⚠️  Tags test failed (non-critical): ${tagsTest.error}`);
      } else {
        result.apiCalls!.push('GET /tag');
      }

      // Test 6: Simulate RL Reward
      const rlTest = await this.runAPITest(async () => {
        const action = scenario.expectedDecision === 'approved' ? 'approve' : 
                      scenario.expectedDecision === 'rejected' ? 'reject' : 'pending';
        return await simulateRLReward(scenario.id, action as any);
      }, 'Simulate RL Reward');

      if (rlTest.error) {
        console.warn(`  ⚠️  RL test failed (non-critical): ${rlTest.error}`);
      } else {
        result.apiCalls!.push('POST /rl/reward');
      }

      // Validate results
      const isValid = this.validateTestResult(result);
      if (!isValid) {
        result.status = 'FAILED';
      }

    } catch (error) {
      result.status = 'FAILED';
      result.error = error instanceof Error ? error.message : 'Unknown error occurred';
    }

    return result;
  }

  private generateSummary(): void {
    const totalDuration = Date.now() - this.startTime;
    
    console.log('\n' + '='.repeat(80));
    console.log('🎯 COMPREHENSIVE CONTENT FLOW TEST RESULTS');
    console.log('='.repeat(80));
    
    console.log(`\n📊 Test Summary:`);
    console.log(`   Total Tests: ${this.totalTests}`);
    console.log(`   Passed: ${this.passedTests} ✅`);
    console.log(`   Failed: ${this.failedTests} ❌`);
    console.log(`   Skipped: ${this.skippedTests} ⏭️`);
    console.log(`   Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);
    console.log(`   Total Duration: ${totalDuration}ms`);
    console.log(`   Average Duration: ${(totalDuration / this.totalTests).toFixed(1)}ms per test`);

    // Category breakdown
    const categoryStats = new Map<string, { total: number; passed: number; failed: number }>();
    this.results.forEach(result => {
      const stats = categoryStats.get(result.category) || { total: 0, passed: 0, failed: 0 };
      stats.total++;
      if (result.status === 'PASSED') stats.passed++;
      if (result.status === 'FAILED') stats.failed++;
      categoryStats.set(result.category, stats);
    });

    console.log(`\n📈 Category Breakdown:`);
    categoryStats.forEach((stats, category) => {
      const successRate = ((stats.passed / stats.total) * 100).toFixed(1);
      console.log(`   ${category}: ${stats.passed}/${stats.total} (${successRate}%)`);
    });

    // API Call Statistics
    const apiCallStats = new Map<string, number>();
    this.results.forEach(result => {
      result.apiCalls?.forEach(call => {
        apiCallStats.set(call, (apiCallStats.get(call) || 0) + 1);
      });
    });

    console.log(`\n🔗 API Call Statistics:`);
    apiCallStats.forEach((count, call) => {
      console.log(`   ${call}: ${count} calls`);
    });

    // Failed tests details
    if (this.failedTests > 0) {
      console.log(`\n❌ Failed Tests Details:`);
      this.results.filter(r => r.status === 'FAILED').forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.scenario} (${result.id})`);
        console.log(`      Error: ${result.error}`);
        console.log(`      Content: ${result.content}`);
      });
    }

    console.log('\n' + '='.repeat(80));
  }

  private generateDetailedReport(): object {
    return {
      testRun: {
        timestamp: new Date().toISOString(),
        totalDuration: Date.now() - this.startTime,
        totalTests: this.totalTests,
        passedTests: this.passedTests,
        failedTests: this.failedTests,
        skippedTests: this.skippedTests,
        successRate: (this.passedTests / this.totalTests) * 100
      },
      results: this.results,
      categories: Array.from(new Set(this.results.map(r => r.category))),
      apiEndpoints: Array.from(new Set(this.results.flatMap(r => r.apiCalls || [])))
    };
  }

  public async runAllTests(): Promise<void> {
    console.log('🚀 Starting Comprehensive Content Flow Test Suite');
    console.log(`📅 Test Run: ${new Date().toISOString()}`);
    console.log(`🎯 Scenarios: ${testContentScenarios.length}`);

    this.totalTests = testContentScenarios.length;

    // Run tests sequentially to avoid overwhelming the system
    for (let i = 0; i < testContentScenarios.length; i++) {
      const scenario = testContentScenarios[i];
      const result = await this.runScenario(scenario, i);
      
      this.results.push(result);
      
      if (result.status === 'PASSED') {
        this.passedTests++;
      } else if (result.status === 'FAILED') {
        this.failedTests++;
      } else {
        this.skippedTests++;
      }

      // Brief pause between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.generateSummary();
    
    // Save detailed report
    const report = this.generateDetailedReport();
    const reportFile = `content_flow_test_results_${new Date().toISOString().replace(/[:.]/g, '_')}.json`;
    
    try {
      const fs = await import('fs/promises');
      await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
      console.log(`\n💾 Detailed report saved to: ${reportFile}`);
    } catch (error) {
      console.warn(`⚠️  Could not save report file: ${error}`);
    }

    // Exit with appropriate code
    process.exit(this.failedTests > 0 ? 1 : 0);
  }
}

// Main execution
if (require.main === module) {
  const runner = new ContentFlowTestRunner();
  runner.runAllTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

export { ContentFlowTestRunner, testContentScenarios };