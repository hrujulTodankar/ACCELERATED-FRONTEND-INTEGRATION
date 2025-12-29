#!/usr/bin/env node

/**
 * Test script for InsightBridge API integration
 * Tests all the security endpoints to ensure they're working properly
 */

const axios = require('axios');

// Configuration
const INSIGHTBRIDGE_BASE_URL = process.env.INSIGHTBRIDGE_API_URL || 'http://localhost:8002';
const TIMEOUT = 5000;

console.log('🧪 Testing InsightBridge API Integration');
console.log('=' .repeat(50));
console.log(`Base URL: ${INSIGHTBRIDGE_BASE_URL}`);
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
      console.log(`   Result: ${JSON.stringify(result, null, 2).split('\n').slice(0, 3).join('\n')}...`);
    }
    testsPassed++;
    console.log('');
  } catch (error) {
    console.log(`❌ FAILED: ${name}`);
    console.log(`   Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    testsFailed++;
    console.log('');
  }
}

// Test functions
async function testHealthCheck() {
  const response = await axios.get(`${INSIGHTBRIDGE_BASE_URL}/health`, { timeout: TIMEOUT });
  return response.data;
}

async function testRootEndpoint() {
  const response = await axios.get(`${INSIGHTBRIDGE_BASE_URL}/`, { timeout: TIMEOUT });
  return response.data;
}

async function testSignatureSign() {
  const testMessage = `Test message ${Date.now()}`;
  const response = await axios.post(`${INSIGHTBRIDGE_BASE_URL}/signature/sign`, {
    message: testMessage,
    key_id: 'default'
  }, { timeout: TIMEOUT });
  return response.data;
}

async function testJWTCreation() {
  const payload = {
    user: 'test_user',
    action: 'api_test',
    timestamp: new Date().toISOString()
  };
  const response = await axios.post(`${INSIGHTBRIDGE_BASE_URL}/auth/jwt/create`, {
    payload,
    exp_seconds: 300
  }, { timeout: TIMEOUT });
  return response.data;
}

async function testNonceCheck() {
  const testNonce = `test_nonce_${Date.now()}`;
  const response = await axios.post(`${INSIGHTBRIDGE_BASE_URL}/security/nonce/check`, {
    nonce: testNonce
  }, { timeout: TIMEOUT });
  return response.data;
}

async function testHashChainAppend() {
  const testData = {
    test: true,
    timestamp: new Date().toISOString(),
    message: 'Test hash chain entry'
  };
  const response = await axios.post(`${INSIGHTBRIDGE_BASE_URL}/audit/hashchain/append`, {
    data: testData
  }, { timeout: TIMEOUT });
  return response.data;
}

async function testHashChainGet() {
  const response = await axios.get(`${INSIGHTBRIDGE_BASE_URL}/audit/hashchain`, { timeout: TIMEOUT });
  return response.data;
}

async function testAuditStatus() {
  const response = await axios.get(`${INSIGHTBRIDGE_BASE_URL}/audit/status`, { timeout: TIMEOUT });
  return response.data;
}

async function testHeartbeat() {
  const response = await axios.post(`${INSIGHTBRIDGE_BASE_URL}/receiver/heartbeat`, {}, { timeout: TIMEOUT });
  return response.data;
}

// Combined security test
async function testCombinedSecurity() {
  try {
    // 1. Create JWT
    const jwtResponse = await axios.post(`${INSIGHTBRIDGE_BASE_URL}/auth/jwt/create`, {
      payload: { test: true, timestamp: new Date().toISOString() },
      exp_seconds: 300
    }, { timeout: TIMEOUT });

    // 2. Sign a message
    const signResponse = await axios.post(`${INSIGHTBRIDGE_BASE_URL}/signature/sign`, {
      message: 'Combined security test message',
      key_id: 'default'
    }, { timeout: TIMEOUT });

    // 3. Check nonce
    const nonceResponse = await axios.post(`${INSIGHTBRIDGE_BASE_URL}/security/nonce/check`, {
      nonce: `combined_test_${Date.now()}`
    }, { timeout: TIMEOUT });

    // 4. Add to audit trail
    const auditResponse = await axios.post(`${INSIGHTBRIDGE_BASE_URL}/audit/hashchain/append`, {
      data: { 
        combined_test: true, 
        jwt_token: jwtResponse.data.token.substring(0, 20) + '...',
        signature_created: !!signResponse.data.signature,
        nonce_accepted: nonceResponse.data.accepted
      }
    }, { timeout: TIMEOUT });

    return {
      jwt_created: !!jwtResponse.data.token,
      signature_created: !!signResponse.data.signature,
      nonce_accepted: nonceResponse.data.accepted,
      audit_hash: auditResponse.data.hash
    };
  } catch (error) {
    throw new Error(`Combined security test failed: ${error.message}`);
  }
}

// Main test execution
async function runTests() {
  console.log('Starting InsightBridge API tests...\n');

  await testEndpoint('Health Check', testHealthCheck);
  await testEndpoint('Root Endpoint', testRootEndpoint);
  await testEndpoint('Signature Creation', testSignatureSign);
  await testEndpoint('JWT Creation', testJWTCreation);
  await testEndpoint('Nonce Check', testNonceCheck);
  await testEndpoint('Hash Chain Append', testHashChainAppend);
  await testEndpoint('Hash Chain Retrieval', testHashChainGet);
  await testEndpoint('Audit Status', testAuditStatus);
  await testEndpoint('Heartbeat', testHeartbeat);
  await testEndpoint('Combined Security Operations', testCombinedSecurity);

  // Summary
  console.log('=' .repeat(50));
  console.log('📊 Test Summary:');
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`📈 Success Rate: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%`);
  console.log('=' .repeat(50));

  if (testsFailed === 0) {
    console.log('🎉 All tests passed! InsightBridge API integration is working correctly.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please check the InsightBridge API service and configuration.');
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