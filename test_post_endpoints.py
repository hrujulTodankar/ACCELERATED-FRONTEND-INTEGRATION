#!/usr/bin/env python3
import requests
import json

# Test /query-kb endpoint
print("Testing /query-kb endpoint...")
try:
    payload = {
        "query": "Analyze content with ID 123 for NLP context",
        "limit": 3,
        "user_id": "frontend_user"
    }
    response = requests.post("http://localhost:8001/query-kb", json=payload)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print("✅ /query-kb SUCCESS")
        print(f"Response: {data.get('response', '')[:100]}...")
    else:
        print(f"❌ /query-kb FAILED: {response.text}")
except Exception as e:
    print(f"❌ /query-kb ERROR: {e}")

# Test /feedback endpoint
print("\nTesting /feedback endpoint...")
try:
    payload = {
        "userId": "test_user",
        "thumbsUp": True,
        "comment": "Great system"
    }
    response = requests.post("http://localhost:8001/feedback", json=payload)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print("✅ /feedback SUCCESS")
        print(f"Feedback ID: {data.get('feedbackId', 'N/A')}")
    else:
        print(f"❌ /feedback FAILED: {response.text}")
except Exception as e:
    print(f"❌ /feedback ERROR: {e}")