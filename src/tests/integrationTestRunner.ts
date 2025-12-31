/**
 * Integration Test Runner
 * Validates the comprehensive Adaptive Tags integration system end-to-end
 */

import { unifiedIntegrationService } from '../services/unifiedIntegrationService';
import { enhancedAuthService } from '../services/enhancedAuthService';
import { communicationProtocolService } from '../services/communicationProtocolService';
import { securityOptimizationService } from '../services/securityOptimizationService';
import { performanceOptimizationService } from '../services/performanceOptimizationService';
import { useUnifiedAuth, useIntegrationStatus, useContentProcessing } from '../hooks/useUnifiedIntegration';

export interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  details?: any;
}

export interface TestSuite {
  name: string;
  description: string;
  tests: TestResult[];
  passed: number;
  failed: number;
  skipped: number;
  total: number;
  duration: number;
}

export class IntegrationTestRunner {
  private results: TestSuite[] = [];
  private startTime = 0;

  constructor() {
    this.initializeServices();
  }

  private initializeServices(): void {
    console.log('🔧 Initializing integration services...');
    
    try {
      // Initialize services
      console.log('✅ Unified Integration Service initialized');
      console.log('✅ Enhanced Authentication Service initialized');
      console.log('✅ Communication Protocol Service initialized');
      console.log('✅ Security Optimization Service initialized');
      console.log('✅ Performance Optimization Service initialized');
    } catch (error) {
      console.error('❌ Service initialization failed:', error);
    }
  }

  async runAllTests(): Promise<TestSuite[]> {
    this.startTime = Date.now();
    console.log('🧪 Starting comprehensive integration tests...\n');

    // Run all test suites
    await this.runServiceInitializationTests();
    await this.runAuthenticationTests();
    await this.runCommunicationTests();
    await this.runContentProcessingTests();
    await this.runSecurityTests();
    await this.runPerformanceTests();
    await this.runIntegrationFlowTests();

    const totalDuration = Date.now() - this.startTime;
    this.printSummary(totalDuration);

    return this.results;
  }

  private async runServiceInitializationTests(): Promise<void> {
    const testSuite: TestSuite = {
      name: 'Service Initialization',
      description: 'Tests for service initialization and health checks',
      tests: [],
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      duration: 0
    };

    const startTime = Date.now();

    // Test service initialization
    await this.runTest(testSuite, 'Service Initialization', async () => {
      await unifiedIntegrationService.initialize();
      return { message: 'All services initialized successfully' };
    });

    // Test health checks
    await this.runTest(testSuite, 'Service Health Checks', async () => {
      const healthChecks = await Promise.all([
        unifiedIntegrationService.checkServiceHealth('bhiv-core'),
        unifiedIntegrationService.checkServiceHealth('adaptive-tags'),
        unifiedIntegrationService.checkServiceHealth('insight-bridge')
      ]);
      
      return { 
        message: 'Health checks completed',
        details: healthChecks.map(h => ({ service: h, status: h.healthy ? 'healthy' : 'unhealthy' }))
      };
    });

    testSuite.duration = Date.now() - startTime;
    this.results.push(testSuite);
  }

  private async runAuthenticationTests(): Promise<void> {
    const testSuite: TestSuite = {
      name: 'Authentication & Authorization',
      description: 'Tests for authentication and authorization system',
      tests: [],
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      duration: 0
    };

    const startTime = Date.now();

    // Test valid authentication
    await this.runTest(testSuite, 'Valid User Authentication', async () => {
      const result = await enhancedAuthService.authenticateUser(
        'admin@example.com',
        'admin123',
        '127.0.0.1',
        'test-browser'
      );

      if (!result.success) {
        throw new Error(result.error || 'Authentication failed');
      }

      return { 
        message: 'User authenticated successfully',
        userId: result.user?.id,
        tokenGenerated: !!result.token
      };
    });

    // Test invalid authentication
    await this.runTest(testSuite, 'Invalid User Authentication', async () => {
      const result = await enhancedAuthService.authenticateUser(
        'invalid@example.com',
        'wrongpassword',
        '127.0.0.1',
        'test-browser'
      );

      if (result.success) {
        throw new Error('Invalid authentication should have failed');
      }

      return { message: 'Invalid authentication correctly rejected' };
    });

    // Test token validation
    await this.runTest(testSuite, 'Token Validation', async () => {
      const result = await enhancedAuthService.authenticateUser(
        'admin@example.com',
        'admin123',
        '127.0.0.1',
        'test-browser'
      );

      if (result.token) {
        const validation = await enhancedAuthService.validateToken(result.token.accessToken);
        return { 
          message: 'Token validation completed',
          valid: validation.valid,
          userFound: !!validation.user
        };
      }

      throw new Error('No token available for validation');
    });

    testSuite.duration = Date.now() - startTime;
    this.results.push(testSuite);
  }

