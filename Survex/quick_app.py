from flask import Flask, request, jsonify
from flask_cors import CORS
import bcrypt
import jwt
from datetime import datetime

app = Flask(__name__)
CORS(app)

JWT_SECRET = 'dev-secret-key'

def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password, hashed):
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

# PRE-EXISTING USERS - You can sign in with these immediately!
users = [
    {
        'id': '1',
        'name': 'John Doe',
        'email': 'john.doe@student.college.edu',
        'password': hash_password('password123'),
        'role': 'student',
        'department': 'Computer Science Engineering',
        'year': '3rd Year',
        'eco_points': 250,
        'badges': ['🌱 Green Beginner', '🌿 Eco Learner']
    },
    {
        'id': '2',
        'name': 'Admin User',
        'email': 'admin@student.college.edu',
        'password': hash_password('admin123'),
        'role': 'admin',
        'department': 'Administration',
        'year': 'Faculty',
        'eco_points': 1000,
        'badges': ['🌱 Green Beginner', '🌿 Eco Learner', '🌾 Sustainability Hero']
    },
    {
        'id': '3',
        'name': 'Faculty Member',
        'email': 'faculty@student.college.edu',
        'password': hash_password('faculty123'),
        'role': 'faculty',
        'department': 'Environmental Science',
        'year': 'Faculty',
        'eco_points': 500,
        'badges': ['🌱 Green Beginner', '🌿 Eco Learner']
    }
]

challenges = [
    {
        'id': '1',
        'title': 'Campus Clean-Up Drive',
        'description': 'Participate in cleaning common areas and report with photos',
        'category': 'Waste Management',
        'points': 50,
        'status': 'active'
    },
    {
        'id': '2',
        'title': 'Plant a Tree',
        'description': 'Plant and maintain a tree on campus',
        'category': 'Green Campus Activities',
        'points': 100,
        'status': 'active'
    },
    {
        'id': '3',
        'title': 'Energy Conservation Week',
        'description': 'Document energy-saving practices in your dorm/class',
        'category': 'Energy Conservation',
        'points': 75,
        'status': 'active'
    }
]

posts = [
    {
        'id': '1',
        'content': 'Just completed the campus clean-up challenge! 🌱',
        'student': {'name': 'John Doe', 'department': 'CSE'},
        'timestamp': '2024-10-05T10:30:00',
        'likes': 15,
        'comments': 3
    },
    {
        'id': '2',
        'content': 'Planted my first tree today! Feeling proud 🌳',
        'student': {'name': 'Jane Smith', 'department': 'ECE'},
        'timestamp': '2024-10-05T09:15:00',
        'likes': 22,
        'comments': 5
    }
]

@app.route('/health')
def health():
    return jsonify({
        'status': 'healthy',
        'message': 'Windsurf API is running',
        'version': '1.0.0'
    })

@app.route('/')
def home():
    return jsonify({
        'endpoints': {
            'auth': '/api/auth',
            'challenges': '/api/challenges',
            'health': '/health'
        },
        'message': 'Welcome to Windsurf - Campus Sustainability Platform API',
        'version': '1.0.0',
        'demo_users': [
            {'email': 'john.doe@student.college.edu', 'password': 'password123', 'role': 'student'},
            {'email': 'admin@student.college.edu', 'password': 'admin123', 'role': 'admin'},
            {'email': 'faculty@student.college.edu', 'password': 'faculty123', 'role': 'faculty'}
        ]
    })

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password required'}), 400
        
        # Find user
        user = next((u for u in users if u['email'] == data['email']), None)
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Verify password
        if not verify_password(data['password'], user['password']):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Generate token
        token = jwt.encode({
            'user_id': user['id'],
            'email': user['email']
        }, JWT_SECRET, algorithm='HS256')
        
        # Return user without password
        user_response = {k: v for k, v in user.items() if k != 'password'}
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': user_response
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Check if user exists
        if any(user['email'] == data['email'] for user in users):
            return jsonify({'error': 'User already exists'}), 400
        
        # Create user
        user = {
            'id': str(len(users) + 1),
            'name': data['name'],
            'email': data['email'],
            'password': hash_password(data['password']),
            'role': data['role'],
            'department': data.get('department', ''),
            'year': data.get('year', ''),
            'eco_points': 0,
            'badges': ['🌱 Green Beginner']
        }
        
        users.append(user)
        
        # Generate token
        token = jwt.encode({
            'user_id': user['id'],
            'email': user['email']
        }, JWT_SECRET, algorithm='HS256')
        
        user_response = {k: v for k, v in user.items() if k != 'password'}
        
        return jsonify({
            'message': 'User registered successfully',
            'token': token,
            'user': user_response
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/challenges')
def get_challenges():
    return jsonify({'challenges': challenges})

@app.route('/api/feed')
def get_feed():
    return jsonify({'posts': posts})

@app.route('/api/rewards')
def get_rewards():
    rewards = [
        {'id': '1', 'title': 'Eco Certificate', 'cost': 100, 'type': 'certificate'},
        {'id': '2', 'title': 'Meal Token', 'cost': 200, 'type': 'meal'},
        {'id': '3', 'title': 'Eco Merchandise', 'cost': 300, 'type': 'merchandise'}
    ]
    return jsonify({'rewards': rewards})

@app.route('/api/leaderboard/global')
def get_leaderboard():
    sorted_users = sorted(users, key=lambda x: x.get('eco_points', 0), reverse=True)
    leaderboard = [{k: v for k, v in user.items() if k != 'password'} for user in sorted_users]
    return jsonify({'leaderboard': leaderboard})

if __name__ == '__main__':
    print("🌿 Starting Windsurf Backend with Demo Users...")
    print("📧 Demo Login Credentials:")
    print("   Student: john.doe@student.college.edu / password123")
    print("   Admin: admin@student.college.edu / admin123")
    print("   Faculty: faculty@student.college.edu / faculty123")
    print("🚀 Server running on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
