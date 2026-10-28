"""
Simple startup script for Windsurf Platform - No dependencies required
Use this when you want to quickly test the platform without setting up MongoDB
"""
import os
import sys

def check_basic_dependencies():
    """Check if Flask is installed"""
    try:
        import flask
        import flask_cors
        print("✅ Flask and Flask-CORS are available")
        return True
    except ImportError as e:
        print(f"❌ Missing required package: {e}")
        print("📦 Install with: pip install flask flask-cors")
        return False

def start_simple_server():
    """Start the simple server without MongoDB"""
    print("🚀 Starting Windsurf Platform Simple Server...")
    print("=" * 60)
    print("🔧 Mode: Simple (No Database Required)")
    print("📦 Storage: In-Memory")
    print("🌐 Port: 5000")
    print("🔗 Frontend: http://localhost:3000")
    print("📚 API: http://localhost:5000")
    print("❤️  Health Check: http://localhost:5000/health")
    print("=" * 60)
    
    if not check_basic_dependencies():
        print("\n❌ Cannot start server - missing dependencies")
        print("💡 Install with: pip install flask flask-cors")
        sys.exit(1)
    
    print("\n👤 Demo Login Options:")
    print("   🎓 Student: Click 'Student Login' button")
    print("   👨‍💼 Admin: Click 'Admin Login' button")
    print("   📧 Any email works for demo purposes")
    
    print("\n🌟 Server starting... Press Ctrl+C to stop")
    print("🔄 Auto-reload enabled for development")
    
    try:
        # Import and run the simple server
        from simple_server import app, init_demo_data
        
        # Initialize demo data
        init_demo_data()
        
        # Start the server
        app.run(debug=True, host='0.0.0.0', port=5000)
        
    except KeyboardInterrupt:
        print("\n\n🛑 Server stopped by user")
        print("👋 Thanks for using Windsurf Platform!")
    except Exception as e:
        print(f"\n❌ Server error: {e}")
        print("💡 Try: python simple_server.py")
        sys.exit(1)

if __name__ == '__main__':
    start_simple_server()
