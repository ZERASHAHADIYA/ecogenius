"""
Quick MongoDB Connection Check
"""
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

def check_mongodb():
    try:
        # Connect to MongoDB
        mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/windsurf')
        client = MongoClient(mongodb_uri, serverSelectionTimeoutMS=5000)
        
        # Test connection
        client.server_info()
        print("✅ MongoDB connection successful!")
        
        # Check database
        db = client.get_default_database()
        collections = db.list_collection_names()
        print(f"📊 Collections found: {collections}")
        
        # Check if we have data
        if 'users' in collections:
            user_count = db.users.count_documents({})
            print(f"👥 Users in database: {user_count}")
        
        if 'challenges' in collections:
            challenge_count = db.challenges.count_documents({})
            print(f"🎯 Challenges in database: {challenge_count}")
        
        if 'posts' in collections:
            post_count = db.posts.count_documents({})
            print(f"📝 Posts in database: {post_count}")
        
        print(f"\n🔗 MongoDB Compass URL: {mongodb_uri}")
        return True
        
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        print("\n🔧 Solutions:")
        print("1. Make sure MongoDB is running:")
        print("   - Windows: net start MongoDB")
        print("   - Mac/Linux: sudo systemctl start mongod")
        print("2. Check if MongoDB is installed")
        print("3. Verify connection string in .env file")
        return False

if __name__ == "__main__":
    print("🧪 Checking MongoDB Connection...")
    print("=" * 40)
    check_mongodb()
