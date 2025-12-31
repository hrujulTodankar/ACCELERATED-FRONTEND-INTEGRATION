#!/usr/bin/env python3
"""
Comprehensive Integration Test for Adaptive Tags with BHIV Core
"""

import asyncio
import json
import time
import aiohttp
from typing import Dict, Any, List

class AdaptiveTagsIntegrationTester:
    def __init__(self):
        self.bhiv_base_url = "http://localhost:8001"
        self.adaptive_tags_base_url = "http://localhost:8000"
        self.test_results = {
            "timestamp": time.time(),
            "tests_run": 0,
            "tests_passed": 0,
            "tests_failed": 0,
            "test_details": []
        }

    def log_test(self, test_name: str, status: str, details: str = "", response_data: Dict = None):
        """Log test results"""
        test_result = {
            "test_name": test_name,
            "status": status,
            "details": details,
            "response_data": response_data,
            "timestamp": time.time()
        }
        self.test_results["test_details"].append(test_result)
        self.test_results["tests_run"] += 1
        
        if status == "PASS":
            self.test_results["tests_passed"] += 1
        else:
            self.test_results["tests_failed"] += 1
            
        print(f"[{status}] {test_name}: {details}")

    async def test_bhiv_core_health(self, session: aiohttp.ClientSession):
        """Test BHIV Core service health"""
        try:
            async with session.get(f"{self.bhiv_base_url}/health") as response:
                if response.status == 200:
                    data = await response.json()
                    self.log_test("BHIV Core Health", "PASS", "Service is healthy", data)
                    return True
                else:
                    self.log_test("BHIV Core Health", "FAIL", f"Status: {response.status}")
                    return False
        except Exception as e:
            self.log_test("BHIV Core Health", "FAIL", f"Connection error: {str(e)}")
            return False

    async def test_adaptive_tags_health(self, session: aiohttp.ClientSession):
        """Test Adaptive Tags service health"""
        try:
            async with session.get(f"{self.adaptive_tags_base_url}/health") as response:
                if response.status == 200:
                    data = await response.json()
                    self.log_test("Adaptive Tags Health", "PASS", "Service is healthy", data)
                    return True
                else:
                    self.log_test("Adaptive Tags Health", "FAIL", f"Status: {response.status}")
                    return False
        except Exception as e:
            self.log_test("Adaptive Tags Health", "FAIL", f"Connection error: {str(e)}")
            return False

    async def test_adaptive_tags_thresholds(self, session: aiohttp.ClientSession):
        """Test adaptive tags thresholds endpoint"""
        try:
            # Add API key header
            headers = {'X-API-Key': 'ADAPTIVE123'}
            async with session.get(f"{self.adaptive_tags_base_url}/thresholds", headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    self.log_test("Adaptive Tags Thresholds", "PASS", "Thresholds retrieved", data)
                    return True
                else:
                    self.log_test("Adaptive Tags Thresholds", "FAIL", f"Status: {response.status}")
                    return False
        except Exception as e:
            self.log_test("Adaptive Tags Thresholds", "FAIL", f"Error: {str(e)}")
            return False

    async def test_bhiv_core_endpoints(self, session: aiohttp.ClientSession):
        """Test BHIV Core main endpoints"""
        try:
            # Test main API endpoint
            async with session.get(f"{self.bhiv_base_url}/") as response:
                if response.status == 200:
                    data = await response.json()
                    self.log_test("BHIV Core API", "PASS", "API endpoint working", data)
                    return True
                else:
                    self.log_test("BHIV Core API", "FAIL", f"Status: {response.status}")
                    return False
        except Exception as e:
            self.log_test("BHIV Core API", "FAIL", f"Error: {str(e)}")
            return False

    async def test_integration_flow(self, session: aiohttp.ClientSession):
        """Test integration flow between services"""
        try:
            # First get adaptive tags health
            async with session.get(f"{self.adaptive_tags_base_url}/healthz") as adaptive_response:
                if adaptive_response.status != 200:
                    self.log_test("Integration Flow", "FAIL", "Adaptive tags health failed")
                    return False
                
                adaptive_data = await adaptive_response.json()
                
                # Then get BHIV Core health
                async with session.get(f"{self.bhiv_base_url}/health") as bhiv_response:
                    if bhiv_response.status != 200:
                        self.log_test("Integration Flow", "FAIL", "BHIV Core health failed")
                        return False
                    
                    bhiv_data = await bhiv_response.json()
                    
                    # Check if both services are healthy
                    if adaptive_data.get("status") == "ok" and bhiv_data.get("status") == "healthy":
                        self.log_test("Integration Flow", "PASS", "Both services healthy", {
                            "adaptive_tags": adaptive_data,
                            "bhiv_core": bhiv_data
                        })
                        return True
                    else:
                        self.log_test("Integration Flow", "FAIL", "Services not fully healthy", {
                            "adaptive_tags": adaptive_data,
                            "bhiv_core": bhiv_data
                        })
                        return False
                        
        except Exception as e:
            self.log_test("Integration Flow", "FAIL", f"Error: {str(e)}")
            return False

    async def run_comprehensive_tests(self):
        """Run all integration tests"""
        print("Starting Comprehensive Integration Tests...")
        print("=" * 50)
        
        async with aiohttp.ClientSession() as session:
            # Test service health
            await self.test_bhiv_core_health(session)
            await self.test_adaptive_tags_health(session)
            
            # Test BHIV Core endpoints
            await self.test_bhiv_core_endpoints(session)
            
            # Test Adaptive Tags endpoints
            await self.test_adaptive_tags_thresholds(session)
            
            # Test integration
            await self.test_integration_flow(session)
            
        # Print summary
        print("\n" + "=" * 50)
        print("TEST SUMMARY")
        print("=" * 50)
        print(f"Total Tests: {self.test_results['tests_run']}")
        print(f"Passed: {self.test_results['tests_passed']}")
        print(f"Failed: {self.test_results['tests_failed']}")
        print(f"Success Rate: {(self.test_results['tests_passed'] / self.test_results['tests_run'] * 100):.1f}%")
        
        # Save results to file
        with open(f"integration_test_results_{int(time.time())}.json", "w") as f:
            json.dump(self.test_results, f, indent=2)
        
        return self.test_results

async def main():
    """Main test runner"""
    tester = AdaptiveTagsIntegrationTester()
    await tester.run_comprehensive_tests()

if __name__ == "__main__":
    asyncio.run(main())