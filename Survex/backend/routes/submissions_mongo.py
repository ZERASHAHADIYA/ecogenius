"""
Submission routes for Windsurf Platform
"""
from flask import Blueprint, request, jsonify
from datetime import datetime
import jwt
from bson import ObjectId

submissions_bp = Blueprint('submissions', __name__)

def init_submission_routes(app, mongo):
    """Initialize submission routes with app and mongo instances"""
    
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
    
    @submissions_bp.route('/pending', methods=['GET'])
    def get_pending_submissions():
        """Get all pending submissions (Admin only)"""
        try:
            user = verify_token()
            if not user or user.get('role') != 'admin':
                return jsonify({'error': 'Admin access required'}), 403
            
            # Get pending submissions with student and challenge details
            pipeline = [
                {'$match': {'verification_status': 'pending'}},
                {'$lookup': {
                    'from': 'users',
                    'localField': 'student_id',
                    'foreignField': '_id',
                    'as': 'student'
                }},
                {'$lookup': {
                    'from': 'challenges',
                    'localField': 'challenge_id',
                    'foreignField': '_id',
                    'as': 'challenge'
                }},
                {'$unwind': '$student'},
                {'$unwind': '$challenge'},
                {'$sort': {'submitted_at': -1}}
            ]
            
            submissions = list(mongo.db.submissions.aggregate(pipeline))
            
            # Clean up student data (remove password)
            for submission in submissions:
                if 'student' in submission and 'password' in submission['student']:
                    del submission['student']['password']
            
            return jsonify({
                'submissions': serialize_doc(submissions),
                'total': len(submissions)
            }), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @submissions_bp.route('/', methods=['GET'])
    def get_all_submissions():
        """Get all submissions with filtering (Admin only)"""
        try:
            user = verify_token()
            if not user or user.get('role') != 'admin':
                return jsonify({'error': 'Admin access required'}), 403
            
            # Get query parameters
            status = request.args.get('status')
            student_id = request.args.get('student_id')
            challenge_id = request.args.get('challenge_id')
            
            # Build match query
            match_query = {}
            if status:
                match_query['verification_status'] = status
            if student_id:
                match_query['student_id'] = student_id
            if challenge_id:
                match_query['challenge_id'] = ObjectId(challenge_id)
            
            # Aggregation pipeline
            pipeline = [
                {'$match': match_query},
                {'$lookup': {
                    'from': 'users',
                    'localField': 'student_id',
                    'foreignField': '_id',
                    'as': 'student'
                }},
                {'$lookup': {
                    'from': 'challenges',
                    'localField': 'challenge_id',
                    'foreignField': '_id',
                    'as': 'challenge'
                }},
                {'$unwind': '$student'},
                {'$unwind': '$challenge'},
                {'$sort': {'submitted_at': -1}}
            ]
            
            submissions = list(mongo.db.submissions.aggregate(pipeline))
            
            # Clean up student data
            for submission in submissions:
                if 'student' in submission and 'password' in submission['student']:
                    del submission['student']['password']
            
            return jsonify({
                'submissions': serialize_doc(submissions),
                'total': len(submissions)
            }), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @submissions_bp.route('/<submission_id>/review', methods=['POST'])
    def review_submission(submission_id):
        """Review submission - approve or reject (Admin only)"""
        try:
            user = verify_token()
            if not user or user.get('role') != 'admin':
                return jsonify({'error': 'Admin access required'}), 403
            
            data = request.get_json()
            action = data.get('action')  # 'approve' or 'reject'
            comment = data.get('admin_comment', data.get('comment', ''))
            
            if action not in ['approve', 'reject']:
                return jsonify({'error': 'Action must be approve or reject'}), 400
            
            # Validate ObjectId format
            try:
                submission_object_id = ObjectId(submission_id)
            except:
                # If it's not a valid ObjectId, try to find by string ID or create mock response
                if submission_id in ['1', '2', '3', '4', '5']:
                    # Mock response for demo submissions
                    return jsonify({
                        'message': f'Submission {action}d successfully (demo mode)',
                        'status': 'approved' if action == 'approve' else 'rejected'
                    }), 200
                else:
                    return jsonify({'error': 'Invalid submission ID format'}), 400
            
            # Get submission
            submission = mongo.db.submissions.find_one({'_id': submission_object_id})
            if not submission:
                return jsonify({'error': 'Submission not found'}), 404
            
            # Update submission status
            new_status = 'approved' if action == 'approve' else 'rejected'
            mongo.db.submissions.update_one(
                {'_id': submission_object_id},
                {
                    '$set': {
                        'verification_status': new_status,
                        'admin_comment': comment,
                        'reviewed_by': user['user_id'],
                        'reviewed_at': datetime.utcnow(),
                        'updated_at': datetime.utcnow()
                    }
                }
            )
            
            # Update joined challenge status
            mongo.db.joined_challenges.update_one(
                {
                    'student_id': submission['student_id'],
                    'challenge_id': str(submission['challenge_id'])
                },
                {
                    '$set': {
                        'proof_status': new_status,
                        'status': 'completed' if action == 'approve' else 'in_progress',
                        'updated_at': datetime.utcnow()
                    }
                }
            )
            
            if action == 'approve':
                # Get challenge details for points
                challenge = mongo.db.challenges.find_one({'_id': submission['challenge_id']})
                if challenge:
                    # Award points to student
                    mongo.db.users.update_one(
                        {'_id': ObjectId(submission['student_id'])},
                        {
                            '$inc': {
                                'eco_points': challenge['points'],
                                'challenges_completed': 1
                            },
                            '$set': {'updated_at': datetime.utcnow()}
                        }
                    )
                    
                    # Create achievement post
                    student = mongo.db.users.find_one({'_id': ObjectId(submission['student_id'])})
                    if student:
                        post_doc = {
                            'student_id': submission['student_id'],
                            'author': {
                                'name': student['name'],
                                'department': student['department']
                            },
                            'content': f"🎉 Successfully completed '{challenge['title']}' and earned {challenge['points']} eco-points! {submission.get('proof_description', '')}",
                            'post_type': 'challenge_completion',
                            'challenge_id': str(challenge['_id']),
                            'challenge_completed': challenge['title'],
                            'points_earned': challenge['points'],
                            'proof_images': [file.get('url', '') for file in submission.get('proof_files', []) if file.get('type', '').startswith('image/')],
                            'likes': 0,
                            'liked_by_admin': False,
                            'comments': [],
                            'timestamp': datetime.utcnow(),
                            'created_at': datetime.utcnow(),
                            'updated_at': datetime.utcnow()
                        }
                        mongo.db.posts.insert_one(post_doc)
            
            return jsonify({
                'message': f'Submission {action}d successfully',
                'status': new_status
            }), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @submissions_bp.route('/my-submissions', methods=['GET'])
    def get_my_submissions():
        """Get current user's submissions"""
        try:
            user = verify_token()
            if not user:
                return jsonify({'error': 'Authentication required'}), 401
            
            # Get user's submissions with challenge details
            pipeline = [
                {'$match': {'student_id': user['user_id']}},
                {'$lookup': {
                    'from': 'challenges',
                    'localField': 'challenge_id',
                    'foreignField': '_id',
                    'as': 'challenge'
                }},
                {'$unwind': '$challenge'},
                {'$sort': {'submitted_at': -1}}
            ]
            
            submissions = list(mongo.db.submissions.aggregate(pipeline))
            
            return jsonify({
                'submissions': serialize_doc(submissions),
                'total': len(submissions)
            }), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @submissions_bp.route('/stats', methods=['GET'])
    def get_submission_stats():
        """Get submission statistics (Admin only)"""
        try:
            user = verify_token()
            if not user or user.get('role') != 'admin':
                return jsonify({'error': 'Admin access required'}), 403
            
            total_submissions = mongo.db.submissions.count_documents({})
            pending_submissions = mongo.db.submissions.count_documents({'verification_status': 'pending'})
            approved_submissions = mongo.db.submissions.count_documents({'verification_status': 'approved'})
            rejected_submissions = mongo.db.submissions.count_documents({'verification_status': 'rejected'})
            
            # Recent submissions (last 7 days)
            from datetime import timedelta
            week_ago = datetime.utcnow() - timedelta(days=7)
            recent_submissions = mongo.db.submissions.count_documents({
                'submitted_at': {'$gte': week_ago}
            })
            
            return jsonify({
                'total_submissions': total_submissions,
                'pending_submissions': pending_submissions,
                'approved_submissions': approved_submissions,
                'rejected_submissions': rejected_submissions,
                'recent_submissions': recent_submissions,
                'approval_rate': round((approved_submissions / max(total_submissions, 1)) * 100, 2)
            }), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    return submissions_bp
