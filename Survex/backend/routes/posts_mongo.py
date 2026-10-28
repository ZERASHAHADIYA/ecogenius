"""
Posts/Feed routes for Windsurf Platform
"""
from flask import Blueprint, request, jsonify
from datetime import datetime
import jwt
from bson import ObjectId

posts_bp = Blueprint('posts', __name__)

def init_posts_routes(app, mongo):
    """Initialize posts routes with app and mongo instances"""
    
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
    
    def verify_token():
        """Verify JWT token and return user info"""
        token = request.headers.get('Authorization')
        if not token:
            return None
        
        if token.startswith('Bearer '):
            token = token[7:]
        
        try:
            payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            return payload
        except:
            return None
    
    @posts_bp.route('/', methods=['GET'])
    @posts_bp.route('/feed', methods=['GET'])
    def get_all_posts():
        """Get all posts for feed"""
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
            
            return jsonify({
                'posts': serialize_doc(posts),
                'total': total_posts,
                'has_more': (skip + limit) < total_posts
            }), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @posts_bp.route('/', methods=['POST'])
    def create_post():
        """Create a new post"""
        try:
            user = verify_token()
            if not user:
                return jsonify({'error': 'Authentication required'}), 401
            
            data = request.get_json()
            
            if not data.get('content'):
                return jsonify({'error': 'Content is required'}), 400
            
            # Get user details
            user_doc = mongo.db.users.find_one({'_id': ObjectId(user['user_id'])})
            if not user_doc:
                return jsonify({'error': 'User not found'}), 404
            
            # Create post document
            post_doc = {
                'student_id': user['user_id'],
                'author': {
                    'name': user_doc['name'],
                    'department': user_doc['department']
                },
                'content': data['content'],
                'post_type': data.get('post_type', 'general'),
                'challenge_id': data.get('challenge_id'),
                'challenge_completed': data.get('challenge_completed'),
                'points_earned': data.get('points_earned', 0),
                'proof_images': data.get('proof_images', []),
                'likes': 0,
                'liked_by_admin': False,
                'comments': [],
                'timestamp': datetime.utcnow(),
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            
            # Insert post
            result = mongo.db.posts.insert_one(post_doc)
            post_doc['_id'] = result.inserted_id
            
            return jsonify({
                'message': 'Post created successfully',
                'post': serialize_doc(post_doc)
            }), 201
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @posts_bp.route('/<post_id>', methods=['GET'])
    def get_post(post_id):
        """Get specific post"""
        try:
            post = mongo.db.posts.find_one({'_id': ObjectId(post_id)})
            if not post:
                return jsonify({'error': 'Post not found'}), 404
            
            return jsonify({'post': serialize_doc(post)}), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @posts_bp.route('/<post_id>/like', methods=['POST'])
    def like_post(post_id):
        """Like/unlike a post"""
        try:
            user = verify_token()
            if not user:
                return jsonify({'error': 'Authentication required'}), 401
            
            post = mongo.db.posts.find_one({'_id': ObjectId(post_id)})
            if not post:
                return jsonify({'error': 'Post not found'}), 404
            
            # Check if user is admin
            is_admin = user.get('role') == 'admin'
            
            if is_admin:
                # Toggle admin like
                new_liked_status = not post.get('liked_by_admin', False)
                like_increment = 1 if new_liked_status else -1
                
                mongo.db.posts.update_one(
                    {'_id': ObjectId(post_id)},
                    {
                        '$set': {'liked_by_admin': new_liked_status},
                        '$inc': {'likes': like_increment},
                        '$set': {'updated_at': datetime.utcnow()}
                    }
                )
                
                return jsonify({
                    'message': 'Post like updated',
                    'liked': new_liked_status,
                    'likes': post['likes'] + like_increment
                }), 200
            else:
                # For students, just increment likes (simplified)
                mongo.db.posts.update_one(
                    {'_id': ObjectId(post_id)},
                    {
                        '$inc': {'likes': 1},
                        '$set': {'updated_at': datetime.utcnow()}
                    }
                )
                
                return jsonify({
                    'message': 'Post liked',
                    'likes': post['likes'] + 1
                }), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @posts_bp.route('/<post_id>/comment', methods=['POST'])
    def add_comment(post_id):
        """Add comment to a post"""
        try:
            user = verify_token()
            if not user:
                return jsonify({'error': 'Authentication required'}), 401
            
            data = request.get_json()
            comment_text = data.get('comment')
            
            if not comment_text:
                return jsonify({'error': 'Comment text is required'}), 400
            
            # Get user details
            user_doc = mongo.db.users.find_one({'_id': ObjectId(user['user_id'])})
            if not user_doc:
                return jsonify({'error': 'User not found'}), 404
            
            # Create comment object
            comment = {
                '_id': str(ObjectId()),
                'author': user_doc['name'],
                'content': comment_text,
                'timestamp': datetime.utcnow().isoformat(),
                'is_admin': user.get('role') == 'admin'
            }
            
            # Add comment to post
            mongo.db.posts.update_one(
                {'_id': ObjectId(post_id)},
                {
                    '$push': {'comments': comment},
                    '$set': {'updated_at': datetime.utcnow()}
                }
            )
            
            return jsonify({
                'message': 'Comment added successfully',
                'comment': comment
            }), 201
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @posts_bp.route('/<post_id>/comments/<comment_id>', methods=['DELETE'])
    def delete_comment(post_id, comment_id):
        """Delete a comment (Admin only or comment author)"""
        try:
            user = verify_token()
            if not user:
                return jsonify({'error': 'Authentication required'}), 401
            
            # Get post
            post = mongo.db.posts.find_one({'_id': ObjectId(post_id)})
            if not post:
                return jsonify({'error': 'Post not found'}), 404
            
            # Find comment
            comment = None
            for c in post.get('comments', []):
                if c.get('_id') == comment_id:
                    comment = c
                    break
            
            if not comment:
                return jsonify({'error': 'Comment not found'}), 404
            
            # Check permissions (admin or comment author)
            user_doc = mongo.db.users.find_one({'_id': ObjectId(user['user_id'])})
            if user.get('role') != 'admin' and comment.get('author') != user_doc['name']:
                return jsonify({'error': 'Permission denied'}), 403
            
            # Remove comment
            mongo.db.posts.update_one(
                {'_id': ObjectId(post_id)},
                {
                    '$pull': {'comments': {'_id': comment_id}},
                    '$set': {'updated_at': datetime.utcnow()}
                }
            )
            
            return jsonify({'message': 'Comment deleted successfully'}), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @posts_bp.route('/my-posts', methods=['GET'])
    def get_my_posts():
        """Get current user's posts"""
        try:
            user = verify_token()
            if not user:
                return jsonify({'error': 'Authentication required'}), 401
            
            posts = list(mongo.db.posts.find({'student_id': user['user_id']})
                        .sort('timestamp', -1))
            
            return jsonify({
                'posts': serialize_doc(posts),
                'total': len(posts)
            }), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @posts_bp.route('/<post_id>', methods=['DELETE'])
    def delete_post(post_id):
        """Delete a post (Admin only or post author)"""
        try:
            user = verify_token()
            if not user:
                return jsonify({'error': 'Authentication required'}), 401
            
            post = mongo.db.posts.find_one({'_id': ObjectId(post_id)})
            if not post:
                return jsonify({'error': 'Post not found'}), 404
            
            # Check permissions
            if user.get('role') != 'admin' and post['student_id'] != user['user_id']:
                return jsonify({'error': 'Permission denied'}), 403
            
            # Delete post
            mongo.db.posts.delete_one({'_id': ObjectId(post_id)})
            
            return jsonify({'message': 'Post deleted successfully'}), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @posts_bp.route('/stats', methods=['GET'])
    def get_post_stats():
        """Get post statistics (Admin only)"""
        try:
            user = verify_token()
            if not user or user.get('role') != 'admin':
                return jsonify({'error': 'Admin access required'}), 403
            
            total_posts = mongo.db.posts.count_documents({})
            challenge_posts = mongo.db.posts.count_documents({'post_type': 'challenge_completion'})
            general_posts = mongo.db.posts.count_documents({'post_type': 'general'})
            
            # Recent posts (last 7 days)
            from datetime import timedelta
            week_ago = datetime.utcnow() - timedelta(days=7)
            recent_posts = mongo.db.posts.count_documents({
                'timestamp': {'$gte': week_ago}
            })
            
            # Most active users
            pipeline = [
                {'$group': {
                    '_id': '$student_id',
                    'post_count': {'$sum': 1},
                    'author_name': {'$first': '$author.name'}
                }},
                {'$sort': {'post_count': -1}},
                {'$limit': 5}
            ]
            active_users = list(mongo.db.posts.aggregate(pipeline))
            
            return jsonify({
                'total_posts': total_posts,
                'challenge_posts': challenge_posts,
                'general_posts': general_posts,
                'recent_posts': recent_posts,
                'most_active_users': active_users
            }), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    return posts_bp
