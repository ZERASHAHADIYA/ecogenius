from flask import Blueprint, request, jsonify
from models.post import (
    create_post, get_post_by_id, get_all_posts, get_trending_posts,
    like_post, add_comment, share_post, delete_post, get_posts_by_department
)
from models.user import get_user_by_id
from utils.jwt_helper import token_required
from utils.file_upload import upload_file, allowed_file
from bson import json_util
import json

feed_bp = Blueprint('feed', __name__)

@feed_bp.route('/', methods=['GET'])
@token_required
def get_feed():
    """Get social feed with pagination and filters"""
    limit = int(request.args.get('limit', 50))
    skip = int(request.args.get('skip', 0))
    filter_type = request.args.get('filter', 'recent')  # recent, trending, department
    department = request.args.get('department')
    
    if filter_type == 'trending':
        posts = get_trending_posts(limit)
    elif filter_type == 'department' and department:
        posts = get_posts_by_department(department, limit)
    else:
        posts = get_all_posts(limit, skip)
    
    # Enrich posts with user data
    enriched_posts = []
    for post in posts:
        user = get_user_by_id(post['student_id'])
        post_data = json.loads(json_util.dumps(post))
        post_data['author'] = {
            'name': user['name'],
            'avatar_url': user.get('avatar_url'),
            'eco_points': user.get('eco_points', 0),
            'badges': user.get('badges', [])
        } if user else None
        enriched_posts.append(post_data)
    
    return jsonify({'posts': enriched_posts}), 200

@feed_bp.route('/', methods=['POST'])
@token_required
def create_new_post():
    """Create a new post"""
    media_url = None
    
    # Handle file upload if present
    if 'file' in request.files:
        file = request.files['file']
        if file and file.filename and allowed_file(file.filename):
            try:
                media_url = upload_file(file, folder='posts')
            except Exception as e:
                return jsonify({'error': str(e)}), 500
    
    content = request.form.get('content') if 'file' in request.files else request.get_json().get('content')
    
    if not content:
        return jsonify({'error': 'Content required'}), 400
    
    post = create_post(
        student_id=request.user_id,
        content=content,
        media_url=media_url,
        post_type='manual'
    )
    
    return jsonify({
        'message': 'Post created successfully',
        'post': json.loads(json_util.dumps(post))
    }), 201

@feed_bp.route('/<post_id>', methods=['GET'])
@token_required
def get_post(post_id):
    """Get a specific post"""
    post = get_post_by_id(post_id)
    
    if not post:
        return jsonify({'error': 'Post not found'}), 404
    
    # Enrich with user data
    user = get_user_by_id(post['student_id'])
    post_data = json.loads(json_util.dumps(post))
    post_data['author'] = {
        'name': user['name'],
        'avatar_url': user.get('avatar_url'),
        'eco_points': user.get('eco_points', 0)
    } if user else None
    
    return jsonify({'post': post_data}), 200

@feed_bp.route('/<post_id>/like', methods=['POST'])
@token_required
def like_post_route(post_id):
    """Like or unlike a post"""
    result = like_post(post_id, request.user_id)
    return jsonify(result), 200

@feed_bp.route('/<post_id>/comment', methods=['POST'])
@token_required
def add_comment_route(post_id):
    """Add a comment to a post"""
    data = request.get_json()
    
    if 'text' not in data:
        return jsonify({'error': 'Comment text required'}), 400
    
    comment = add_comment(post_id, request.user_id, data['text'])
    
    return jsonify({
        'message': 'Comment added successfully',
        'comment': json.loads(json_util.dumps(comment))
    }), 201

@feed_bp.route('/<post_id>/share', methods=['POST'])
@token_required
def share_post_route(post_id):
    """Share a post"""
    share_post(post_id)
    return jsonify({'message': 'Post shared successfully'}), 200

@feed_bp.route('/<post_id>', methods=['DELETE'])
@token_required
def delete_post_route(post_id):
    """Delete a post"""
    result = delete_post(post_id, request.user_id)
    
    if result:
        return jsonify({'message': 'Post deleted successfully'}), 200
    else:
        return jsonify({'error': 'Post not found or unauthorized'}), 404
