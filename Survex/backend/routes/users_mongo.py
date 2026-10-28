"""
User management routes for Windsurf Platform
"""
from flask import Blueprint, request, jsonify
from datetime import datetime
import jwt
from bson import ObjectId

users_bp = Blueprint('users', __name__)

def init_users_routes(app, mongo):
    """Initialize user routes with app and mongo instances"""
    
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
    
    @users_bp.route('/', methods=['GET'])
    def get_all_users():
        """Get all users (Admin only)"""
        try:
            user = verify_token()
            if not user or user.get('role') != 'admin':
                return jsonify({'error': 'Admin access required'}), 403
            
            # Get query parameters
            role = request.args.get('role')
            department = request.args.get('department')
            search = request.args.get('search')
            
            # Build query
            query = {}
            if role:
                query['role'] = role
            if department:
                query['department'] = department
            if search:
                query['$or'] = [
                    {'name': {'$regex': search, '$options': 'i'}},
                    {'email': {'$regex': search, '$options': 'i'}},
                    {'department': {'$regex': search, '$options': 'i'}}
                ]
            
            # Get users without passwords
            users = list(mongo.db.users.find(query, {'password': 0}).sort('created_at', -1))
            
            return jsonify({
                'users': serialize_doc(users),
                'total': len(users)
            }), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @users_bp.route('/<user_id>', methods=['GET'])
    def get_user(user_id):
        """Get specific user (Admin only or own profile)"""
        try:
            current_user = verify_token()
            if not current_user:
                return jsonify({'error': 'Authentication required'}), 401
            
            # Check if admin or requesting own profile
            if current_user.get('role') != 'admin' and current_user['user_id'] != user_id:
                return jsonify({'error': 'Permission denied'}), 403
            
            user = mongo.db.users.find_one({'_id': ObjectId(user_id)}, {'password': 0})
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            return jsonify({'user': serialize_doc(user)}), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @users_bp.route('/<user_id>', methods=['PUT'])
    def update_user(user_id):
        """Update user (Admin only or own profile)"""
        try:
            current_user = verify_token()
            if not current_user:
                return jsonify({'error': 'Authentication required'}), 401
            
            # Check permissions
            if current_user.get('role') != 'admin' and current_user['user_id'] != user_id:
                return jsonify({'error': 'Permission denied'}), 403
            
            data = request.get_json()
            
            # Define allowed fields based on role
            if current_user.get('role') == 'admin':
                allowed_fields = ['name', 'email', 'department', 'year', 'phone', 'designation', 'experience', 'specialization', 'role', 'eco_points', 'badges']
            else:
                allowed_fields = ['name', 'department', 'year', 'phone']
            
            update_data = {}
            for field in allowed_fields:
                if field in data:
                    update_data[field] = data[field]
            
            if not update_data:
                return jsonify({'error': 'No valid fields to update'}), 400
            
            update_data['updated_at'] = datetime.utcnow()
            
            # Update user
            result = mongo.db.users.update_one(
                {'_id': ObjectId(user_id)},
                {'$set': update_data}
            )
            
            if result.matched_count == 0:
                return jsonify({'error': 'User not found'}), 404
            
            # Get updated user
            user = mongo.db.users.find_one({'_id': ObjectId(user_id)}, {'password': 0})
            
            return jsonify({
                'message': 'User updated successfully',
                'user': serialize_doc(user)
            }), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @users_bp.route('/<user_id>', methods=['DELETE'])
    def delete_user(user_id):
        """Delete user (Admin only)"""
        try:
            user = verify_token()
            if not user or user.get('role') != 'admin':
                return jsonify({'error': 'Admin access required'}), 403
            
            # Check if user exists
            existing_user = mongo.db.users.find_one({'_id': ObjectId(user_id)})
            if not existing_user:
                return jsonify({'error': 'User not found'}), 404
            
            # Don't allow deleting admin users
            if existing_user.get('role') == 'admin':
                return jsonify({'error': 'Cannot delete admin users'}), 400
            
            # Delete user
            mongo.db.users.delete_one({'_id': ObjectId(user_id)})
            
            # Clean up related data
            mongo.db.posts.delete_many({'student_id': user_id})
            mongo.db.submissions.delete_many({'student_id': user_id})
            mongo.db.joined_challenges.delete_many({'student_id': user_id})
            
            return jsonify({'message': 'User deleted successfully'}), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @users_bp.route('/leaderboard', methods=['GET'])
    def get_leaderboard():
        """Get user leaderboard"""
        try:
            limit = int(request.args.get('limit', 15))
            
            # Get top users by eco points
            users = list(mongo.db.users.find(
                {'role': 'student'},
                {'password': 0}
            ).sort('eco_points', -1).limit(limit))
            
            # Add rank to each user
            for i, user in enumerate(users):
                user['rank'] = i + 1
            
            return jsonify({
                'leaderboard': serialize_doc(users),
                'total': len(users)
            }), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @users_bp.route('/<user_id>/stats', methods=['GET'])
    def get_user_stats(user_id):
        """Get user statistics"""
        try:
            current_user = verify_token()
            if not current_user:
                return jsonify({'error': 'Authentication required'}), 401
            
            # Check permissions
            if current_user.get('role') != 'admin' and current_user['user_id'] != user_id:
                return jsonify({'error': 'Permission denied'}), 403
            
            # Get user
            user = mongo.db.users.find_one({'_id': ObjectId(user_id)}, {'password': 0})
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            # Get user's statistics
            joined_challenges = mongo.db.joined_challenges.count_documents({'student_id': user_id})
            completed_challenges = mongo.db.joined_challenges.count_documents({
                'student_id': user_id,
                'status': 'completed'
            })
            pending_submissions = mongo.db.submissions.count_documents({
                'student_id': user_id,
                'verification_status': 'pending'
            })
            total_posts = mongo.db.posts.count_documents({'student_id': user_id})
            
            # Get user's rank
            higher_users = mongo.db.users.count_documents({
                'role': 'student',
                'eco_points': {'$gt': user.get('eco_points', 0)}
            })
            rank = higher_users + 1
            
            stats = {
                'user': serialize_doc(user),
                'eco_points': user.get('eco_points', 0),
                'challenges_completed': user.get('challenges_completed', 0),
                'joined_challenges': joined_challenges,
                'completed_challenges': completed_challenges,
                'pending_submissions': pending_submissions,
                'total_posts': total_posts,
                'badges': user.get('badges', []),
                'rank': rank
            }
            
            return jsonify({'stats': stats}), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @users_bp.route('/<user_id>/award-points', methods=['POST'])
    def award_points(user_id):
        """Award points to user (Admin only)"""
        try:
            user = verify_token()
            if not user or user.get('role') != 'admin':
                return jsonify({'error': 'Admin access required'}), 403
            
            data = request.get_json()
            points = data.get('points', 0)
            reason = data.get('reason', 'Manual award')
            
            if not isinstance(points, int) or points <= 0:
                return jsonify({'error': 'Points must be a positive integer'}), 400
            
            # Update user points
            result = mongo.db.users.update_one(
                {'_id': ObjectId(user_id)},
                {
                    '$inc': {'eco_points': points},
                    '$set': {'updated_at': datetime.utcnow()}
                }
            )
            
            if result.matched_count == 0:
                return jsonify({'error': 'User not found'}), 404
            
            # Get updated user
            updated_user = mongo.db.users.find_one({'_id': ObjectId(user_id)}, {'password': 0})
            
            return jsonify({
                'message': f'Awarded {points} points successfully',
                'user': serialize_doc(updated_user),
                'reason': reason
            }), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @users_bp.route('/departments', methods=['GET'])
    def get_departments():
        """Get all departments"""
        try:
            departments = mongo.db.users.distinct('department')
            return jsonify({'departments': departments}), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @users_bp.route('/search', methods=['GET'])
    def search_users():
        """Search users"""
        try:
            user = verify_token()
            if not user:
                return jsonify({'error': 'Authentication required'}), 401
            
            query = request.args.get('q', '')
            role = request.args.get('role', 'student')
            limit = int(request.args.get('limit', 10))
            
            if not query:
                return jsonify({'users': [], 'total': 0}), 200
            
            # Search users
            search_query = {
                'role': role,
                '$or': [
                    {'name': {'$regex': query, '$options': 'i'}},
                    {'email': {'$regex': query, '$options': 'i'}},
                    {'department': {'$regex': query, '$options': 'i'}}
                ]
            }
            
            users = list(mongo.db.users.find(search_query, {'password': 0}).limit(limit))
            
            return jsonify({
                'users': serialize_doc(users),
                'total': len(users)
            }), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    return users_bp
