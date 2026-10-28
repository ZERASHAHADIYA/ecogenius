"""
Quick Setup and Run Script for Windsurf MongoDB Backend
"""
import subprocess
import sys
import os
from dotenv import load_dotenv

def run_command(command, description):
    """Run a command and show the result"""
    print(f"\n🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ {description} successful")
            if result.stdout:
                print(f"   Output: {result.stdout.strip()}")
        else:
            print(f"❌ {description} failed")
            print(f"   Error: {result.stderr.strip()}")
        return result.returncode == 0
    except Exception as e:
        print(f"❌ {description} error: {e}")
        return False

def check_mongodb():
    """Check if MongoDB is running"""
    try:
        from pymongo import MongoClient
        load_dotenv()
        
        mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/windsurf')
        client = MongoClient(mongodb_uri, serverSelectionTimeoutMS=3000)
        client.server_info()
        print("✅ MongoDB is running and accessible")
        return True
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        print("\n🔧 To fix MongoDB issues:")
        print("   1. Install MongoDB Community Server")
        print("   2. Start MongoDB service:")
        print("      Windows: net start MongoDB")
        print("      Mac/Linux: sudo systemctl start mongod")
        return False

def main():
    print("🌿 Windsurf Platform - MongoDB Backend Setup")
    print("=" * 50)
    
    # Step 1: Install/upgrade dependencies
    if not run_command("pip install -r requirements.txt --upgrade", "Installing dependencies"):
        print("\n❌ Dependency installation failed. Please run manually:")
        print("   pip install -r requirements.txt --upgrade")
        return
    
    # Step 2: Check MongoDB
    if not check_mongodb():
        print("\n⚠️  MongoDB is not running. Please start MongoDB first.")
        return
    
    # Step 3: Start the server
    print("\n🚀 Starting Windsurf MongoDB Backend...")
    print("   Server will run on: http://localhost:5000")
    print("   MongoDB Compass URL: mongodb://localhost:27017/windsurf")
    print("\n📧 Demo Credentials:")
    print("   Admin: admin@sece.ac.in / admin123")
    print("   Student: priya.sharma@sece.ac.in / password123")
    print("\n" + "=" * 50)
    print("🌟 Press Ctrl+C to stop the server")
    print("=" * 50)
    
    # Import and run the MongoDB app
    try:
        from app_mongo import app, socketio, init_database
        
        with app.app_context():
            init_database()
        
        socketio.run(app, debug=True, host='0.0.0.0', port=5000)
        
    except KeyboardInterrupt:
        print("\n\n🛑 Server stopped by user")
    except Exception as e:
        print(f"\n❌ Server error: {e}")
        print("\n🔧 Troubleshooting:")
        print("   1. Check if all dependencies are installed")
        print("   2. Verify MongoDB is running")
        print("   3. Check .env file configuration")

if __name__ == "__main__":
    main()
