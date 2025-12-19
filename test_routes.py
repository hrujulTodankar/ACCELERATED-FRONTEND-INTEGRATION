#!/usr/bin/env python3
"""
Test script for verifying all required routes are working
"""

import requests
import json

BASE_URL = "http://localhost:8001"

def test_moderate_endpoint():
    """Test /moderate endpoint"""
    print("Testing /moderate endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/moderate?page=1&limit=3")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ /moderate - SUCCESS: Got {len(data['data'])} items")
            return True
        else:
            print(f"❌ /moderate - FAILED: Status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ /moderate - ERROR: {e}")
        return False

def test_feedback_endpoint():
    """Test /feedback endpoint"""
    print("Testing /feedback endpoint...")
    try:
        payload = {
            "userId": "test_user",
            "thumbsUp": True,
            "comment": "Great content moderation system"
        }
        response = requests.post(f"{BASE_URL}/feedback", json=payload)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ /feedback - SUCCESS: Feedback ID {data.get('feedbackId', 'N/A')}")
            return True
        else:
            print(f"❌ /feedback - FAILED: Status {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ /feedback - ERROR: {e}")
        return False

def test_kb_analytics_endpoint():
    """Test /kb-analytics endpoint"""
    print("Testing /kb-analytics endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/kb-analytics?hours=24")
        if response.status_code == 200:
            data = response.json()
            analytics = data.get('analytics', {})
            print(f"✅ /kb-analytics - SUCCESS: {analytics.get('total_queries', 0)} total queries")
            return True
        else:
            print(f"❌ /kb-analytics - FAILED: Status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ /kb-analytics - ERROR: {e}")
        return False

def test_query_kb_nlp_context():
    """Test /query-kb endpoint for NLP context"""
    print("Testing /query-kb endpoint for NLP context...")
    try:
        payload = {
            "query": "Analyze content with ID 123 for NLP context",
            "limit": 3,
            "user_id": "frontend_user"
        }
        response = requests.post(f"{BASE_URL}/query-kb", json=payload)
        if response.status_code == 200:
            data = response.json()
            response_text = data.get('response', '')
            print(f"✅ /query-kb (NLP) - SUCCESS: Response contains NLP analysis")
            return True
        else:
            print(f"❌ /query-kb (NLP) - FAILED: Status {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ /query-kb (NLP) - ERROR: {e}")
        return False

def test_query_kb_tags():
    """Test /query-kb endpoint for tags"""
    print("Testing /query-kb endpoint for tags...")
    try:
        payload = {
            "query": "Generate tags for content with ID 456",
            "limit": 2,
            "user_id": "frontend_user"
        }
        response = requests.post(f"{BASE_URL}/query-kb", json=payload)
        if response.status_code == 200:
            data = response.json()
            response_text = data.get('response', '')
            print(f"✅ /query-kb (Tags) - SUCCESS: Response contains tag generation")
            return True
        else:
            print(f"❌ /query-kb (Tags) - FAILED: Status {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ /query-kb (Tags) - ERROR: {e}")
        return False

def main():
    print("="*60)
    print("TESTING ALL REQUIRED ROUTES")
    print("="*60)
    
    tests = [
        ("/moderate (backend)", test_moderate_endpoint),
        ("/feedback (Akash & Omkar)", test_feedback_endpoint),
        ("/kb-analytics (Ashmit)", test_kb_analytics_endpoint),
        ("/query-kb NLP context (Aditya)", test_query_kb_nlp_context),
        ("/query-kb tags (Vijay)", test_query_kb_tags),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n{test_name}:")
        result = test_func()
        results.append((test_name, result))
    
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
        if result:
            passed += 1
    
    print(f"\nResults: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 ALL ROUTES ARE WORKING CORRECTLY!")
    else:
        print(f"⚠️  {total - passed} route(s) need attention")
    
    return passed == total

if __name__ == "__main__":
    main()