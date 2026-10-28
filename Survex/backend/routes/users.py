from flask import Blueprint, request, jsonify
from models.user import (
    get_user_by_id, update_user_profile, follow_user, unfollow_user, users_collection
)
from models.submission import get_student_submission_count
from utils.jwt_helper import token_required
from utils.file_upload import upload_file, allowed_file
from bson import json_util
import json

users_bp = Blueprint('users', __name__)

@users_bp.route('/<user_id>', methods=['GET'])
@token_required
def get_user(user_id):
    """Get user profile"""
    user = get_user_by_id(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Get additional stats
    completed_challenges = get_student_submission_count(user_id)
    
    user_data = json.loads(json_util.dumps(user))
    user_data.pop('password_hash', None)
    user_data['completed_challenges'] = completed_challenges
    
    return jsonify({'user': user_data}), 200

@users_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile():
    """Update current user's profile"""
    updates = {}
    
    # Handle file upload for avatar
    if 'avatar' in request.files:
        file = request.files['avatar']
        if file and file.filename and allowed_file(file.filename):
            try:
                avatar_url = upload_file(file, folder='avatars')
                updates['avatar_url'] = avatar_url
            except Exception as e:
                return jsonify({'error': str(e)}), 500
    
    # Handle JSON data
    if request.is_json:
        data = request.get_json()
    else:
        data = request.form.to_dict()
    
    # Allowed fields to update
    allowed_fields = ['name', 'department', 'year']
    for field in allowed_fields:
        if field in data:
            updates[field] = data[field]
    
    if not updates:
        return jsonify({'error': 'No valid fields to update'}), 400
    
    user = update_user_profile(request.user_id, updates)
    
    user_data = json.loads(json_util.dumps(user))
    user_data.pop('password_hash', None)
    
    return jsonify({
        'message': 'Profile updated successfully',
        'user': user_data
    }), 200

@users_bp.route('/<user_id>/follow', methods=['POST'])
@token_required
def follow(user_id):
    """Follow a user"""
    if user_id == request.user_id:
        return jsonify({'error': 'Cannot follow yourself'}), 400
    
    follow_user(request.user_id, user_id)
    
    return jsonify({'message': 'User followed successfully'}), 200

@users_bp.route('/<user_id>/unfollow', methods=['POST'])
@token_required
def unfollow(user_id):
    """Unfollow a user"""
    unfollow_user(request.user_id, user_id)
    
    return jsonify({'message': 'User unfollowed successfully'}), 200

@users_bp.route('/search', methods=['GET'])
@token_required
def search_users():
    """Search users by name or email"""
    query = request.args.get('q', '')
    
    if not query:
        return jsonify({'users': []}), 200
    
    # Search by name or email (case-insensitive)
    users = list(users_collection.find({
        '$or': [
            {'name': {'$regex': query, '$options': 'i'}},
            {'email': {'$regex': query, '$options': 'i'}}
        ],
        'role': 'student'
    }).limit(20))
    
    # Remove sensitive data
    for user in users:
        user.pop('password_hash', None)
    
    return jsonify({'users': json.loads(json_util.dumps(users))}), 200