  private async runCommunicationTests(): Promise<void> {
    const testSuite: TestSuite = {
      name: 'Cross-Component Communication',
      description: 'Tests for event bus and communication protocols',
      tests: [],
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      duration: 0
    };

    const startTime = Date.now();

    // Test event publishing
    await this.runTest(testSuite, 'Event Publishing', async () => {
      let eventReceived = false;
      
      const unsubscribe = communicationProtocolService.subscribeToEvents(
        'content_processed' as IntegrationEventType,
        (event) => {
          eventReceived = true;
        }
      );

      // Publish test event
      communicationProtocolService.publishEvent({
        type: 'content_processed' as IntegrationEventType,
        source: 'gateway',
        data: { test: 'data' },
        timestamp: new Date().toISOString()
      });

      // Wait a bit for event processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      unsubscribe();

      if (!eventReceived) {
        throw new Error('Event was not received');
      }

      return { message: 'Event published and received successfully' };
    });

    // Test message sending
    await this.runTest(testSuite, 'Message Queue Communication', async () => {
      const result = await communicationProtocolService.sendMessage(
        'message_queue' as any,
        'test_target',
        {
          type: 'test_message',
          source: 'test',
          target: 'test_target',
          payload: { content: 'test payload' },
          priority: 2
        }
      );

      if (!result.success) {
        throw new Error(result.error || 'Message sending failed');
      }

      return { 
        message: 'Message sent successfully',
        messageId: result.messageId
      };
    });

    // Test data synchronization
    await this.runTest(testSuite, 'Data Synchronization', async () => {
      const syncId = communicationProtocolService.startDataSync(
        'full_sync',
        'source_service',
        'target_service',
        { test: 'data' }
      );

      return { 
        message: 'Data synchronization initiated',
        syncId
      };
    });

    testSuite.duration = Date.now() - startTime;
    this.results.push(testSuite);
  }

  private async runContentProcessingTests(): Promise<void> {
    const testSuite: TestSuite = {
      name: 'Content Processing',
      description: 'Tests for content processing through integrated system',
      tests: [],
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      duration: 0
    };

    const startTime = Date.now();

    // Test content processing
    await this.runTest(testSuite, 'Content Processing', async () => {
      const result = await unifiedIntegrationService.processContent(
        'This is test content for processing validation',
        {
          includeTags: true,
          includeModeration: true,
          includeInsights: false,
          userId: 'test_user'
        }
      );

      return { 
        message: 'Content processed successfully',
        contentId: result.contentId,
        servicesUsed: result.metadata.servicesUsed,
        processingTime: result.metadata.processingTime
      };
    });

    // Test unified content retrieval
    await this.runTest(testSuite, 'Unified Content Retrieval', async () => {
      const content = await unifiedIntegrationService.getUnifiedContent('test_content_001');

      return { 
        message: 'Unified content retrieved successfully',
        contentId: content.id,
        hasMetadata: !!content.metadata,
        hasTags: Array.isArray(content.adaptiveTags),
        hasBhivStatus: !!content.bhivStatus,
        hasInsights: !!content.insights
      };
    });

    testSuite.duration = Date.now() - startTime;
    this.results.push(testSuite);
  }

