"""
Challenge routes for Windsurf Platform
"""
from flask import Blueprint, request, jsonify
from datetime import datetime
import jwt
from bson import ObjectId

challenges_bp = Blueprint('challenges', __name__)

def init_challenge_routes(app, mongo):
    """Initialize challenge routes with app and mongo instances"""
    
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
    
    @challenges_bp.route('/', methods=['GET'])
    def get_all_challenges():
        """Get all challenges"""
        try:
            # Get query parameters
            status = request.args.get('status', 'active')
            category = request.args.get('category')
            search = request.args.get('search')
            
            # Build query
            query = {}
            if status:
                query['status'] = status
            if category:
                query['category'] = category
            if search:
                query['$or'] = [
                    {'title': {'$regex': search, '$options': 'i'}},
                    {'description': {'$regex': search, '$options': 'i'}}
                ]
            
            # Get challenges
            challenges = list(mongo.db.challenges.find(query).sort('created_at', -1))
            
            return jsonify({
                'challenges': serialize_doc(challenges),
                'total': len(challenges)
            }), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @challenges_bp.route('/<challenge_id>', methods=['GET'])
    def get_challenge(challenge_id):
        """Get specific challenge"""
        try:
            challenge = mongo.db.challenges.find_one({'_id': ObjectId(challenge_id)})
            if not challenge:
                return jsonify({'error': 'Challenge not found'}), 404
            
            return jsonify({'challenge': serialize_doc(challenge)}), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @challenges_bp.route('/', methods=['POST'])
    def create_challenge():
        """Create new challenge (Admin only)"""
        try:
            user = verify_token()
            if not user or user.get('role') != 'admin':
                return jsonify({'error': 'Admin access required'}), 403
            
            data = request.get_json()
            
            # Validate required fields
            required_fields = ['title', 'description', 'category', 'difficulty', 'points', 'duration']
            for field in required_fields:
                if not data.get(field):
                    return jsonify({'error': f'{field} is required'}), 400
            
            # Create challenge document
            challenge_doc = {
                'title': data['title'],
                'description': data['description'],
                'category': data['category'],
                'difficulty': data['difficulty'],
                'points': int(data['points']),
                'duration': data['duration'],
                'requirements': data.get('requirements', []),
                'tips': data.get('tips', []),
                'status': 'active',
                'participants': 0,
                'created_by': user['user_id'],
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            
            # Insert challenge
            result = mongo.db.challenges.insert_one(challenge_doc)
            challenge_doc['_id'] = result.inserted_id
            
            return jsonify({
                'message': 'Challenge created successfully',
                'challenge': serialize_doc(challenge_doc)
            }), 201
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @challenges_bp.route('/<challenge_id>', methods=['PUT'])
    def update_challenge(challenge_id):
        """Update challenge (Admin only)"""
        try:
            user = verify_token()
            if not user or user.get('role') != 'admin':
                return jsonify({'error': 'Admin access required'}), 403
            
            data = request.get_json()
            
            # Update allowed fields
            allowed_fields = ['title', 'description', 'category', 'difficulty', 'points', 'duration', 'requirements', 'tips', 'status']
            update_data = {}
            for field in allowed_fields:
                if field in data:
                    if field == 'points':
                        update_data[field] = int(data[field])
                    else:
                        update_data[field] = data[field]
            
            if not update_data:
                return jsonify({'error': 'No valid fields to update'}), 400
            
            update_data['updated_at'] = datetime.utcnow()
            
            # Update challenge
            result = mongo.db.challenges.update_one(
                {'_id': ObjectId(challenge_id)},
                {'$set': update_data}
            )
            
            if result.matched_count == 0:
                return jsonify({'error': 'Challenge not found'}), 404
            
            # Get updated challenge
            challenge = mongo.db.challenges.find_one({'_id': ObjectId(challenge_id)})
            
            return jsonify({
                'message': 'Challenge updated successfully',
                'challenge': serialize_doc(challenge)
            }), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @challenges_bp.route('/<challenge_id>/join', methods=['POST'])
    def join_challenge(challenge_id):
        """Join a challenge"""
        try:
            user = verify_token()
            if not user:
                return jsonify({'error': 'Authentication required'}), 401
            
            # Check if challenge exists
            challenge = mongo.db.challenges.find_one({'_id': ObjectId(challenge_id)})
            if not challenge:
                return jsonify({'error': 'Challenge not found'}), 404
            
            if challenge['status'] != 'active':
                return jsonify({'error': 'Challenge is not active'}), 400
            
            # Check if already joined
            existing_join = mongo.db.joined_challenges.find_one({
                'student_id': user['user_id'],
                'challenge_id': challenge_id
            })
            
            if existing_join:
                return jsonify({'error': 'Already joined this challenge'}), 400
            
            # Create joined challenge record
            joined_challenge = {
                'student_id': user['user_id'],
                'challenge_id': challenge_id,
                'joined_date': datetime.utcnow().isoformat(),
                'status': 'in_progress',
                'progress': 0,
                'submitted_proof': False,
                'proof_status': 'not_submitted',
                'proof_files': [],
                'proof_description': '',
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            
            # Insert joined challenge
            mongo.db.joined_challenges.insert_one(joined_challenge)
            
            # Increment participants count
            mongo.db.challenges.update_one(
                {'_id': ObjectId(challenge_id)},
                {'$inc': {'participants': 1}}
            )
            
            return jsonify({
                'message': 'Successfully joined challenge',
                'joined_challenge': serialize_doc(joined_challenge)
            }), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @challenges_bp.route('/my-challenges', methods=['GET'])
    def get_my_challenges():
        """Get user's joined challenges"""
        try:
            user = verify_token()
            if not user:
                return jsonify({'error': 'Authentication required'}), 401
            
            # Get joined challenges
            joined_challenges = list(mongo.db.joined_challenges.find({
                'student_id': user['user_id']
            }))
            
            # Get challenge details for each joined challenge
            my_challenges = []
            for joined in joined_challenges:
                challenge = mongo.db.challenges.find_one({'_id': ObjectId(joined['challenge_id'])})
                if challenge:
                    challenge_data = serialize_doc(challenge)
                    challenge_data.update({
                        'joined_date': joined['joined_date'],
                        'status': joined['status'],
                        'progress': joined['progress'],
                        'submitted_proof': joined['submitted_proof'],
                        'proof_status': joined['proof_status'],
                        'proof_files': joined.get('proof_files', []),
                        'proof_description': joined.get('proof_description', '')
                    })
                    my_challenges.append(challenge_data)
            
            return jsonify({
                'challenges': my_challenges,
                'total': len(my_challenges)
            }), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @challenges_bp.route('/<challenge_id>/submit-proof', methods=['POST'])
    def submit_proof(challenge_id):
        """Submit proof for a challenge"""
        try:
            user = verify_token()
            if not user:
                return jsonify({'error': 'Authentication required'}), 401
            
            # Check if user joined this challenge
            joined_challenge = mongo.db.joined_challenges.find_one({
                'student_id': user['user_id'],
                'challenge_id': challenge_id
            })
            
            if not joined_challenge:
                return jsonify({'error': 'You must join the challenge first'}), 400
            
            if joined_challenge['submitted_proof']:
                return jsonify({'error': 'Proof already submitted'}), 400
            
            data = request.get_json()
            proof_files = data.get('proof_files', [])
            proof_description = data.get('proof_description', '')
            
            if not proof_files and not proof_description:
                return jsonify({'error': 'Please provide proof files or description'}), 400
            
            # Update joined challenge with proof
            update_data = {
                'submitted_proof': True,
                'proof_status': 'under_review',
                'proof_files': proof_files,
                'proof_description': proof_description,
                'submitted_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            
            mongo.db.joined_challenges.update_one(
                {
                    'student_id': user['user_id'],
                    'challenge_id': challenge_id
                },
                {'$set': update_data}
            )
            
            # Create submission record for admin review
            submission_doc = {
                'student_id': user['user_id'],
                'challenge_id': challenge_id,
                'proof_files': proof_files,
                'proof_description': proof_description,
                'verification_status': 'pending',
                'submitted_at': datetime.utcnow(),
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            
            mongo.db.submissions.insert_one(submission_doc)
            
            return jsonify({
                'message': 'Proof submitted successfully',
                'status': 'under_review'
            }), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @challenges_bp.route('/categories', methods=['GET'])
    def get_categories():
        """Get all challenge categories"""
        try:
            categories = mongo.db.challenges.distinct('category')
            return jsonify({'categories': categories}), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @challenges_bp.route('/stats', methods=['GET'])
    def get_challenge_stats():
        """Get challenge statistics"""
        try:
            total_challenges = mongo.db.challenges.count_documents({})
            active_challenges = mongo.db.challenges.count_documents({'status': 'active'})
            total_participants = mongo.db.joined_challenges.count_documents({})
            
            # Category breakdown
            pipeline = [
                {'$match': {'status': 'active'}},
                {'$group': {
                    '_id': '$category',
                    'count': {'$sum': 1},
                    'total_participants': {'$sum': '$participants'}
                }}
            ]
            category_stats = list(mongo.db.challenges.aggregate(pipeline))
            
            return jsonify({
                'total_challenges': total_challenges,
                'active_challenges': active_challenges,
                'total_participants': total_participants,
                'category_breakdown': category_stats
            }), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    return challenges_bp
