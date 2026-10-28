"""
Authentication routes for Windsurf Platform
"""
from flask import Blueprint, request, jsonify
from flask_pymongo import PyMongo
from datetime import datetime
import bcrypt
import jwt
from bson import ObjectId
import os

auth_bp = Blueprint('auth', __name__)

def init_auth_routes(app, mongo):
    """Initialize authentication routes with app and mongo instances"""
    
    def serialize_doc(doc):
        """Convert MongoDB document to JSON serializable format"""
        if doc is None:
            return None
        if isinstance(doc, dict):
            result = {}
            for key, value in doc.items():
                if key == '_id':
                    result[key] = str(value)
                elif isinstance(value, ObjectId):
                    result[key] = str(value)
                elif isinstance(value, datetime):
                    result[key] = value.isoformat()
                else:
                    result[key] = value
            return result
        return doc
    
    def generate_token(user_id, role):
        """Generate JWT token"""
        from datetime import timedelta
        payload = {
            'user_id': str(user_id),
            'role': role,
            'exp': datetime.utcnow() + timedelta(days=7)
        }
        return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')
    
    @auth_bp.route('/register', methods=['POST'])
    def register():
        """Register a new user"""
        try:
            data = request.get_json()
            
            # Validate required fields
            required_fields = ['name', 'email', 'password', 'department']
            for field in required_fields:
                if not data.get(field):
                    return jsonify({'error': f'{field} is required'}), 400
            
            # Check if user already exists
            existing_user = mongo.db.users.find_one({'email': data['email']})
            if existing_user:
                return jsonify({'error': 'User already exists'}), 400
            
            # Hash password
            hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
            
            # Create user document
            user_doc = {
                'name': data['name'],
                'email': data['email'],
                'password': hashed_password,
                'role': data.get('role', 'student'),
                'department': data['department'],
                'year': data.get('year', '1st Year'),
                'eco_points': 0,
                'badges': [],
                'challenges_completed': 0,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            
            # Insert user
            result = mongo.db.users.insert_one(user_doc)
            user_doc['_id'] = result.inserted_id
            
            # Generate token
            token = generate_token(result.inserted_id, user_doc['role'])
            
            # Remove password from response
            user_response = serialize_doc(user_doc)
            del user_response['password']
            
            return jsonify({
                'message': 'User registered successfully',
                'user': user_response,
                'token': token
            }), 201
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @auth_bp.route('/login', methods=['POST'])
    def login():
        """Login user"""
        try:
            data = request.get_json()
            
            if not data.get('email') or not data.get('password'):
                return jsonify({'error': 'Email and password are required'}), 400
            
            # Find user
            user = mongo.db.users.find_one({'email': data['email']})
            if not user:
                return jsonify({'error': 'Invalid credentials'}), 401
            
            # Verify password
            if not bcrypt.checkpw(data['password'].encode('utf-8'), user['password']):
                return jsonify({'error': 'Invalid credentials'}), 401
            
            # Generate token
            token = generate_token(user['_id'], user['role'])
            
            # Remove password from response
            user_response = serialize_doc(user)
            del user_response['password']
            
            return jsonify({
                'message': 'Login successful',
                'user': user_response,
                'token': token
            }), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @auth_bp.route('/profile', methods=['GET'])
    def get_profile():
        """Get user profile"""
        try:
            # Get token from header
            token = request.headers.get('Authorization')
            if not token:
                return jsonify({'error': 'No token provided'}), 401
            
            if token.startswith('Bearer '):
                token = token[7:]
            
            # Verify token
            try:
                payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            except jwt.ExpiredSignatureError:
                return jsonify({'error': 'Token expired'}), 401
            except jwt.InvalidTokenError:
                return jsonify({'error': 'Invalid token'}), 401
            
            # Get user
            user = mongo.db.users.find_one({'_id': ObjectId(payload['user_id'])})
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            # Remove password from response
            user_response = serialize_doc(user)
            del user_response['password']
            
            return jsonify({'user': user_response}), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @auth_bp.route('/profile', methods=['PUT'])
    def update_profile():
        """Update user profile"""
        try:
            # Get token from header
            token = request.headers.get('Authorization')
            if not token:
                return jsonify({'error': 'No token provided'}), 401
            
            if token.startswith('Bearer '):
                token = token[7:]
            
            # Verify token
            try:
                payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            except jwt.ExpiredSignatureError:
                return jsonify({'error': 'Token expired'}), 401
            except jwt.InvalidTokenError:
                return jsonify({'error': 'Invalid token'}), 401
            
            data = request.get_json()
            
            # Update allowed fields
            allowed_fields = ['name', 'department', 'year', 'phone', 'designation', 'experience', 'specialization']
            update_data = {}
            for field in allowed_fields:
                if field in data:
                    update_data[field] = data[field]
            
            if not update_data:
                return jsonify({'error': 'No valid fields to update'}), 400
            
            update_data['updated_at'] = datetime.utcnow()
            
            # Update user
            result = mongo.db.users.update_one(
                {'_id': ObjectId(payload['user_id'])},
                {'$set': update_data}
            )
            
            if result.modified_count == 0:
                return jsonify({'error': 'User not found or no changes made'}), 404
            
            # Get updated user
            user = mongo.db.users.find_one({'_id': ObjectId(payload['user_id'])})
            user_response = serialize_doc(user)
            del user_response['password']
            
            return jsonify({
                'message': 'Profile updated successfully',
                'user': user_response
            }), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @auth_bp.route('/verify', methods=['POST'])
    def verify_token_route():
        """Verify token validity"""
        try:
            token = request.headers.get('Authorization')
            if not token:
                return jsonify({'error': 'No token provided'}), 401
            
            if token.startswith('Bearer '):
                token = token[7:]
            
            try:
                payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
                return jsonify({
                    'valid': True,
                    'user_id': payload['user_id'],
                    'role': payload['role']
                }), 200
            except jwt.ExpiredSignatureError:
                return jsonify({'valid': False, 'error': 'Token expired'}), 401
            except jwt.InvalidTokenError:
                return jsonify({'valid': False, 'error': 'Invalid token'}), 401
                
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    return auth_bp
