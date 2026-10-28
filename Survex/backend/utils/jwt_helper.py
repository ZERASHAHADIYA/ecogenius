import jwt
import datetime
from functools import wraps
from flask import request, jsonify
from config import Config

def generate_token(user_id, role):
    """Generate JWT token for user"""
    payload = {
        'user_id': str(user_id),
        'role': role,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(seconds=Config.JWT_EXPIRATION),
        'iat': datetime.datetime.utcnow()
    }
    return jwt.encode(payload, Config.JWT_SECRET, algorithm='HS256')

def decode_token(token):
    """Decode JWT token"""
    try:
        payload = jwt.decode(token, Config.JWT_SECRET, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def token_required(f):
    """Decorator to require JWT token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(' ')[1]  # Bearer <token>
            except IndexError:
                return jsonify({'error': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        payload = decode_token(token)
        if not payload:
            return jsonify({'error': 'Token is invalid or expired'}), 401
        
        request.user_id = payload['user_id']
        request.user_role = payload['role']
        
        return f(*args, **kwargs)
    
    return decorated

def role_required(allowed_roles):
    """Decorator to require specific roles"""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if not hasattr(request, 'user_role'):
                return jsonify({'error': 'Unauthorized'}), 401
            
            if request.user_role not in allowed_roles:
                return jsonify({'error': 'Insufficient permissions'}), 403
            
            return f(*args, **kwargs)
        
        return decorated
    return decorator
