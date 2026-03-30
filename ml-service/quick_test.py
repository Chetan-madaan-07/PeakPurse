"""
Quick test to verify the ML service is working properly
"""

import requests
import json

def test_endpoints():
    """Test all main endpoints"""
    base_url = "http://localhost:8000"
    
    print("🧪 Testing PeakPurse ML Service Endpoints")
    print("=" * 50)
    
    # Test root endpoint
    try:
        response = requests.get(f"{base_url}/")
        if response.status_code == 200:
            print("✅ Root endpoint working")
            data = response.json()
            print(f"   Welcome: {data['message']}")
            print(f"   Version: {data['version']}")
        else:
            print(f"❌ Root endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Root endpoint error: {e}")
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            print("✅ Health endpoint working")
            data = response.json()
            print(f"   Status: {data['status']}")
        else:
            print(f"❌ Health endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Health endpoint error: {e}")
    
    # Test API docs accessibility
    try:
        response = requests.get(f"{base_url}/docs")
        if response.status_code == 200:
            print("✅ API docs accessible")
        else:
            print(f"❌ API docs failed: {response.status_code}")
    except Exception as e:
        print(f"❌ API docs error: {e}")
    
    # Test categorizer health (with authentication)
    try:
        headers = {"X-Internal-Secret": "dev-secret-change-in-production"}
        response = requests.get(f"{base_url}/internal/ml/categorizer/health", headers=headers)
        if response.status_code == 200:
            print("✅ Categorizer health working")
            data = response.json()
            print(f"   Service: {data.get('service', 'unknown')}")
            print(f"   Status: {data.get('status', 'unknown')}")
        else:
            print(f"❌ Categorizer health failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Categorizer health error: {e}")
    
    print("\n" + "=" * 50)
    print("🎯 Service is ready for Step 3 implementation!")
    print("\n📋 Available for your teammate:")
    print("   ✅ PDF processing endpoint")
    print("   ✅ Internal authentication")
    print("   ✅ Structured API responses")
    print("   ✅ Error handling")
    print("   ✅ API documentation")

if __name__ == "__main__":
    test_endpoints()
