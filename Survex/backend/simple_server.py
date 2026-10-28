"""
Simple Flask server for Windsurf Platform - No MongoDB required
This is a fallback server for testing when MongoDB is not available
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__)

# Enable CORS for frontend
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "http://127.0.0.1:5173"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Simple in-memory storage
users_db = {}
challenges_db = []
posts_db = []

# Initialize with demo data
def init_demo_data():
    global users_db, challenges_db, posts_db
    
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
            'badges': ['🌱 Green Beginner', '🌿 Eco Learner']
        },
        'demo.admin@college.edu': {
            '_id': 'admin-1',
            'name': 'Demo Admin',
            'email': 'demo.admin@college.edu',
            'role': 'admin',
            'department': 'Administration',
            'year': 'Faculty',
            'eco_points': 1000,
            'badges': ['🌱 Green Beginner', '🌿 Eco Learner', '🌾 Sustainability Hero']
        }
    }
    
    # Demo challenges
    challenges_db = [
        {
            '_id': 'challenge-1',
            'title': 'Campus Clean-up Drive',
            'description': 'Organize a campus-wide cleaning initiative',
            'category': 'Environment',
            'difficulty': 'Medium',
            'points': 75,
            'duration': '1 week',
            'status': 'active'
        },
        {
            '_id': 'challenge-2',
            'title': 'Energy Conservation Week',
            'description': 'Reduce energy consumption in your dorm/department',
            'category': 'Energy',
            'difficulty': 'Easy',
            'points': 50,
            'duration': '1 week',
            'status': 'active'
        }
    ]

# Health check endpoint
@app.route('/health')
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'Windsurf Platform Simple Server is running',
        'timestamp': datetime.now().isoformat()
    })

# Root endpoint
@app.route('/')
def root():
    return jsonify({
        'message': 'Windsurf Platform API',
        'version': '1.0.0-simple',
        'endpoints': {
            'health': '/health',
            'auth': '/api/auth/*',
            'challenges': '/api/challenges',
            'leaderboard': '/api/leaderboard/global'
        }
    })

# Auth endpoints
@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        email = data.get('email')
        
        if email in users_db:
            return jsonify({'error': 'User already exists'}), 400
        
        # Create new user
        user = {
            '_id': f"user-{len(users_db) + 1}",
            'name': data.get('name', 'New User'),
            'email': email,
            'role': data.get('role', 'student'),
            'department': data.get('department', 'General'),
            'year': data.get('year', '1st Year'),
            'eco_points': 0,
            'badges': []
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

# Challenges endpoint
@app.route('/api/challenges')
def get_challenges():
    return jsonify({'challenges': challenges_db})

# Leaderboard endpoint
@app.route('/api/leaderboard/global')
def get_leaderboard():
    users_list = list(users_db.values())
    sorted_users = sorted(users_list, key=lambda x: x.get('eco_points', 0), reverse=True)
    return jsonify({'leaderboard': sorted_users})

# Feed/Posts endpoint
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
            'comments': []
        }
        posts_db.append(post)
        return jsonify(post)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting Windsurf Platform Simple Server...")
    print("=" * 50)
    print("✅ No MongoDB required - using in-memory storage")
    print("🌐 Server URL: http://localhost:5000")
    print("🔗 Frontend URL: http://localhost:3000")
    print("📚 API Health: http://localhost:5000/health")
    print("=" * 50)
    
    # Initialize demo data
    init_demo_data()
    
    # Start server
    app.run(debug=True, host='0.0.0.0', port=5000)
