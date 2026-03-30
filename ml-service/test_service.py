"""
Test script to verify the ML service is working
"""

import requests
import json
import time
import sys

def test_service_health():
    """Test the service health endpoint"""
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("✅ Service health check passed")
            print(f"   Response: {response.json()}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Service not running: {e}")
        return False

def test_categorizer_health():
    """Test the categorizer health endpoint"""
    try:
        headers = {"X-Internal-Secret": "dev-secret-change-in-production"}
        response = requests.get("http://localhost:8000/internal/ml/categorizer/health", headers=headers, timeout=5)
        if response.status_code == 200:
            print("✅ Categorizer health check passed")
            print(f"   Response: {response.json()}")
            return True
        else:
            print(f"❌ Categorizer health check failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Categorizer health check failed: {e}")
        return False

def test_api_docs():
    """Test that API docs are accessible"""
    try:
        response = requests.get("http://localhost:8000/docs", timeout=5)
        if response.status_code == 200:
            print("✅ API docs accessible")
            return True
        else:
            print(f"❌ API docs not accessible: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ API docs check failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing PeakPurse ML Service")
    print("=" * 50)
    
    # Test basic health
    if not test_service_health():
        print("\n❌ Service is not running. Start it with:")
        print("   uvicorn main:app --reload")
        return False
    
    # Test API docs
    test_api_docs()
    
    # Test categorizer health
    test_categorizer_health()
    
    print("\n" + "=" * 50)
    print("✅ Service tests completed!")
    print("\n📋 Available endpoints:")
    print("   GET  /health")
    print("   GET  /docs")
    print("   POST /internal/ml/categorize")
    print("   POST /internal/ml/categorize/batch")
    print("   GET  /internal/ml/categorizer/health")
    
    print("\n🔐 Authentication:")
    print("   Use X-Internal-Secret header with 'dev-secret-change-in-production'")
    
    print("\n📄 Example usage:")
    print("   curl -X POST http://localhost:8000/internal/ml/categorize \\")
    print("        -H 'X-Internal-Secret: dev-secret-change-in-production' \\")
    print("        -F 'file=@bank_statement.pdf'")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
