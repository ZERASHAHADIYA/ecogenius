from flask import Blueprint, request, jsonify
from simple_db import db
import bcrypt
import jwt
from datetime import datetime, timedelta
from config import Config

auth_bp = Blueprint('auth', __name__)

def hash_password(password):
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password, hashed):
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def generate_token(user_id):
    """Generate JWT token"""
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(days=1)
    }
    return jwt.encode(payload, Config.JWT_SECRET, algorithm='HS256')

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        required_fields = ['name', 'email', 'password', 'role']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Check if user already exists
        existing_user = db.find_one('users', {'email': data['email']})
        if existing_user:
            return jsonify({'error': 'User already exists'}), 400
        
        # Validate email domain for students
        if data['role'] == 'student' and not data['email'].endswith(Config.ALLOWED_DOMAIN):
            return jsonify({'error': f'Email must end with {Config.ALLOWED_DOMAIN}'}), 400
        
        # Create user
        user_data = {
            'name': data['name'],
            'email': data['email'],
            'password': hash_password(data['password']),
            'role': data['role'],
            'department': data.get('department', ''),
            'year': data.get('year', ''),
            'eco_points': 0,
            'badges': ['🌱 Green Beginner'],
            'followers': [],
            'following': [],
            'created_at': datetime.now().isoformat()
        }
        
        user_id = db.insert_one('users', user_data)
        
        # Generate token
        token = generate_token(user_id)
        
        # Return user data (without password)
        user_data.pop('password')
        user_data['_id'] = user_id
        
        return jsonify({
            'message': 'User registered successfully',
            'token': token,
            'user': user_data
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password required'}), 400
        
        # Find user
        user = db.find_one('users', {'email': data['email']})
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Verify password
        if not verify_password(data['password'], user['password']):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Generate token
        token = generate_token(user['_id'])
        
        # Return user data (without password)
        user.pop('password')
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': user
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    """Get current user info"""
    try:
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'No token provided'}), 401
        
        if token.startswith('Bearer '):
            token = token[7:]
        
        # Decode token
        payload = jwt.decode(token, Config.JWT_SECRET, algorithms=['HS256'])
        user_id = payload['user_id']
        
        # Find user
        user = db.find_one('users', {'_id': user_id})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Return user data (without password)
        user.pop('password', None)
        
        return jsonify({'user': user}), 200
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500
