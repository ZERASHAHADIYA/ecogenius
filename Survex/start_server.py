"""
Windsurf Platform Backend Server Startup Script
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def check_dependencies():
    """Check if all required dependencies are installed"""
    required_packages = [
        'flask', 'flask_cors', 'flask_pymongo', 'pymongo', 
        'bcrypt', 'PyJWT', 'Pillow', 'python-dotenv', 'flask-socketio'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_').replace('_', '').lower())
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print("❌ Missing required packages:")
        for package in missing_packages:
            print(f"   - {package}")
        print("\n📦 Install missing packages with:")
        print("   pip install -r requirements.txt")
        return False
    
    print("✅ All dependencies are installed")
    return True

def check_mongodb_connection():
    """Check MongoDB connection"""
    try:
        from pymongo import MongoClient
        
        mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/windsurf')
        client = MongoClient(mongodb_uri, serverSelectionTimeoutMS=5000)
        
        # Test connection
        client.server_info()
        print(f"✅ MongoDB connection successful: {mongodb_uri}")
        return True
        
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        print("\n🔧 MongoDB Setup Instructions:")
        print("   1. Install MongoDB Community Server")
        print("   2. Start MongoDB service")
        print("   3. Update MONGODB_URI in .env file if needed")
        return False

def create_directories():
    """Create necessary directories"""
    directories = [
        'static/uploads',
        'static/avatars', 
        'static/posts',
        'static/submissions'
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        print(f"✅ Created directory: {directory}")

def check_environment():
    """Check environment configuration"""
    required_env_vars = ['JWT_SECRET', 'MONGODB_URI']
    missing_vars = []
    
    for var in required_env_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print("⚠️  Missing environment variables:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\n📝 Create a .env file with required variables")
        print("   (See .env.example for reference)")
    else:
        print("✅ Environment variables configured")
    
    return len(missing_vars) == 0

def start_server():
    """Start the Windsurf backend server"""
    print("🚀 Starting Windsurf Platform Backend Server...")
    print("=" * 50)
    
    # Check all prerequisites
    if not check_dependencies():
        sys.exit(1)
    
    if not check_environment():
        print("⚠️  Some environment variables are missing, using defaults")
    
    if not check_mongodb_connection():
        print("❌ Cannot start server without MongoDB connection")
        sys.exit(1)
    
    create_directories()
    
    print("\n🌱 Windsurf Platform Backend")
    print("   Version: 2.0.0")
    print("   Database: MongoDB")
    print("   Port: 5000")
    print("   Environment: Development")
    
    print("\n📚 API Documentation:")
    print("   Root: http://localhost:5000")
    print("   Health: http://localhost:5000/health")
    print("   Auth: http://localhost:5000/api/auth")
    print("   Challenges: http://localhost:5000/api/challenges")
    print("   Posts: http://localhost:5000/api/posts")
    print("   Users: http://localhost:5000/api/users")
    print("   Analytics: http://localhost:5000/api/analytics")
    
    print("\n👤 Demo Credentials:")
    print("   Admin: admin@sece.ac.in / admin123")
    print("   Student: priya.sharma@sece.ac.in / password123")
    
    print("\n" + "=" * 50)
    print("🌟 Server starting... Press Ctrl+C to stop")
    
    # Import and run the main app
    try:
        from app_mongo import app, socketio, init_database
        
        with app.app_context():
            init_database()
        
        socketio.run(app, debug=True, host='0.0.0.0', port=5000)
        
    except KeyboardInterrupt:
        print("\n\n🛑 Server stopped by user")
    except Exception as e:
        print(f"\n❌ Server error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    start_server()
