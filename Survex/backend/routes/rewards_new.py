from flask import Blueprint, request, jsonify
from simple_db import db
from config import Config
import jwt
from datetime import datetime

rewards_bp = Blueprint('rewards', __name__)

def get_user_from_token():
    """Extract user from JWT token"""
    try:
        token = request.headers.get('Authorization')
        if token and token.startswith('Bearer '):
            token = token[7:]
            payload = jwt.decode(token, Config.JWT_SECRET, algorithms=['HS256'])
            return db.find_one('users', {'_id': payload['user_id']})
    except:
        pass
    return None

@rewards_bp.route('', methods=['GET'])
def get_rewards():
    """Get all available rewards"""
    try:
        rewards = db.find('rewards', {'active': True})
        return jsonify({'rewards': rewards}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@rewards_bp.route('/available', methods=['GET'])
def get_available_rewards():
    """Get rewards available for current user"""
    try:
        user = get_user_from_token()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        
        rewards = db.find('rewards', {'active': True})
        user_points = user.get('eco_points', 0)
        
        # Mark which rewards user can afford
        for reward in rewards:
            reward['can_afford'] = user_points >= reward['cost']
        
        return jsonify({
            'rewards': rewards,
            'user_points': user_points
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@rewards_bp.route('/<reward_id>/claim', methods=['POST'])
def claim_reward(reward_id):
    """Claim a reward"""
    try:
        user = get_user_from_token()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        
        reward = db.find_one('rewards', {'_id': reward_id})
        if not reward:
            return jsonify({'error': 'Reward not found'}), 404
        
        if not reward.get('active', False):
            return jsonify({'error': 'Reward not available'}), 400
        
        user_points = user.get('eco_points', 0)
        if user_points < reward['cost']:
            return jsonify({'error': 'Insufficient points'}), 400
        
        if reward.get('stock', 0) <= 0:
            return jsonify({'error': 'Reward out of stock'}), 400
        
        # Deduct points from user
        new_points = user_points - reward['cost']
        db.update_one('users', {'_id': user['_id']}, {'$set': {'eco_points': new_points}})
        
        # Reduce stock
        new_stock = reward.get('stock', 1) - 1
        db.update_one('rewards', {'_id': reward_id}, {'$set': {'stock': new_stock}})
        
        # Create claim record
        claim_data = {
            'user_id': user['_id'],
            'reward_id': reward_id,
            'reward_title': reward['title'],
            'cost': reward['cost'],
            'claimed_at': datetime.now().isoformat(),
            'status': 'claimed'
        }
        
        claim_id = db.insert_one('claims', claim_data)
        
        return jsonify({
            'message': 'Reward claimed successfully',
            'new_points': new_points,
            'claim_id': claim_id
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@rewards_bp.route('/my-claims', methods=['GET'])
def get_my_claims():
    """Get user's claimed rewards"""
    try:
        user = get_user_from_token()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        
        claims = db.find('claims', {'user_id': user['_id']})
        return jsonify({'claims': claims}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
