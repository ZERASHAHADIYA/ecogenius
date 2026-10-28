"""
Main Flask application with MongoDB integration
Comprehensive backend for Windsurf Platform
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_pymongo import PyMongo
from flask_socketio import SocketIO, emit
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import bcrypt
import jwt
from bson import ObjectId
from werkzeug.utils import secure_filename
import uuid

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configuration
app.config['MONGO_URI'] = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/windsurf')
app.config['SECRET_KEY'] = os.getenv('JWT_SECRET', 'your-secret-key-change-in-production')
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Initialize extensions
mongo = PyMongo(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Enable CORS
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "http://127.0.0.1:5173"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Create upload directories
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs('static/avatars', exist_ok=True)
os.makedirs('static/submissions', exist_ok=True)

# Helper functions
def serialize_doc(doc):
    """Convert MongoDB document to JSON serializable format"""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    if isinstance(doc, dict):
        result = {}
        for key, value in doc.items():
            if key == '_id':
                result[key] = str(value)
            elif isinstance(value, ObjectId):
                result[key] = str(value)
            elif isinstance(value, datetime):
                result[key] = value.isoformat()
            elif isinstance(value, dict):
                result[key] = serialize_doc(value)
            elif isinstance(value, list):
                result[key] = serialize_doc(value)
            else:
                result[key] = value
        return result
    return doc

def generate_token(user_id, role):
    """Generate JWT token"""
    payload = {
        'user_id': str(user_id),
        'role': role,
        'exp': datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

def verify_token(token):
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def require_auth(f):
    """Authentication decorator"""
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'No token provided'}), 401
        
        if token.startswith('Bearer '):
            token = token[7:]
        
        payload = verify_token(token)
        if not payload:
            return jsonify({'error': 'Invalid token'}), 401
        
        request.user = payload
        return f(*args, **kwargs)
    
    decorated_function.__name__ = f.__name__
    return decorated_function

def require_admin(f):
    """Admin authorization decorator"""
    def decorated_function(*args, **kwargs):
        if not hasattr(request, 'user') or request.user.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    
    decorated_function.__name__ = f.__name__
    return decorated_function

# Initialize database with default data
def init_database():
    """Initialize database with default data"""
    try:
        # Create indexes
        mongo.db.users.create_index("email", unique=True)
        mongo.db.users.create_index("role")
        mongo.db.challenges.create_index("status")
        mongo.db.posts.create_index("student_id")
        mongo.db.submissions.create_index([("student_id", 1), ("challenge_id", 1)])
        mongo.db.joined_challenges.create_index([("student_id", 1), ("challenge_id", 1)], unique=True)
        
        # Check if admin exists
        admin_exists = mongo.db.users.find_one({"role": "admin"})
        if not admin_exists:
            # Create default admin
            admin_password = bcrypt.hashpw("admin123".encode('utf-8'), bcrypt.gensalt())
            admin_user = {
                "name": "Dr. Rajesh Kumar",
                "email": "admin@sece.ac.in",
                "password": admin_password,
                "role": "admin",
                "department": "Environmental Sciences",
                "designation": "Head of Sustainability",
                "experience": "15 years",
                "specialization": "Environmental Management & Green Technologies",
                "phone": "+91 9876543210",
                "eco_points": 1000,
                "badges": ["🌱 Green Beginner", "🌿 Eco Learner", "🌾 Sustainability Hero"],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            mongo.db.users.insert_one(admin_user)
            print("✅ Default admin user created")
        
        # Create sample students if none exist
        student_count = mongo.db.users.count_documents({"role": "student"})
        if student_count == 0:
            students = [
                {
                    "name": "Priya Sharma",
                    "email": "priya.sharma@sece.ac.in",
                    "password": bcrypt.hashpw("password123".encode('utf-8'), bcrypt.gensalt()),
                    "role": "student",
                    "department": "Environmental Science",
                    "year": "3rd Year",
                    "eco_points": 320,
                    "badges": ["🌱 Green Beginner", "🌿 Eco Learner"],
                    "challenges_completed": 8,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                },
                {
                    "name": "Rahul Kumar",
                    "email": "rahul.kumar@sece.ac.in",
                    "password": bcrypt.hashpw("password123".encode('utf-8'), bcrypt.gensalt()),
                    "role": "student",
                    "department": "Computer Science",
                    "year": "2nd Year",
                    "eco_points": 285,
                    "badges": ["🌱 Green Beginner"],
                    "challenges_completed": 6,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                },
                {
                    "name": "Anita Patel",
                    "email": "anita.patel@sece.ac.in",
                    "password": bcrypt.hashpw("password123".encode('utf-8'), bcrypt.gensalt()),
                    "role": "student",
                    "department": "Business Administration",
                    "year": "4th Year",
                    "eco_points": 250,
                    "badges": ["🌱 Green Beginner", "🌿 Eco Learner"],
                    "challenges_completed": 5,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            ]
            mongo.db.users.insert_many(students)
            print("✅ Sample students created")
        
        # Create default challenges if none exist
        challenge_count = mongo.db.challenges.count_documents({})
        if challenge_count == 0:
            challenges = [
                {
                    "title": "Plastic-Free Week Challenge",
                    "description": "Eliminate single-use plastics from your daily routine for one week.",
                    "category": "Waste Reduction",
                    "difficulty": "Medium",
                    "points": 50,
                    "duration": "7 days",
                    "status": "active",
                    "requirements": [
                        "Document daily plastic usage",
                        "Find alternatives to single-use plastics",
                        "Share progress with photos"
                    ],
                    "tips": [
                        "Use reusable bags for shopping",
                        "Carry a water bottle",
                        "Choose bulk items without packaging"
                    ],
                    "participants": 45,
                    "created_by": "admin",
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                },
                {
                    "title": "Energy Conservation Week",
                    "description": "Reduce energy consumption in your dorm/home by 20%.",
                    "category": "Energy Conservation",
                    "difficulty": "Hard",
                    "points": 100,
                    "duration": "7 days",
                    "status": "active",
                    "requirements": [
                        "Track daily energy usage",
                        "Implement energy-saving measures",
                        "Document savings with proof"
                    ],
                    "tips": [
                        "Switch to LED bulbs",
                        "Unplug devices when not in use",
                        "Use natural light during day"
                    ],
                    "participants": 32,
                    "created_by": "admin",
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                },
                {
                    "title": "Campus Tree Planting",
                    "description": "Plant and maintain trees around the campus area.",
                    "category": "Green Campus Activities",
                    "difficulty": "Easy",
                    "points": 75,
                    "duration": "1 day",
                    "status": "active",
                    "requirements": [
                        "Plant at least one tree",
                        "Commit to maintenance for 1 month",
                        "Share photos of planting process"
                    ],
                    "tips": [
                        "Choose native plant species",
                        "Water regularly in first month",
                        "Coordinate with campus maintenance"
                    ],
                    "participants": 28,
                    "created_by": "admin",
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            ]
            mongo.db.challenges.insert_many(challenges)
            print("✅ Default challenges created")
        
        print("✅ Database initialization completed")
        
    except Exception as e:
        print(f"❌ Database initialization error: {e}")

# Import route modules
from routes.auth_mongo import init_auth_routes
from routes.challenges_mongo import init_challenge_routes
from routes.submissions_mongo import init_submission_routes
from routes.posts_mongo import init_posts_routes
from routes.users_mongo import init_users_routes
from routes.analytics_mongo import init_analytics_routes
from routes.uploads_mongo import init_uploads_routes

# Initialize all routes
auth_bp = init_auth_routes(app, mongo)
challenges_bp = init_challenge_routes(app, mongo)
submissions_bp = init_submission_routes(app, mongo)
posts_bp = init_posts_routes(app, mongo)
users_bp = init_users_routes(app, mongo)
analytics_bp = init_analytics_routes(app, mongo)
uploads_bp = init_uploads_routes(app, mongo)

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(challenges_bp, url_prefix='/api/challenges')
app.register_blueprint(submissions_bp, url_prefix='/api/submissions')
app.register_blueprint(posts_bp, url_prefix='/api/posts')
app.register_blueprint(users_bp, url_prefix='/api/users')
app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
app.register_blueprint(uploads_bp, url_prefix='/api/uploads')

# Routes

# Health check
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'Windsurf API is running',
        'database': 'connected' if mongo.db else 'disconnected'
    }), 200

# Feed endpoint (alias for posts)
@app.route('/api/feed', methods=['GET'])
def get_feed():
    """Get all posts for feed - alias for /api/posts"""
    try:
        # Get query parameters
        limit = int(request.args.get('limit', 20))
        skip = int(request.args.get('skip', 0))
        post_type = request.args.get('type')
        
        # Build query
        query = {}
        if post_type:
            query['post_type'] = post_type
        
        # Get posts with pagination
        posts = list(mongo.db.posts.find(query)
                    .sort('timestamp', -1)
                    .skip(skip)
                    .limit(limit))
        
        total_posts = mongo.db.posts.count_documents(query)
        
        # Serialize posts
        serialized_posts = []
        for post in posts:
            if post:
                serialized_post = {}
                for key, value in post.items():
                    if key == '_id':
                        serialized_post[key] = str(value)
                    elif isinstance(value, ObjectId):
                        serialized_post[key] = str(value)
                    elif isinstance(value, datetime):
                        serialized_post[key] = value.isoformat()
                    else:
                        serialized_post[key] = value
                serialized_posts.append(serialized_post)
        
        return jsonify({
            'posts': serialized_posts,
            'total': total_posts,
            'has_more': (skip + limit) < total_posts
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Root endpoint
@app.route('/', methods=['GET'])
def root():
    return jsonify({
        'message': 'Welcome to Windsurf - Campus Sustainability Platform API',
        'version': '2.0.0',
        'database': 'MongoDB',
        'endpoints': {
            'auth': '/api/auth',
            'challenges': '/api/challenges',
            'submissions': '/api/submissions',
            'posts': '/api/posts',
            'users': '/api/users',
            'analytics': '/api/analytics',
            'uploads': '/api/uploads'
        },
        'demo_credentials': {
            'admin': {'email': 'admin@sece.ac.in', 'password': 'admin123'},
            'student': {'email': 'priya.sharma@sece.ac.in', 'password': 'password123'}
        }
    }), 200

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({'error': 'File too large'}), 413

if __name__ == '__main__':
    with app.app_context():
        init_database()
    # Use regular Flask instead of SocketIO to avoid Windows socket issues
    app.run(debug=True, host='0.0.0.0', port=5000)