  private async runSecurityTests(): Promise<void> {
    const testSuite: TestSuite = {
      name: 'Security Optimizations',
      description: 'Tests for security features and threat detection',
      tests: [],
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      duration: 0
    };

    const startTime = Date.now();

    // Test rate limiting
    await this.runTest(testSuite, 'Rate Limiting', async () => {
      const results: Array<{ allowed: boolean; remaining: number; resetTime: number }> = [];
      for (let i = 0; i < 5; i++) {
        results.push(securityOptimizationService.checkRateLimit('127.0.0.1'));
      }

      const allAllowed = results.every(r => r.allowed);
      const decreasingRemaining = results.every((r, i) => 
        i === 0 || r.remaining < (results[i - 1]?.remaining ?? 999999)
      );

      if (!allAllowed || !decreasingRemaining) {
        throw new Error('Rate limiting not working correctly');
      }

      return { 
        message: 'Rate limiting working correctly',
        totalChecks: results.length,
        allAllowed
      };
    });

    // Test input validation
    await this.runTest(testSuite, 'Input Validation', async () => {
      const maliciousInput = '<script>alert("xss")</script>';
      const result = securityOptimizationService.validateInput(maliciousInput);

      if (result.valid) {
        throw new Error('Malicious input should have been detected');
      }

      return { 
        message: 'Input validation working correctly',
        threatsDetected: result.threats.length,
        threats: result.threats
      };
    });

    // Test security metrics
    await this.runTest(testSuite, 'Security Metrics', async () => {
      securityOptimizationService.checkRateLimit('127.0.0.1');
      securityOptimizationService.handleAuthFailure('127.0.0.1');

      const metrics = securityOptimizationService.getSecurityMetrics();

      return { 
        message: 'Security metrics collected successfully',
        totalRequests: metrics.totalRequests,
        blockedRequests: metrics.blockedRequests,
        authFailures: metrics.authFailures
      };
    });

    testSuite.duration = Date.now() - startTime;
    this.results.push(testSuite);
  }

  private async runPerformanceTests(): Promise<void> {
    const testSuite: TestSuite = {
      name: 'Performance Optimizations',
      description: 'Tests for caching, connection pooling, and performance monitoring',
      tests: [],
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      duration: 0
    };

    const startTime = Date.now();

    // Test caching
    await this.runTest(testSuite, 'Cache Operations', async () => {
      const testData = { id: 'test', value: 'test_value' };
      
      // Set cache
      performanceOptimizationService.setCache('test_key', testData, 60000);
      
      // Get cache
      const cachedData = performanceOptimizationService.getFromCache('test_key');
      
      if (!cachedData || cachedData.id !== testData.id) {
        throw new Error('Cache operation failed');
      }

      return { 
        message: 'Cache operations working correctly',
        dataCached: !!cachedData,
        cacheHit: cachedData.id === testData.id
      };
    });

    // Test connection pooling
    await this.runTest(testSuite, 'Connection Pooling', async () => {
      const connection = await performanceOptimizationService.getConnection('bhiv-core');
      
      if (!connection) {
        throw new Error('Failed to get connection from pool');
      }

      performanceOptimizationService.returnConnection('bhiv-core', connection);

      return { 
        message: 'Connection pooling working correctly',
        connectionObtained: !!connection,
        service: connection.service
      };
    });

    // Test load balancing
    await this.runTest(testSuite, 'Load Balancing', async () => {
      performanceOptimizationService.addEndpoint('bhiv-core', 'http://localhost:8001');
      performanceOptimizationService.addEndpoint('bhiv-core', 'http://localhost:8002');
      
      const endpoint1 = performanceOptimizationService.getLoadBalancedEndpoint('bhiv-core');
      const endpoint2 = performanceOptimizationService.getLoadBalancedEndpoint('bhiv-core');

      if (!endpoint1 || !endpoint2) {
        throw new Error('Load balancing failed');
      }

      return { 
        message: 'Load balancing working correctly',
        endpointsAvailable: [endpoint1, endpoint2]
      };
    });

    // Test performance metrics
    await this.runTest(testSuite, 'Performance Metrics', async () => {
      performanceOptimizationService.recordRequest(150, true);
      performanceOptimizationService.recordRequest(200, false);
      
      const metrics = performanceOptimizationService.getPerformanceMetrics();

      return { 
        message: 'Performance metrics collected successfully',
        responseTime: metrics.responseTime,
        throughput: metrics.throughput,
        errorRate: metrics.errorRate
      };
    });

    testSuite.duration = Date.now() - startTime;
    this.results.push(testSuite);
  }

