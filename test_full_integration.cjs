/**
 * Comprehensive Integration Test Script
 * Tests the complete BHIV Core + Insight Bridge + Frontend integration
 */

const axios = require('axios');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  BHIV_API_URL: 'http://localhost:4000',
  INSIGHTBRIDGE_API_URL: 'http://localhost:4001',
  FRONTEND_URL: 'http://localhost:5173',
  TEST_TIMEOUT: 10000
};

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class IntegrationTester {
  constructor() {
    this.testResults = [];
    this.insightBridgeProcess = null;
    this.frontendProcess = null;
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async waitForServer(url, serviceName) {
    this.log(`Waiting for ${serviceName} to be ready at ${url}...`, 'cyan');
    const startTime = Date.now();
    
    while (Date.now() - startTime < CONFIG.TEST_TIMEOUT) {
      try {
        await axios.get(`${url}/health`, { timeout: 1000 });
        this.log(`${serviceName} is ready!`, 'green');
        return true;
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    throw new Error(`${serviceName} failed to start within timeout`);
  }

  async startInsightBridge() {
    this.log('Starting Insight Bridge server...', 'cyan');
    
    return new Promise((resolve, reject) => {
      this.insightBridgeProcess = spawn('node', ['mock_insightbridge_server.cjs'], {
        cwd: 'scripts',
        stdio: 'pipe'
      });

      this.insightBridgeProcess.stdout.on('data', (data) => {
        console.log(`InsightBridge: ${data}`);
      });

      this.insightBridgeProcess.stderr.on('data', (data) => {
        console.error(`InsightBridge Error: ${data}`);
      });

      this.insightBridgeProcess.on('close', (code) => {
        console.log(`InsightBridge process exited with code ${code}`);
      });

      // Wait for server to be ready
      setTimeout(async () => {
        try {
          await this.waitForServer(CONFIG.INSIGHTBRIDGE_API_URL, 'Insight Bridge');
          resolve();
        } catch (error) {
          reject(error);
        }
      }, 2000);
    });
  }

  async startFrontend() {
    this.log('Starting frontend development server...', 'cyan');
    
    return new Promise((resolve, reject) => {
      this.frontendProcess = spawn('npm', ['run', 'dev'], {
        cwd: '.',
        stdio: 'pipe',
        shell: true
      });

      this.frontendProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('ready')) {
          console.log('Frontend ready!');
          resolve();
        }
      });

      this.frontendProcess.stderr.on('data', (data) => {
        console.error(`Frontend Error: ${data}`);
      });

      // Wait for server to be ready
      setTimeout(async () => {
        try {
          await this.waitForServer(CONFIG.FRONTEND_URL, 'Frontend');
          resolve();
        } catch (error) {
          reject(error);
        }
      }, 10000);
    });
  }

  async testBHIVEndpoints() {
    this.log('\n=== Testing BHIV Core API Endpoints ===', 'bright');
    
    const tests = [
      {
        name: 'Get all tags',
        method: 'GET',
        url: `${CONFIG.BHIV_API_URL}/tags`,
        expectedStatus: 200
      },
      {
        name: 'Create a new tag',
        method: 'POST',
        url: `${CONFIG.BHIV_API_URL}/tags`,
        data: {
          id: 'test-tag-1',
          name: 'Test Integration Tag',
          category: 'integration',
          status: 'active',
          config: {
            type: 'behavioral',
            target: 'user-engagement',
            priority: 'medium'
          }
        },
        expectedStatus: 201
      },
      {
        name: 'Get tag by ID',
        method: 'GET',
        url: `${CONFIG.BHIV_API_URL}/tags/test-tag-1`,
        expectedStatus: 200
      },
      {
        name: 'Update tag status',
        method: 'PATCH',
        url: `${CONFIG.BHIV_API_URL}/tags/test-tag-1/status`,
        data: { status: 'paused' },
        expectedStatus: 200
      },
      {
        name: 'Get tag analytics',
        method: 'GET',
        url: `${CONFIG.BHIV_API_URL}/analytics/tags/test-tag-1`,
        expectedStatus: 200
      }
    ];

    for (const test of tests) {
      try {
        const response = await axios({
          method: test.method,
          url: test.url,
          data: test.data,
          timeout: 5000
        });

        if (response.status === test.expectedStatus) {
          this.log(`✓ ${test.name}: PASSED`, 'green');
          this.testResults.push({ test: test.name, status: 'PASSED', response: response.data });
        } else {
          this.log(`✗ ${test.name}: FAILED (Expected ${test.expectedStatus}, got ${response.status})`, 'red');
          this.testResults.push({ test: test.name, status: 'FAILED', error: `Status ${response.status}` });
        }
      } catch (error) {
        this.log(`✗ ${test.name}: FAILED (${error.message})`, 'red');
        this.testResults.push({ test: test.name, status: 'FAILED', error: error.message });
      }
    }
  }

  async testInsightBridgeEndpoints() {
    this.log('\n=== Testing Insight Bridge API Endpoints ===', 'bright');
    
    const tests = [
      {
        name: 'Get tag insights',
        method: 'GET',
        url: `${CONFIG.INSIGHTBRIDGE_API_URL}/insights/test-tag-1`,
        expectedStatus: 200
      },
      {
        name: 'Get behavior analysis',
        method: 'GET',
        url: `${CONFIG.INSIGHTBRIDGE_API_URL}/analytics/behavior/test-tag-1`,
        expectedStatus: 200
      },
      {
        name: 'Get performance metrics',
        method: 'GET',
        url: `${CONFIG.INSIGHTBRIDGE_API_URL}/analytics/performance/test-tag-1`,
        expectedStatus: 200
      },
      {
        name: 'Get optimization recommendations',
        method: 'GET',
        url: `${CONFIG.INSIGHTBRIDGE_API_URL}/recommendations/test-tag-1`,
        expectedStatus: 200
      }
    ];

    for (const test of tests) {
      try {
        const response = await axios({
          method: test.method,
          url: test.url,
          timeout: 5000
        });

        if (response.status === test.expectedStatus) {
          this.log(`✓ ${test.name}: PASSED`, 'green');
          this.testResults.push({ test: test.name, status: 'PASSED', response: response.data });
        } else {
          this.log(`✗ ${test.name}: FAILED (Expected ${test.expectedStatus}, got ${response.status})`, 'red');
          this.testResults.push({ test: test.name, status: 'FAILED', error: `Status ${response.status}` });
        }
      } catch (error) {
        this.log(`✗ ${test.name}: FAILED (${error.message})`, 'red');
        this.testResults.push({ test: test.name, status: 'FAILED', error: error.message });
      }
    }
  }

  async testFrontendIntegration() {
    this.log('\n=== Testing Frontend Integration ===', 'bright');
    
    try {
      // Test if frontend is accessible
      const response = await axios.get(CONFIG.FRONTEND_URL, { timeout: 5000 });
      this.log('✓ Frontend is accessible', 'green');
      this.testResults.push({ test: 'Frontend Accessibility', status: 'PASSED' });
    } catch (error) {
      this.log('✗ Frontend is not accessible', 'red');
      this.testResults.push({ test: 'Frontend Accessibility', status: 'FAILED', error: error.message });
    }

    // Test API service integration
    try {
      const integrationServicePath = path.join(__dirname, 'src', 'services', 'bhivIntegrationService.ts');
      if (fs.existsSync(integrationServicePath)) {
        this.log('✓ Integration service exists', 'green');
        this.testResults.push({ test: 'Integration Service File', status: 'PASSED' });
      } else {
        this.log('✗ Integration service file not found', 'red');
        this.testResults.push({ test: 'Integration Service File', status: 'FAILED', error: 'File not found' });
      }
    } catch (error) {
      this.log(`✗ Frontend integration test failed: ${error.message}`, 'red');
      this.testResults.push({ test: 'Frontend Integration', status: 'FAILED', error: error.message });
    }
  }

  async testEndToEndFlow() {
    this.log('\n=== Testing End-to-End Flow ===', 'bright');
    
    try {
      // Create a tag through BHIV API
      const tagResponse = await axios.post(`${CONFIG.BHIV_API_URL}/tags`, {
        id: 'e2e-test-tag',
        name: 'End-to-End Test Tag',
        category: 'test',
        status: 'active',
        config: {
          type: 'conversion',
          target: 'user-signup',
          priority: 'high'
        }
      });

      const tagId = tagResponse.data.id;
      this.log(`✓ Created test tag: ${tagId}`, 'green');

      // Get insights for the tag from Insight Bridge
      const insightsResponse = await axios.get(`${CONFIG.INSIGHTBRIDGE_API_URL}/insights/${tagId}`);
      this.log('✓ Retrieved tag insights', 'green');

      // Verify data consistency
      if (insightsResponse.data.tagId === tagId) {
        this.log('✓ End-to-end data consistency verified', 'green');
        this.testResults.push({ test: 'End-to-End Flow', status: 'PASSED' });
      } else {
        this.log('✗ Data consistency failed', 'red');
        this.testResults.push({ test: 'End-to-End Flow', status: 'FAILED', error: 'Data inconsistency' });
      }

    } catch (error) {
      this.log(`✗ End-to-end flow failed: ${error.message}`, 'red');
      this.testResults.push({ test: 'End-to-End Flow', status: 'FAILED', error: error.message });
    }
  }

  async generateTestReport() {
    this.log('\n=== Integration Test Report ===', 'bright');
    
    const passed = this.testResults.filter(r => r.status === 'PASSED').length;
    const failed = this.testResults.filter(r => r.status === 'FAILED').length;
    const total = this.testResults.length;

    this.log(`Total Tests: ${total}`, 'cyan');
    this.log(`Passed: ${passed}`, 'green');
    this.log(`Failed: ${failed}`, 'red');

    if (failed > 0) {
      this.log('\nFailed Tests:', 'red');
      this.testResults.filter(r => r.status === 'FAILED').forEach(test => {
        this.log(`  - ${test.test}: ${test.error}`, 'red');
      });
    }

    // Save detailed report to file
    const reportPath = path.join(__dirname, 'integration_test_results.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: { total, passed, failed },
      results: this.testResults
    }, null, 2));

    this.log(`\nDetailed report saved to: ${reportPath}`, 'cyan');

    return { passed, failed, total };
  }

  async cleanup() {
    this.log('\nCleaning up processes...', 'cyan');
    
    if (this.insightBridgeProcess) {
      this.insightBridgeProcess.kill();
      this.log('Insight Bridge process terminated', 'yellow');
    }

    if (this.frontendProcess) {
      this.frontendProcess.kill();
      this.log('Frontend process terminated', 'yellow');
    }
  }

  async runAllTests() {
    try {
      this.log('🚀 Starting Comprehensive Integration Tests', 'bright');
      
      // Test if BHIV is already running
      try {
        await this.waitForServer(CONFIG.BHIV_API_URL, 'BHIV Core');
      } catch (error) {
        this.log('BHIV Core not detected. Please ensure it is running first.', 'yellow');
        return;
      }

      // Start Insight Bridge
      await this.startInsightBridge();

      // Start Frontend
      await this.startFrontend();

      // Run all test suites
      await this.testBHIVEndpoints();
      await this.testInsightBridgeEndpoints();
      await this.testFrontendIntegration();
      await this.testEndToEndFlow();

      // Generate final report
      const results = await this.generateTestReport();

      if (results.failed === 0) {
        this.log('\n🎉 All integration tests PASSED!', 'bright', 'green');
      } else {
        this.log(`\n⚠️  ${results.failed} tests failed. Review the report for details.`, 'bright', 'yellow');
      }

    } catch (error) {
      this.log(`\n❌ Integration test suite failed: ${error.message}`, 'bright', 'red');
    } finally {
      await this.cleanup();
    }
  }
}

// Run the integration tests
const tester = new IntegrationTester();
tester.runAllTests().catch(console.error);