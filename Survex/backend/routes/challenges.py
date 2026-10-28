from flask import Blueprint, request, jsonify
from simple_db import db
from config import Config
import jwt
from datetime import datetime
from models.user import users_collection
from bson import json_util
import json

challenges_bp = Blueprint('challenges', __name__)
@token_required
def get_challenges():
    """Get all challenges with optional filters"""
    status = request.args.get('status')
    category = request.args.get('category')
    
    challenges = get_all_challenges(status, category)
    return jsonify({'challenges': json.loads(json_util.dumps(challenges))}), 200

@challenges_bp.route('/<challenge_id>', methods=['GET'])
@token_required
def get_challenge(challenge_id):
    """Get a specific challenge"""
    challenge = get_challenge_by_id(challenge_id)
    
    if not challenge:
        return jsonify({'error': 'Challenge not found'}), 404
    
    return jsonify({'challenge': json.loads(json_util.dumps(challenge))}), 200

@challenges_bp.route('/', methods=['POST'])
@token_required
@role_required(['admin', 'faculty'])
def create_new_challenge():
    """Create a new challenge (admin/faculty only)"""
    data = request.get_json()
    
    required_fields = ['title', 'category', 'description', 'points', 'deadline']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    challenge = create_challenge(
        title=data['title'],
        category=data['category'],
        description=data['description'],
        points=data['points'],
        deadline=data['deadline'],
        created_by=request.user_id
    )
    
    # Send notifications to all students (optional)
    if data.get('notify_students', False):
        students = users_collection.find({'role': 'student'})
        for student in students:
            send_challenge_notification(
                student['email'],
                student['name'],
                challenge['title']
            )
    
    return jsonify({
        'message': 'Challenge created successfully',
        'challenge': json.loads(json_util.dumps(challenge))
    }), 201

@challenges_bp.route('/<challenge_id>', methods=['PUT'])
@token_required
@role_required(['admin', 'faculty'])
def update_existing_challenge(challenge_id):
    """Update a challenge (admin/faculty only)"""
    data = request.get_json()
    
    challenge = update_challenge(challenge_id, data)
    
    if not challenge:
        return jsonify({'error': 'Challenge not found'}), 404
    
    return jsonify({
        'message': 'Challenge updated successfully',
        'challenge': json.loads(json_util.dumps(challenge))
    }), 200

@challenges_bp.route('/<challenge_id>', methods=['DELETE'])
@token_required
@role_required(['admin', 'faculty'])
def delete_existing_challenge(challenge_id):
    """Delete/Archive a challenge (admin/faculty only)"""
    result = delete_challenge(challenge_id)
    
    if result:
        return jsonify({'message': 'Challenge archived successfully'}), 200
    else:
        return jsonify({'error': 'Challenge not found'}), 404

@challenges_bp.route('/<challenge_id>/join', methods=['POST'])
@token_required
def join_existing_challenge(challenge_id):
    """Join a challenge"""
    result = join_challenge(challenge_id, request.user_id)
    
    if result:
        return jsonify({'message': 'Joined challenge successfully'}), 200
    else:
        return jsonify({'error': 'Failed to join challenge'}), 400

@challenges_bp.route('/stats', methods=['GET'])
@token_required
@role_required(['admin', 'faculty'])
def get_stats():
    """Get challenge statistics (admin/faculty only)"""
    stats = get_challenge_stats()
    return jsonify({'stats': json.loads(json_util.dumps(stats))}), 200
