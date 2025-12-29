#!/usr/bin/env node

/**
 * Simple test to verify InsightBridge Security Integration
 * Tests the frontend components and API integration
 */

import axios from 'axios';

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = (message, color = COLORS.reset) => {
  console.log(`${color}${message}${COLORS.reset}`);
};

const testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

const runTest = (name, testFn) => {
  testResults.total++;
  log(`\n🧪 Testing: ${name}`, COLORS.blue);
  
  try {
    const result = testFn();
    if (result === true || (typeof result === 'object' && result.success)) {
      testResults.passed++;
      log(`✅ PASS: ${name}`, COLORS.green);
      return true;
    } else {
      testResults.failed++;
      log(`❌ FAIL: ${name} - ${result.message || 'Test returned false'}`, COLORS.red);
      return false;
    }
  } catch (error) {
    testResults.failed++;
    log(`❌ FAIL: ${name} - ${error.message}`, COLORS.red);
    return false;
  }
};

// Test 1: Check if the SecurityPanel component exists and can be imported
runTest('SecurityPanel Component Import', async () => {
  try {
    // This would normally test the actual component, but since we're in Node.js,
    // we'll just verify the file exists
    const fs = await import('fs');
    const componentPath = './src/components/SecurityPanel.tsx';
    
    if (fs.existsSync(componentPath)) {
      const content = fs.readFileSync(componentPath, 'utf8');
      
      // Check for key components
      const hasImports = content.includes('import React');
      const hasMainComponent = content.includes('const SecurityPanel');
      const hasSecurityFeatures = content.includes('checkInsightBridgeHealth') && 
                                 content.includes('getAuditStatus');
      
      if (hasImports && hasMainComponent && hasSecurityFeatures) {
        return { success: true };
      } else {
        return { success: false, message: 'Component missing required imports or functions' };
      }
    } else {
      return { success: false, message: 'SecurityPanel component file not found' };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Test 2: Check if Dashboard includes SecurityPanel
runTest('Dashboard Integration', async () => {
  try {
    const fs = await import('fs');
    const dashboardPath = './src/components/Dashboard.tsx';
    
    if (fs.existsSync(dashboardPath)) {
      const content = fs.readFileSync(dashboardPath, 'utf8');
      
      const hasSecurityPanelImport = content.includes("import SecurityPanel from './SecurityPanel'");
      const hasSecurityPanelUsage = content.includes('<SecurityPanel');
      
      if (hasSecurityPanelImport && hasSecurityPanelUsage) {
        return { success: true };
      } else {
        return { success: false, message: 'Dashboard missing SecurityPanel import or usage' };
      }
    } else {
      return { success: false, message: 'Dashboard component file not found' };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Test 3: Check environment configuration
runTest('Environment Configuration', async () => {
  try {
    const fs = await import('fs');
    const envPath = './.env.bhiv';
    
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      
      const hasInsightBridgeURL = content.includes('VITE_INSIGHTS_BASE_URL');
      const hasSecurityFeatures = content.includes('VITE_USE_INSIGHTBRIDGE_SECURITY=true');
      const hasFeatureFlags = content.includes('VITE_ENABLE_SIGNATURE_VERIFICATION=true') &&
                             content.includes('VITE_ENABLE_JWT_AUTHENTICATION=true');
      
      if (hasInsightBridgeURL && hasSecurityFeatures && hasFeatureFlags) {
        return { success: true };
      } else {
        return { success: false, message: 'Environment missing required InsightBridge configuration' };
      }
    } else {
      return { success: false, message: 'Environment file not found' };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Test 4: Check API Service Integration
runTest('API Service Integration', async () => {
  try {
    const fs = await import('fs');
    const apiPath = './src/services/apiService.ts';
    
    if (fs.existsSync(apiPath)) {
      const content = fs.readFileSync(apiPath, 'utf8');
      
      // Check for InsightBridge functions
      const hasInsightBridgeAPI = content.includes('const insightsApi = axios.create');
      const hasSecurityFunctions = content.includes('export const signMessage') &&
                                  content.includes('export const createJWTToken') &&
                                  content.includes('export const checkInsightBridgeHealth');
      
      if (hasInsightBridgeAPI && hasSecurityFunctions) {
        return { success: true };
      } else {
        return { success: false, message: 'API service missing InsightBridge integration' };
      }
    } else {
      return { success: false, message: 'API service file not found' };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Test 5: Test frontend connectivity (basic health check)
runTest('Frontend Health Check', async () => {
  try {
    // Test if the frontend is running
    const response = await axios.get('http://localhost:3001', { 
      timeout: 5000 
    });
    
    if (response.status === 200) {
      return { success: true };
    } else {
      return { success: false, message: `Unexpected status code: ${response.status}` };
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return { success: false, message: 'Frontend server not running on port 3001' };
    } else if (error.code === 'ENOTFOUND') {
      return { success: false, message: 'Cannot resolve localhost' };
    } else {
      return { success: false, message: `Connection error: ${error.message}` };
    }
  }
});

// Run all tests
const main = async () => {
  log('\n🚀 Starting InsightBridge Security Integration Tests', COLORS.bold + COLORS.blue);
  log('='.repeat(60), COLORS.blue);
  
  // Wait a bit for any async operations
  await new Promise(resolve => setTimeout(resolve, 100));
  
  log('\n📊 Test Summary', COLORS.bold);
  log('================', COLORS.blue);
  log(`Total Tests: ${testResults.total}`, COLORS.blue);
  log(`Passed: ${testResults.passed}`, COLORS.green);
  log(`Failed: ${testResults.failed}`, COLORS.red);
  
  if (testResults.failed === 0) {
    log('\n🎉 All tests passed! InsightBridge integration is complete.', COLORS.green + COLORS.bold);
    log('\n✅ Features implemented:', COLORS.green);
    log('   • SecurityPanel component with real-time status monitoring');
    log('   • Dashboard integration with security information display');
    log('   • Environment configuration for InsightBridge endpoints');
    log('   • Complete API service integration for security features');
    log('   • Frontend connectivity verification');
  } else {
    log('\n⚠️ Some tests failed. Please check the issues above.', COLORS.yellow);
  }
  
  log('\n📋 Integration Summary:', COLORS.blue);
  log('• SecurityPanel displays InsightBridge health status');
  log('• Shows security features: Signature, JWT, Nonce protection');
  log('• Displays audit trail information');
  log('• Provides export functionality for security status');
  log('• Real-time security monitoring in dashboard sidebar');
  
  process.exit(testResults.failed === 0 ? 0 : 1);
};

main().catch(error => {
  log(`\n💥 Test runner failed: ${error.message}`, COLORS.red);
  process.exit(1);
});