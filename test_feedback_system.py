#!/usr/bin/env python3
"""
Test script to verify the feedback system is working properly
"""
import requests
import json

def test_feedback_endpoint():
    """Test the /feedback endpoint with proper format"""
    
    url = "http://localhost:8001/feedback"
    
    # Test data that matches what the backend expects
    test_data = {
        "moderationId": "mod_123",
        "feedback": "This content should be approved",
        "userId": "user_456"
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        print("Testing /feedback endpoint...")
        print(f"URL: {url}")
        print(f"Data: {json.dumps(test_data, indent=2)}")
        
        response = requests.post(url, json=test_data, headers=headers)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Feedback endpoint working correctly!")
            print(f"✅ Success: {result.get('success')}")
            print(f"✅ Feedback ID: {result.get('feedbackId')}")
            print(f"✅ Confidence: {result.get('confidence')}")
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"❌ Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Exception occurred: {e}")

def test_frontend_feedback_format():
    """Test what the frontend would send vs what backend expects"""
    
    # This is what the frontend FeedbackResponse type contains
    frontend_feedback = {
        "thumbsUp": True,
        "comment": "This content looks good",
        "userId": "user_123"
    }
    
    # This is what the backend expects
    backend_feedback = {
        "moderationId": "general_feedback",
        "feedback": "This content looks good",
        "userId": "user_123"
    }
    
    print("\n" + "="*50)
    print("FEEDBACK FORMAT COMPARISON")
    print("="*50)
    print("Frontend sends:")
    print(json.dumps(frontend_feedback, indent=2))
    print("\nBackend expects:")
    print(json.dumps(backend_feedback, indent=2))
    print("\nTransformation needed:")
    print("- frontend.thumbsUp -> backend.feedback (converted to text)")
    print("- frontend.comment -> backend.feedback")
    print("- Add backend.moderationId (new field)")
    print("="*50)

if __name__ == "__main__":
    test_feedback_endpoint()
    test_frontend_feedback_format()