from flask import Blueprint, request, jsonify
from simple_db import db
from config import Config
import jwt
from datetime import datetime

feed_bp = Blueprint('feed', __name__)

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

@feed_bp.route('', methods=['GET'])
def get_feed():
    """Get social feed posts"""
    try:
        posts = db.find('posts')
        # Sort by timestamp (newest first)
        posts.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        return jsonify({'posts': posts}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@feed_bp.route('', methods=['POST'])
def create_post():
    """Create a new post"""
    try:
        user = get_user_from_token()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        
        data = request.get_json()
        
        post_data = {
            'content': data.get('content', ''),
            'student_id': user['_id'],
            'student': {'name': user['name'], 'department': user['department']},
            'post_type': data.get('post_type', 'general'),
            'challenge_id': data.get('challenge_id'),
            'media_url': data.get('media_url'),
            'likes': 0,
            'comments': [],
            'shares': 0,
            'timestamp': datetime.now().isoformat()
        }
        
        post_id = db.insert_one('posts', post_data)
        post_data['_id'] = post_id
        
        return jsonify({
            'message': 'Post created successfully',
            'post': post_data
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@feed_bp.route('/<post_id>/like', methods=['POST'])
def like_post(post_id):
    """Like/unlike a post"""
    try:
        user = get_user_from_token()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        
        post = db.find_one('posts', {'_id': post_id})
        if not post:
            return jsonify({'error': 'Post not found'}), 404
        
        # Toggle like
        current_likes = post.get('likes', 0)
        new_likes = current_likes + 1
        
        db.update_one('posts', {'_id': post_id}, {'$set': {'likes': new_likes}})
        
        return jsonify({
            'message': 'Post liked',
            'likes': new_likes
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@feed_bp.route('/<post_id>/comment', methods=['POST'])
def add_comment(post_id):
    """Add comment to post"""
    try:
        user = get_user_from_token()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        
        data = request.get_json()
        text = data.get('text', '').strip()
        
        if not text:
            return jsonify({'error': 'Comment text required'}), 400
        
        post = db.find_one('posts', {'_id': post_id})
        if not post:
            return jsonify({'error': 'Post not found'}), 404
        
        comment = {
            'user': user['name'],
            'text': text,
            'timestamp': datetime.now().isoformat()
        }
        
        comments = post.get('comments', [])
        comments.append(comment)
        
        db.update_one('posts', {'_id': post_id}, {'$set': {'comments': comments}})
        
        return jsonify({
            'message': 'Comment added',
            'comment': comment
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
