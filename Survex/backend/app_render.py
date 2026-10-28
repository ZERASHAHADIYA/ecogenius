"""
Production Flask server for Windsurf Platform - Render Deployment
Optimized for Render.com deployment with proper CORS and production settings
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__)

# Production CORS settings for Render
CORS(app, resources={
    r"/*": {
        "origins": [
            "https://windsurf-frontend.onrender.com",
            "http://localhost:3000", 
            "http://127.0.0.1:3000",
            "http://localhost:5173", 
            "http://127.0.0.1:5173"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Simple in-memory storage for demo
users_db = {}
challenges_db = []
posts_db = []
submissions_db = []

def init_demo_data():
    """Initialize with comprehensive demo data"""
    global users_db, challenges_db, posts_db, submissions_db
    
    # Demo users
    users_db = {
        'demo.student@college.edu': {
            '_id': 'student-1',
            'name': 'Demo Student',
            'email': 'demo.student@college.edu',
            'role': 'student',
            'department': 'Computer Science Engineering',
            'year': '3rd Year',
            'eco_points': 250,
            'badges': ['🌱 Green Beginner', '🌿 Eco Learner'],
            'challenges_completed': 3
        },
        'demo.admin@college.edu': {
            '_id': 'admin-1',
            'name': 'Demo Admin',
            'email': 'demo.admin@college.edu',
            'role': 'admin',
            'department': 'Administration',
            'year': 'Faculty',
            'eco_points': 1000,
            'badges': ['🌱 Green Beginner', '🌿 Eco Learner', '🌾 Sustainability Hero'],
            'challenges_completed': 10
        }
    }
    
    # Demo challenges
    challenges_db = [
        {
            '_id': 'challenge-1',
            'title': 'Campus Clean-up Drive',
            'description': 'Organize a campus-wide cleaning initiative to remove litter and promote environmental awareness.',
            'category': 'Environment',
            'difficulty': 'Medium',
            'points': 75,
            'duration': '1 week',
            'status': 'active',
            'requirements': ['Organize team of 5+ students', 'Document before/after photos', 'Submit activity report'],
            'tips': ['Coordinate with campus facilities', 'Bring gloves and trash bags', 'Focus on high-traffic areas']
        },
        {
            '_id': 'challenge-2',
            'title': 'Energy Conservation Week',
            'description': 'Reduce energy consumption in your dorm or department by implementing conservation practices.',
            'category': 'Energy',
            'difficulty': 'Easy',
            'points': 50,
            'duration': '1 week',
            'status': 'active',
            'requirements': ['Track energy usage', 'Implement 3+ conservation methods', 'Submit savings report'],
            'tips': ['Turn off lights when not needed', 'Unplug electronics', 'Use natural lighting when possible']
        },
        {
            '_id': 'challenge-3',
            'title': 'Plastic-Free Week Challenge',
            'description': 'Go plastic-free for one week and document your sustainable alternatives.',
            'category': 'Waste Reduction',
            'difficulty': 'Hard',
            'points': 100,
            'duration': '1 week',
            'status': 'active',
            'requirements': ['Avoid single-use plastics', 'Find sustainable alternatives', 'Daily photo documentation'],
            'tips': ['Bring reusable bags', 'Use metal/glass containers', 'Choose package-free products']
        },
        {
            '_id': 'challenge-4',
            'title': 'Tree Planting Initiative',
            'description': 'Plant and care for trees on campus to improve air quality and biodiversity.',
            'category': 'Biodiversity',
            'difficulty': 'Medium',
            'points': 80,
            'duration': '2 weeks',
            'status': 'active',
            'requirements': ['Plant minimum 3 trees', 'Create care schedule', 'Monitor growth for 2 weeks'],
            'tips': ['Choose native species', 'Proper soil preparation', 'Regular watering schedule']
        }
    ]
    
    # Demo posts
    posts_db = [
        {
            '_id': 'post-1',
            'author': {'name': 'Priya Sharma', 'department': 'Environmental Science'},
            'content': 'Just completed the Plastic-Free Week Challenge! 🌱 It was harder than expected but so rewarding. Found amazing alternatives like bamboo toothbrushes and steel straws. #PlasticFree #Sustainability',
            'timestamp': '2024-01-15T10:30:00Z',
            'likes': 15,
            'comments': [
                {'author': 'Admin', 'text': 'Great work Priya! Your dedication is inspiring.', 'timestamp': '2024-01-15T11:00:00Z'}
            ],
            'challenge_completed': 'Plastic-Free Week Challenge',
            'points_earned': 100
        },
        {
            '_id': 'post-2',
            'author': {'name': 'Rahul Kumar', 'department': 'Computer Science'},
            'content': 'Organized a campus clean-up drive with my friends! 🧹 Collected 50kg of waste and planted 5 new trees. Amazing to see how much impact we can make together! #CampusCleanup #TeamWork',
            'timestamp': '2024-01-14T14:20:00Z',
            'likes': 23,
            'comments': [],
            'challenge_completed': 'Campus Clean-up Drive',
            'points_earned': 75
        }
    ]

# Health check endpoint
@app.route('/health')
@app.route('/')
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'Windsurf Platform API is running on Render',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0-render'
    })

# Auth endpoints
@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        email = data.get('email')
        
        if email in users_db:
            return jsonify({'error': 'User already exists'}), 400
        
        user = {
            '_id': f"user-{len(users_db) + 1}",
            'name': data.get('name', 'New User'),
            'email': email,
            'role': data.get('role', 'student'),
            'department': data.get('department', 'General'),
            'year': data.get('year', '1st Year'),
            'eco_points': 0,
            'badges': [],
            'challenges_completed': 0
        }
        
        users_db[email] = user
        
        return jsonify({
            'token': f"demo-token-{user['_id']}",
            'user': user
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        
        if email in users_db:
            user = users_db[email]
            return jsonify({
                'token': f"demo-token-{user['_id']}",
                'user': user
            })
        else:
            return jsonify({'error': 'User not found'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Challenges endpoints
@app.route('/api/challenges')
def get_challenges():
    return jsonify({'challenges': challenges_db})

@app.route('/api/challenges', methods=['POST'])
def create_challenge():
    try:
        data = request.get_json()
        challenge = {
            '_id': f"challenge-{len(challenges_db) + 1}",
            'title': data.get('title', ''),
            'description': data.get('description', ''),
            'category': data.get('category', 'General'),
            'difficulty': data.get('difficulty', 'Medium'),
            'points': data.get('points', 50),
            'duration': data.get('duration', '1 week'),
            'status': 'active',
            'requirements': data.get('requirements', []),
            'tips': data.get('tips', []),
            'created_at': datetime.now().isoformat()
        }
        challenges_db.append(challenge)
        return jsonify(challenge)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Submissions endpoints
@app.route('/api/submissions', methods=['POST'])
def create_submission():
    try:
        data = request.get_json()
        submission = {
            '_id': f"submission-{len(submissions_db) + 1}",
            'student_id': data.get('student_id'),
            'challenge_id': data.get('challenge_id'),
            'proof_description': data.get('proof_description', ''),
            'proof_files': data.get('proof_files', []),
            'status': 'pending',
            'submitted_at': datetime.now().isoformat()
        }
        submissions_db.append(submission)
        return jsonify(submission)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/submissions/pending')
def get_pending_submissions():
    pending = [s for s in submissions_db if s.get('status') == 'pending']
    return jsonify({'submissions': pending})

# Leaderboard endpoint
@app.route('/api/leaderboard/global')
def get_leaderboard():
    users_list = list(users_db.values())
    sorted_users = sorted(users_list, key=lambda x: x.get('eco_points', 0), reverse=True)
    return jsonify({'leaderboard': sorted_users})

# Feed/Posts endpoints
@app.route('/api/feed')
def get_feed():
    return jsonify({'posts': posts_db})

@app.route('/api/feed', methods=['POST'])
def create_post():
    try:
        data = request.get_json()
        post = {
            '_id': f"post-{len(posts_db) + 1}",
            'content': data.get('content', ''),
            'author': data.get('author', {}),
            'timestamp': datetime.now().isoformat(),
            'likes': 0,
            'comments': [],
            'challenge_completed': data.get('challenge_completed'),
            'points_earned': data.get('points_earned', 0)
        }
        posts_db.append(post)
        return jsonify(post)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Rewards endpoints
@app.route('/api/rewards')
def get_rewards():
    rewards = [
        {'_id': 'reward-1', 'name': 'Eco Warrior Badge', 'points_required': 100, 'description': 'Complete 5 challenges'},
        {'_id': 'reward-2', 'name': 'Green Champion Trophy', 'points_required': 250, 'description': 'Earn 250 eco points'},
        {'_id': 'reward-3', 'name': 'Sustainability Certificate', 'points_required': 500, 'description': 'Complete 10 challenges'}
    ]
    return jsonify({'rewards': rewards})

if __name__ == '__main__':
    print("🚀 Starting Windsurf Platform for Render...")
    print("🌐 Environment: Production")
    print("📦 Storage: In-Memory Demo Data")
    
    # Initialize demo data
    init_demo_data()
    
    # Get port from environment (Render sets this)
    port = int(os.environ.get('PORT', 10000))
    
    # Start the server
    app.run(host='0.0.0.0', port=port, debug=False)