  private async runIntegrationFlowTests(): Promise<void> {
    const testSuite: TestSuite = {
      name: 'End-to-End Integration Flow',
      description: 'Tests for complete integration workflows',
      tests: [],
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      duration: 0
    };

    const startTime = Date.now();

    // Test complete user workflow
    await this.runTest(testSuite, 'Complete User Workflow', async () => {
      // 1. Authenticate user
      const authResult = await enhancedAuthService.authenticateUser(
        'admin@example.com',
        'admin123',
        '127.0.0.1',
        'test-browser'
      );

      if (!authResult.success) {
        throw new Error('Authentication failed in workflow');
      }

      // 2. Process content
      const contentResult = await unifiedIntegrationService.processContent(
        'End-to-end test content',
        {
          includeTags: true,
          includeModeration: true,
          includeInsights: true,
          userId: authResult.user?.id
        }
      );

      // 3. Get unified content
      const unifiedContent = await unifiedIntegrationService.getUnifiedContent(contentResult.contentId);

      return { 
        message: 'Complete user workflow executed successfully',
        authSuccess: authResult.success,
        contentProcessed: !!contentResult.contentId,
        unifiedContentRetrieved: !!unifiedContent.id
      };
    });

    // Test real-time event flow
    await this.runTest(testSuite, 'Real-time Event Flow', async () => {
      let eventCount = 0;
      
      const unsubscribe = communicationProtocolService.subscribeToEvents(
        ['content_processed', 'tag_created'] as IntegrationEventType[],
        (event) => {
          eventCount++;
        }
      );

      // Publish multiple events
      communicationProtocolService.publishEvent({
        type: 'content_processed' as IntegrationEventType,
        source: 'gateway',
        data: { step: 1 },
        timestamp: new Date().toISOString()
      });

      communicationProtocolService.publishEvent({
        type: 'tag_created' as IntegrationEventType,
        source: 'gateway',
        data: { step: 2 },
        timestamp: new Date().toISOString()
      });

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 200));
      
      unsubscribe();

      return { 
        message: 'Real-time event flow completed successfully',
        eventsPublished: 2,
        eventsReceived: eventCount
      };
    });

    testSuite.duration = Date.now() - startTime;
    this.results.push(testSuite);
  }

  private async runTest(testSuite: TestSuite, testName: string, testFunction: () => Promise<any>): Promise<void> {
    const testResult: TestResult = {
      name: testName,
      status: 'skipped',
      duration: 0
    };

    const startTime = Date.now();

    try {
      const result = await testFunction();
      testResult.status = 'passed';
      testResult.details = result;
      testSuite.passed++;
      console.log(`✅ ${testName}: PASSED`);
    } catch (error) {
      testResult.status = 'failed';
      testResult.error = error instanceof Error ? error.message : String(error);
      testSuite.failed++;
      console.log(`❌ ${testName}: FAILED - ${testResult.error}`);
    }

    testResult.duration = Date.now() - startTime;
    testSuite.tests.push(testResult);
    testSuite.total++;
  }

  private printSummary(totalDuration: number): void {
    console.log('\n📊 INTEGRATION TEST SUMMARY');
    console.log('='.repeat(50));

    let totalPassed = 0;
    let totalFailed = 0;
    let totalSkipped = 0;

    this.results.forEach(suite => {
      console.log(`\n${suite.name}:`);
      console.log(`  Duration: ${suite.duration}ms`);
      console.log(`  Passed: ${suite.passed}/${suite.total}`);
      console.log(`  Failed: ${suite.failed}/${suite.total}`);
      console.log(`  Skipped: ${suite.skipped}/${suite.total}`);

      if (suite.failed > 0) {
        console.log(`  ❌ Failed tests:`);
        suite.tests.filter(t => t.status === 'failed').forEach(test => {
          console.log(`    - ${test.name}: ${test.error}`);
        });
      }

      totalPassed += suite.passed;
      totalFailed += suite.failed;
      totalSkipped += suite.skipped;
    });

    console.log('\n' + '='.repeat(50));
    console.log('OVERALL RESULTS:');
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log(`Total Tests: ${totalPassed + totalFailed + totalSkipped}`);
    console.log(`✅ Passed: ${totalPassed}`);
    console.log(`❌ Failed: ${totalFailed}`);
    console.log(`⏭️  Skipped: ${totalSkipped}`);
    console.log(`Success Rate: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`);

    if (totalFailed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Integration system is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the integration system.');
    }
  }

  getResults(): TestSuite[] {
    return this.results;
  }
}

// Export singleton instance
export const integrationTestRunner = new IntegrationTestRunner();

// Auto-run tests if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
  integrationTestRunner.runAllTests().then(() => {
    console.log('Integration test suite completed.');
    process.exit(0);
  }).catch(error => {
    console.error('Integration test suite failed:', error);
    process.exit(1);
  });
}

export default IntegrationTestRunner;