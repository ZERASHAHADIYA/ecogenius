from flask import Flask, jsonify, request
from flask_cors import CORS
from config import Config
import os
from datetime import datetime

# Import simple database
from simple_db import db

# Import routes
from routes.auth import auth_bp
from routes.challenges_new import challenges_bp
from routes.feed_new import feed_bp
from routes.rewards_new import rewards_bp

app = Flask(__name__)
app.config.from_object(Config)

# Enable CORS with specific settings
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Create static folders if they don't exist
os.makedirs('static/uploads', exist_ok=True)
os.makedirs('static/avatars', exist_ok=True)
os.makedirs('static/posts', exist_ok=True)
os.makedirs('static/submissions', exist_ok=True)

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(challenges_bp, url_prefix='/api/challenges')
app.register_blueprint(feed_bp, url_prefix='/api/feed')
app.register_blueprint(rewards_bp, url_prefix='/api/rewards')

# Simple leaderboard endpoint
@app.route('/api/leaderboard/global')
def get_leaderboard():
    users = db.find('users')
    sorted_users = sorted(users, key=lambda x: x.get('eco_points', 0), reverse=True)
    # Remove passwords from response
    for user in sorted_users:
        user.pop('password', None)
    return jsonify({'leaderboard': sorted_users[:10]})

# Simple submissions endpoint for verification
@app.route('/api/submissions/pending')
def get_pending_submissions():
    submissions = db.find('submissions', {'verification_status': 'pending'})
    return jsonify({'submissions': submissions})

@app.route('/api/submissions/<submission_id>/verify', methods=['POST'])
def verify_submission(submission_id):
    try:
        data = request.get_json()
        approved = data.get('approved', False)
        comment = data.get('comment', '')
        
        submission = db.find_one('submissions', {'_id': submission_id})
        if not submission:
            return jsonify({'error': 'Submission not found'}), 404
        
        if approved:
            # Award points to user
            challenge = db.find_one('challenges', {'_id': submission['challenge_id']})
            if challenge:
                user = db.find_one('users', {'_id': submission['student_id']})
                if user:
                    new_points = user.get('eco_points', 0) + challenge['points']
                    db.update_one('users', {'_id': user['_id']}, {'$set': {'eco_points': new_points}})
                    
                    # Create success post
                    post_data = {
                        'content': f"🎉 Just completed '{challenge['title']}' and earned {challenge['points']} eco-points! {submission.get('caption', '')}",
                        'student_id': user['_id'],
                        'student': {'name': user['name'], 'department': user['department']},
                        'post_type': 'challenge_completion',
                        'challenge_id': challenge['_id'],
                        'media_url': submission.get('media_url'),
                        'likes': 0,
                        'comments': [],
                        'shares': 0,
                        'timestamp': datetime.now().isoformat()
                    }
                    db.insert_one('posts', post_data)
        
        # Update submission status
        db.update_one('submissions', {'_id': submission_id}, {
            '$set': {
                'verification_status': 'verified' if approved else 'rejected',
                'admin_comment': comment,
                'verified_at': datetime.now().isoformat()
            }
        })
        
        return jsonify({'message': 'Submission verified successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Analytics endpoint
@app.route('/api/analytics/overview')
def get_analytics():
    try:
        users = db.find('users')
        challenges = db.find('challenges')
        submissions = db.find('submissions')
        posts = db.find('posts')
        
        analytics = {
            'users': {
                'total_students': len([u for u in users if u['role'] == 'student']),
                'active_students': len([u for u in users if u.get('eco_points', 0) > 0]),
                'participation_rate': 75  # Mock data
            },
            'challenges': {
                'total_challenges': len(challenges),
                'active_challenges': len([c for c in challenges if c['status'] == 'active'])
            },
            'submissions': {
                'total': len(submissions),
                'pending': len([s for s in submissions if s['verification_status'] == 'pending']),
                'verified': len([s for s in submissions if s['verification_status'] == 'verified']),
                'rejected': len([s for s in submissions if s['verification_status'] == 'rejected'])
            },
            'posts': {
                'total': len(posts)
            }
        }
        
        return jsonify({'analytics': analytics}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'Windsurf API is running'
    }), 200

# Root endpoint
@app.route('/', methods=['GET'])
def root():
    return jsonify({
        'message': 'Welcome to Windsurf - Campus Sustainability Platform API',
        'version': '1.0.0',
        'endpoints': {
            'auth': '/api/auth',
            'challenges': '/api/challenges',
            'submissions': '/api/submissions',
            'feed': '/api/feed',
            'leaderboard': '/api/leaderboard',
            'rewards': '/api/rewards',
            'users': '/api/users',
            'analytics': '/api/analytics'
        },
        'demo_users': [
            {'email': 'john.doe@student.college.edu', 'password': 'password123', 'role': 'student'},
            {'email': 'admin@student.college.edu', 'password': 'admin123', 'role': 'admin'},
            {'email': 'faculty@student.college.edu', 'password': 'faculty123', 'role': 'faculty'}
        ]
    }), 200

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
