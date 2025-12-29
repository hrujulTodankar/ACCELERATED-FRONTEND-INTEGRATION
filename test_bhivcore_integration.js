#!/usr/bin/env node

/**
 * Test script for BHIV Core API integration
 * Tests all the BHIV Core endpoints to ensure they're working properly
 */

import axios from 'axios';

// Configuration
const BHIVCORE_BASE_URL = process.env.BHIVCORE_API_URL || 'http://localhost:8001';
const TIMEOUT = 5000;

console.log('🧪 Testing BHIV Core API Integration');
console.log('=' .repeat(50));
console.log(`Base URL: ${BHIVCORE_BASE_URL}`);
console.log(`Timeout: ${TIMEOUT}ms`);
console.log('');

// Test counter
let testsPassed = 0;
let testsFailed = 0;

// Helper function to run tests
async function testEndpoint(name, testFunction) {
  try {
    console.log(`🔍 Testing: ${name}`);
    const result = await testFunction();
    console.log(`✅ PASSED: ${name}`);
    if (result) {
      const resultStr = JSON.stringify(result, null, 2);
      console.log(`   Result: ${resultStr.split('\n').slice(0, 3).join('\n')}${resultStr.split('\n').length > 3 ? '...' : ''}`);
    }
    testsPassed++;
    console.log('');
  } catch (error) {
    console.log(`❌ FAILED: ${name}`);
    console.log(`   Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data, null, 2).split('\n').slice(0, 3).join('\n')}...`);
    }
    testsFailed++;
    console.log('');
  }
}

// Test functions
async function testHealthCheck() {
  const response = await axios.get(`${BHIVCORE_BASE_URL}/health`, { timeout: TIMEOUT });
  return response.data;
}

async function testRootEndpoint() {
  const response = await axios.get(`${BHIVCORE_BASE_URL}/`, { timeout: TIMEOUT });
  return response.data;
}

async function testAskVedas() {
  const testQuery = `What is the meaning of dharma? ${Date.now()}`;
  const response = await axios.post(`${BHIVCORE_BASE_URL}/ask-vedas`, {
    query: testQuery,
    user_id: 'test_user'
  }, { timeout: TIMEOUT });
  return response.data;
}

async function testAskVedasGet() {
  const testQuery = `How to achieve moksha? ${Date.now()}`;
  const response = await axios.get(`${BHIVCORE_BASE_URL}/ask-vedas`, {
    params: { query: testQuery, user_id: 'test_user_get' },
    timeout: TIMEOUT
  });
  return response.data;
}

async function testEdumentor() {
  const testQuery = `Explain quantum physics basics ${Date.now()}`;
  const response = await axios.post(`${BHIVCORE_BASE_URL}/edumentor`, {
    query: testQuery,
    user_id: 'test_user'
  }, { timeout: TIMEOUT });
  return response.data;
}

async function testEdumentorGet() {
  const testQuery = `What is machine learning? ${Date.now()}`;
  const response = await axios.get(`${BHIVCORE_BASE_URL}/edumentor`, {
    params: { query: testQuery, user_id: 'test_user_get' },
    timeout: TIMEOUT
  });
  return response.data;
}

async function testWellness() {
  const testQuery = `How to reduce stress? ${Date.now()}`;
  const response = await axios.post(`${BHIVCORE_BASE_URL}/wellness`, {
    query: testQuery,
    user_id: 'test_user'
  }, { timeout: TIMEOUT });
  return response.data;
}

async function testWellnessGet() {
  const testQuery = `Tips for better sleep ${Date.now()}`;
  const response = await axios.get(`${BHIVCORE_BASE_URL}/wellness`, {
    params: { query: testQuery, user_id: 'test_user_get' },
    timeout: TIMEOUT
  });
  return response.data;
}

async function testQueryKB() {
  const testQuery = `Ancient wisdom and modern science ${Date.now()}`;
  const response = await axios.post(`${BHIVCORE_BASE_URL}/query-kb`, {
    query: testQuery,
    limit: 3,
    user_id: 'test_user'
  }, { timeout: TIMEOUT });
  return response.data;
}

async function testQueryKBGet() {
  const testQuery = `Vedic philosophy ${Date.now()}`;
  const response = await axios.get(`${BHIVCORE_BASE_URL}/query-kb`, {
    params: { query: testQuery, limit: 2, user_id: 'test_user_get' },
    timeout: TIMEOUT
  });
  return response.data;
}

