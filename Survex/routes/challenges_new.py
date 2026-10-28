from flask import Blueprint, request, jsonify
from simple_db import db
from config import Config
import jwt
from datetime import datetime

challenges_bp = Blueprint('challenges', __name__)

def get_user_from_token():
    """Extract user from JWT token"""
    try:
        token = request.headers.get('Authorization')
        if token and token.startswith('Bearer '):
            token = token[7:]
            payload = jwt.decode(token, Config.JWT_SECRET, algorithms=['HS256'])
            return db.find_one('users', {'_id': payload['user_id']})
    except:
        pass
    return None

@challenges_bp.route('', methods=['GET'])
def get_challenges():
    """Get all active challenges"""
    try:
        challenges = db.find('challenges', {'status': 'active'})
        return jsonify({'challenges': challenges}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@challenges_bp.route('/<challenge_id>', methods=['GET'])
def get_challenge(challenge_id):
    """Get specific challenge"""
    try:
        challenge = db.find_one('challenges', {'_id': challenge_id})
        if not challenge:
            return jsonify({'error': 'Challenge not found'}), 404
        return jsonify({'challenge': challenge}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@challenges_bp.route('', methods=['POST'])
def create_challenge():
    """Create new challenge (admin/faculty only)"""
    try:
        user = get_user_from_token()
        if not user or user['role'] not in ['admin', 'faculty']:
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        required_fields = ['title', 'description', 'category', 'points']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        challenge_data = {
            'title': data['title'],
            'description': data['description'],
            'category': data['category'],
            'points': data['points'],
            'status': 'active',
            'created_by': user['_id'],
            'created_at': datetime.now().isoformat(),
            'deadline': data.get('deadline'),
            'participants': []
        }
        
        challenge_id = db.insert_one('challenges', challenge_data)
        challenge_data['_id'] = challenge_id
        
        return jsonify({
            'message': 'Challenge created successfully',
            'challenge': challenge_data
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@challenges_bp.route('/<challenge_id>/join', methods=['POST'])
def join_challenge(challenge_id):
    """Join a challenge (students only)"""
    try:
        user = get_user_from_token()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        
        if user['role'] != 'student':
            return jsonify({'error': 'Only students can join challenges'}), 403
        
        challenge = db.find_one('challenges', {'_id': challenge_id})
        if not challenge:
            return jsonify({'error': 'Challenge not found'}), 404
        
        # Check if already joined
        participants = challenge.get('participants', [])
        if user['_id'] in participants:
            return jsonify({'error': 'Already joined this challenge'}), 400
        
        # Add user to participants
        participants.append(user['_id'])
        db.update_one('challenges', {'_id': challenge_id}, {'$set': {'participants': participants}})
        
        return jsonify({'message': 'Successfully joined challenge'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@challenges_bp.route('/<challenge_id>/submit', methods=['POST'])
def submit_challenge(challenge_id):
    """Submit challenge completion"""
    try:
        user = get_user_from_token()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        
        challenge = db.find_one('challenges', {'_id': challenge_id})
        if not challenge:
            return jsonify({'error': 'Challenge not found'}), 404
        
        data = request.get_json()
        
        # Create submission
        submission_data = {
            'challenge_id': challenge_id,
            'student_id': user['_id'],
            'student': {'name': user['name'], 'department': user['department']},
            'caption': data.get('caption', ''),
            'media_url': data.get('media_url'),
            'verification_status': 'pending',
            'timestamp': datetime.now().isoformat()
        }
        
        submission_id = db.insert_one('submissions', submission_data)
        
        return jsonify({
            'message': 'Submission created successfully',
            'submission_id': submission_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
