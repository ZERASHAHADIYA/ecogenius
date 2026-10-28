"""
Test MongoDB connection and basic API functionality
"""
import requests
import json
from pymongo import MongoClient
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_mongodb_connection():
    """Test MongoDB connection"""
    try:
        mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/windsurf')
        client = MongoClient(mongodb_uri, serverSelectionTimeoutMS=5000)
        
        # Test connection
        client.server_info()
        print("✅ MongoDB connection successful")
        
        # Test database access
        db = client.get_default_database()
        collections = db.list_collection_names()
        print(f"📊 Available collections: {collections}")
        
        return True
        
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        return False

def test_api_endpoints():
    """Test basic API endpoints"""
    base_url = "http://localhost:5000"
    
    print("\n🧪 Testing API Endpoints...")
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Health endpoint working")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Health endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Health endpoint error: {e}")
    
    # Test root endpoint
    try:
        response = requests.get(f"{base_url}/", timeout=5)
        if response.status_code == 200:
            print("✅ Root endpoint working")
            data = response.json()
            print(f"   API Version: {data.get('version')}")
            print(f"   Database: {data.get('database')}")
        else:
            print(f"❌ Root endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Root endpoint error: {e}")

def test_authentication():
    """Test authentication endpoints"""
    base_url = "http://localhost:5000/api/auth"
    
    print("\n🔐 Testing Authentication...")
    
    # Test login with demo credentials
    login_data = {
        "email": "admin@sece.ac.in",
        "password": "admin123"
    }
    
    try:
        response = requests.post(f"{base_url}/login", 
                               json=login_data, 
                               timeout=5)
        
        if response.status_code == 200:
            print("✅ Admin login successful")
            data = response.json()
            token = data.get('token')
            user = data.get('user')
            print(f"   User: {user.get('name')} ({user.get('role')})")
            return token
        else:
            print(f"❌ Admin login failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None

def test_protected_endpoint(token):
    """Test protected endpoint with token"""
    if not token:
        print("⚠️  Skipping protected endpoint test (no token)")
        return
    
    print("\n🛡️  Testing Protected Endpoints...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test profile endpoint
    try:
        response = requests.get("http://localhost:5000/api/auth/profile", 
                              headers=headers, 
                              timeout=5)
        
        if response.status_code == 200:
            print("✅ Protected profile endpoint working")
            user = response.json().get('user')
            print(f"   Profile: {user.get('name')} - {user.get('email')}")
        else:
            print(f"❌ Protected endpoint failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Protected endpoint error: {e}")

def test_challenges_endpoint(token):
    """Test challenges endpoint"""
    if not token:
        print("⚠️  Skipping challenges test (no token)")
        return
    
    print("\n🎯 Testing Challenges Endpoints...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get("http://localhost:5000/api/challenges/", 
                              headers=headers, 
                              timeout=5)
        
        if response.status_code == 200:
            print("✅ Challenges endpoint working")
            data = response.json()
            challenges = data.get('challenges', [])
            print(f"   Found {len(challenges)} challenges")
            
            if challenges:
                challenge = challenges[0]
                print(f"   Sample: {challenge.get('title')} ({challenge.get('points')} points)")
        else:
            print(f"❌ Challenges endpoint failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Challenges endpoint error: {e}")

def main():
    """Run all tests"""
    print("🧪 Windsurf Platform Backend Tests")
    print("=" * 40)
    
    # Test MongoDB connection
    if not test_mongodb_connection():
        print("\n❌ Cannot proceed without MongoDB connection")
        return
    
    # Test basic API endpoints
    test_api_endpoints()
    
    # Test authentication
    token = test_authentication()
    
    # Test protected endpoints
    test_protected_endpoint(token)
    
    # Test challenges endpoint
    test_challenges_endpoint(token)
    
    print("\n" + "=" * 40)
    print("🎉 Test suite completed!")
    print("\n📋 Next Steps:")
    print("   1. Start the backend server: python start_server.py")
    print("   2. Start the frontend development server")
    print("   3. Test the full application integration")
    print("   4. Check admin dashboard functionality")

if __name__ == "__main__":
    main()