async function testKBAnalytics() {
  const response = await axios.get(`${BHIVCORE_BASE_URL}/kb-analytics`, {
    params: { hours: 24 },
    timeout: TIMEOUT
  });
  return response.data;
}

async function testKBFeedback() {
  const response = await axios.post(`${BHIVCORE_BASE_URL}/kb-feedback`, {
    query_id: `test_${Date.now()}`,
    feedback: {
      rating: 5,
      comment: "Great response!",
      helpful: true
    }
  }, { timeout: TIMEOUT });
  return response.data;
}

// NAS KB Tests (might not be available in minimal version)
async function testNasKBStatus() {
  try {
    const response = await axios.get(`${BHIVCORE_BASE_URL}/nas-kb/status`, { timeout: TIMEOUT });
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      throw new Error('NAS KB endpoints not available (expected in minimal version)');
    }
    throw error;
  }
}

async function testNasKBDocuments() {
  try {
    const response = await axios.get(`${BHIVCORE_BASE_URL}/nas-kb/documents`, { timeout: TIMEOUT });
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      throw new Error('NAS KB endpoints not available (expected in minimal version)');
    }
    throw error;
  }
}

async function testNasKBSearch() {
  try {
    const response = await axios.get(`${BHIVCORE_BASE_URL}/nas-kb/search`, {
      params: { query: 'ancient wisdom', limit: 2 },
      timeout: TIMEOUT
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      throw new Error('NAS KB endpoints not available (expected in minimal version)');
    }
    throw error;
  }
}

// Combined test
async function testCombinedBHIVOperations() {
  try {
    // Test Vedas endpoint
    const vedasResponse = await axios.post(`${BHIVCORE_BASE_URL}/ask-vedas`, {
      query: `Combined test query ${Date.now()}`,
      user_id: 'combined_test_user'
    }, { timeout: TIMEOUT });

    // Test KB query
    const kbResponse = await axios.post(`${BHIVCORE_BASE_URL}/query-kb`, {
      query: 'Combined KB test',
      limit: 2,
      user_id: 'combined_test_user'
    }, { timeout: TIMEOUT });

    return {
      vedas_query_id: vedasResponse.data.query_id,
      kb_query_id: kbResponse.data.query_id,
      vedas_success: !!vedasResponse.data.response,
      kb_success: !!kbResponse.data.response
    };
  } catch (error) {
    throw new Error(`Combined BHIV operations test failed: ${error.message}`);
  }
}

// Main test execution
async function runTests() {
  console.log('Starting BHIV Core API tests...\n');

  await testEndpoint('Health Check', testHealthCheck);
  await testEndpoint('Root Endpoint', testRootEndpoint);
  await testEndpoint('Ask Vedas (POST)', testAskVedas);
  await testEndpoint('Ask Vedas (GET)', testAskVedasGet);
  await testEndpoint('Edumentor (POST)', testEdumentor);
  await testEndpoint('Edumentor (GET)', testEdumentorGet);
  await testEndpoint('Wellness (POST)', testWellness);
  await testEndpoint('Wellness (GET)', testWellnessGet);
  await testEndpoint('Query KB (POST)', testQueryKB);
  await testEndpoint('Query KB (GET)', testQueryKBGet);
  await testEndpoint('KB Analytics', testKBAnalytics);
  await testEndpoint('KB Feedback', testKBFeedback);
  
  // Optional NAS KB tests (will fail gracefully if not available)
  try {
    await testEndpoint('NAS KB Status', testNasKBStatus);
    await testEndpoint('NAS KB Documents', testNasKBDocuments);
    await testEndpoint('NAS KB Search', testNasKBSearch);
  } catch (error) {
    console.log('ℹ️  NAS KB tests skipped (not available in minimal version)');
    console.log('');
  }
  
  await testEndpoint('Combined BHIV Operations', testCombinedBHIVOperations);

  // Summary
  console.log('=' .repeat(50));
  console.log('📊 Test Summary:');
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`📈 Success Rate: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%`);
  console.log('=' .repeat(50));

  if (testsFailed === 0) {
    console.log('🎉 All tests passed! BHIV Core API integration is working correctly.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please check the BHIV Core API service and configuration.');
    process.exit(1);
  }
}

// Handle errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run the tests
runTests().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});