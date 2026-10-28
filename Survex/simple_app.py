from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
import os

from simple_db import db
from simple_auth import auth_bp

app = Flask(__name__)
app.config.from_object(Config)
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

# Register auth blueprint
app.register_blueprint(auth_bp, url_prefix='/api/auth')

# Health check endpoint
@app.route('/health')
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'Windsurf API is running',
        'version': '1.0.0'
    })

# API info endpoint
@app.route('/')
def api_info():
    return jsonify({
        'endpoints': {
            'analytics': '/api/analytics',
            'auth': '/api/auth',
            'challenges': '/api/challenges',
            'feed': '/api/feed',
            'leaderboard': '/api/leaderboard',
            'rewards': '/api/rewards',
            'submissions': '/api/submissions',
            'users': '/api/users'
        },
        'message': 'Welcome to Windsurf - Campus Sustainability Platform API',
        'version': '1.0.0'
    })

# Simple challenges endpoint
@app.route('/api/challenges')
def get_challenges():
    challenges = db.find('challenges')
    return jsonify({'challenges': challenges})

# Simple feed endpoint
@app.route('/api/feed')
def get_feed():
    posts = db.find('posts')
    return jsonify({'posts': posts})

# Simple rewards endpoint
@app.route('/api/rewards')
def get_rewards():
    rewards = db.find('rewards')
    return jsonify({'rewards': rewards})

# Simple leaderboard endpoint
@app.route('/api/leaderboard/global')
def get_leaderboard():
    users = db.find('users')
    # Sort by eco_points
    sorted_users = sorted(users, key=lambda x: x.get('eco_points', 0), reverse=True)
    return jsonify({'leaderboard': sorted_users[:10]})

if __name__ == '__main__':
    print("🌿 Starting Windsurf Backend Server...")
    print("📊 Database: Simple JSON-based storage")
    print("🔗 CORS: Enabled for localhost:3000")
    print("🚀 Server starting on http://localhost:5000")
    
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True,
        threaded=True
    )
