"""
Main API handler for Vercel serverless deployment
Windsurf Platform - Full-stack Vercel deployment
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
from datetime import datetime

# Initialize Flask app
app = Flask(__name__)

# Enable CORS for Vercel deployment
CORS(app, resources={
    r"/*": {
        "origins": ["*"],  # Vercel handles CORS properly
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# In-memory storage for demo (Vercel serverless functions are stateless)
# In production, you'd use a database like Vercel KV, Supabase, or MongoDB Atlas

def get_demo_data():
    """Get demo data - in production this would come from a database"""
    return {
        'users': {
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
        },
        'challenges': [
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
        ],
        'posts': [
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
    }

# Routes
@app.route('/')
@app.route('/health')
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'Windsurf Platform API is running on Vercel',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0-vercel'
    })

@app.route('/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        demo_data = get_demo_data()
        
        email = data.get('email')
        if email in demo_data['users']:
            return jsonify({'error': 'User already exists'}), 400
        
        user = {
            '_id': f"user-{len(demo_data['users']) + 1}",
            'name': data.get('name', 'New User'),
            'email': email,
            'role': data.get('role', 'student'),
            'department': data.get('department', 'General'),
            'year': data.get('year', '1st Year'),
            'eco_points': 0,
            'badges': [],
            'challenges_completed': 0
        }
        
        return jsonify({
            'token': f"demo-token-{user['_id']}",
            'user': user
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        demo_data = get_demo_data()
        
        email = data.get('email')
        if email in demo_data['users']:
            user = demo_data['users'][email]
            return jsonify({
                'token': f"demo-token-{user['_id']}",
                'user': user
            })
        else:
            return jsonify({'error': 'User not found'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/challenges')
def get_challenges():
    demo_data = get_demo_data()
    return jsonify({'challenges': demo_data['challenges']})

@app.route('/challenges', methods=['POST'])
def create_challenge():
    try:
        data = request.get_json()
        demo_data = get_demo_data()
        
        challenge = {
            '_id': f"challenge-{len(demo_data['challenges']) + 1}",
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
        
        return jsonify(challenge)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/leaderboard/global')
def get_leaderboard():
    demo_data = get_demo_data()
    users_list = list(demo_data['users'].values())
    sorted_users = sorted(users_list, key=lambda x: x.get('eco_points', 0), reverse=True)
    return jsonify({'leaderboard': sorted_users})

@app.route('/feed')
def get_feed():
    demo_data = get_demo_data()
    return jsonify({'posts': demo_data['posts']})

@app.route('/feed', methods=['POST'])
def create_post():
    try:
        data = request.get_json()
        demo_data = get_demo_data()
        
        post = {
            '_id': f"post-{len(demo_data['posts']) + 1}",
            'content': data.get('content', ''),
            'author': data.get('author', {}),
            'timestamp': datetime.now().isoformat(),
            'likes': 0,
            'comments': [],
            'challenge_completed': data.get('challenge_completed'),
            'points_earned': data.get('points_earned', 0)
        }
        
        return jsonify(post)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/rewards')
def get_rewards():
    rewards = [
        {'_id': 'reward-1', 'name': 'Eco Warrior Badge', 'points_required': 100, 'description': 'Complete 5 challenges'},
        {'_id': 'reward-2', 'name': 'Green Champion Trophy', 'points_required': 250, 'description': 'Earn 250 eco points'},
        {'_id': 'reward-3', 'name': 'Sustainability Certificate', 'points_required': 500, 'description': 'Complete 10 challenges'}
    ]
    return jsonify({'rewards': rewards})

@app.route('/submissions', methods=['POST'])
def create_submission():
    try:
        data = request.get_json()
        submission = {
            '_id': f"submission-{datetime.now().timestamp()}",
            'student_id': data.get('student_id'),
            'challenge_id': data.get('challenge_id'),
            'proof_description': data.get('proof_description', ''),
            'proof_files': data.get('proof_files', []),
            'status': 'pending',
            'submitted_at': datetime.now().isoformat()
        }
        return jsonify(submission)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/submissions/pending')
def get_pending_submissions():
    # Return empty list for demo - in production this would query database
    return jsonify({'submissions': []})

# Vercel serverless function handler
def handler(request):
    return app(request.environ, lambda status, headers: None)

# For local testing
if __name__ == '__main__':
    app.run(debug=True)
