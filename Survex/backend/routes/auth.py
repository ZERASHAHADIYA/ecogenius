from flask import Blueprint, request, jsonify
from simple_db import db
from config import Config
import bcrypt
import jwt
from datetime import datetime, timedelta

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

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.get_json() or {}
        email = (data.get('email') or '').strip().lower()
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400
        
        # Find user (case-insensitive email matching)
        users = db.find('users')
        user = next((u for u in users if (u.get('email') or '').lower() == email), None)
        
        if not user or not user.get('password'):
            return jsonify({'error': 'Invalid credentials. Please verify your email and password.'}), 401
        
        # Verify password
        if not verify_password(password, user['password']):
            return jsonify({'error': 'Invalid credentials. Please verify your email and password.'}), 401
        
        # Generate token
        token = generate_token(user['_id'])
        
        # Return user data (without mutating stored password in memory)
        clean_user = {k: v for k, v in user.items() if k != 'password'}
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': clean_user
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Authentication failed: {str(e)}'}), 500

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json() or {}
        
        required_fields = ['name', 'email', 'password', 'role']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields: name, email, password, and role'}), 400
        
        email = data['email'].strip().lower()
        
        # Check if user already exists
        users = db.find('users')
        existing_user = next((u for u in users if (u.get('email') or '').lower() == email), None)
        if existing_user:
            return jsonify({'error': 'An account with this email already exists. Please sign in.'}), 400
        
        # Create user
        user_data = {
            'name': data['name'].strip(),
            'email': email,
            'password': hash_password(data['password']),
            'role': data['role'],
            'department': data.get('department', 'Engineering'),
            'year': data.get('year', '1st Year'),
            'eco_points': 50 if data['role'] == 'student' else 1000,
            'badges': ['🌱 Green Beginner'],
            'followers': [],
            'following': [],
            'created_at': datetime.now().isoformat()
        }
        
        user_id = db.insert_one('users', user_data)
        
        # Generate token
        token = generate_token(user_id)
        
        # Return clean user copy without password
        clean_user = {k: v for k, v in user_data.items() if k != 'password'}
        clean_user['_id'] = user_id
        
        return jsonify({
            'message': 'User registered successfully',
            'token': token,
            'user': clean_user
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500

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
