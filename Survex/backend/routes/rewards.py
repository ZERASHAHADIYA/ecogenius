from flask import Blueprint, request, jsonify
from models.reward import (
    create_reward, get_reward_by_id, get_all_rewards, get_available_rewards,
    claim_reward, update_reward, get_user_claimed_rewards, get_reward_stats
)
from models.user import get_user_by_id, update_user_points
from utils.jwt_helper import token_required, role_required
from bson import json_util
import json

rewards_bp = Blueprint('rewards', __name__)

@rewards_bp.route('/', methods=['GET'])
@token_required
def get_rewards():
    """Get all rewards"""
    active_only = request.args.get('active_only', 'true').lower() == 'true'
    rewards = get_all_rewards(active_only)
    
    return jsonify({'rewards': json.loads(json_util.dumps(rewards))}), 200

@rewards_bp.route('/available', methods=['GET'])
@token_required
def get_available():
    """Get rewards available for current user"""
    user = get_user_by_id(request.user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    user_points = user.get('eco_points', 0)
    rewards = get_available_rewards(user_points)
    
    return jsonify({
        'rewards': json.loads(json_util.dumps(rewards)),
        'user_points': user_points
    }), 200

@rewards_bp.route('/<reward_id>', methods=['GET'])
@token_required
def get_reward(reward_id):
    """Get a specific reward"""
    reward = get_reward_by_id(reward_id)
    
    if not reward:
        return jsonify({'error': 'Reward not found'}), 404
    
    return jsonify({'reward': json.loads(json_util.dumps(reward))}), 200

@rewards_bp.route('/', methods=['POST'])
@token_required
@role_required(['admin'])
def create_new_reward():
    """Create a new reward (admin only)"""
    data = request.get_json()
    
    required_fields = ['title', 'description', 'points_required']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    reward = create_reward(
        title=data['title'],
        description=data['description'],
        points_required=data['points_required'],
        category=data.get('category', 'certificate'),
        stock=data.get('stock')
    )
    
    return jsonify({
        'message': 'Reward created successfully',
        'reward': json.loads(json_util.dumps(reward))
    }), 201

@rewards_bp.route('/<reward_id>', methods=['PUT'])
@token_required
@role_required(['admin'])
def update_existing_reward(reward_id):
    """Update a reward (admin only)"""
    data = request.get_json()
    
    reward = update_reward(reward_id, data)
    
    if not reward:
        return jsonify({'error': 'Reward not found'}), 404
    
    return jsonify({
        'message': 'Reward updated successfully',
        'reward': json.loads(json_util.dumps(reward))
    }), 200

@rewards_bp.route('/<reward_id>/claim', methods=['POST'])
@token_required
def claim_reward_route(reward_id):
    """Claim a reward"""
    user = get_user_by_id(request.user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    reward = get_reward_by_id(reward_id)
    
    if not reward:
        return jsonify({'error': 'Reward not found'}), 404
    
    # Check if user has enough points
    user_points = user.get('eco_points', 0)
    if user_points < reward['points_required']:
        return jsonify({'error': 'Insufficient points'}), 400
    
    # Claim reward
    result = claim_reward(reward_id, request.user_id)
    
    if not result['success']:
        return jsonify({'error': result['error']}), 400
    
    # Deduct points
    update_user_points(request.user_id, -reward['points_required'])
    
    return jsonify({
        'message': 'Reward claimed successfully',
        'reward': json.loads(json_util.dumps(result['reward']))
    }), 200

@rewards_bp.route('/my-claims', methods=['GET'])
@token_required
def get_my_claims():
    """Get rewards claimed by current user"""
    claims = get_user_claimed_rewards(request.user_id)
    
    return jsonify({'claims': json.loads(json_util.dumps(claims))}), 200

@rewards_bp.route('/stats', methods=['GET'])
@token_required
@role_required(['admin', 'faculty'])
def get_stats():
    """Get reward statistics"""
    stats = get_reward_stats()
    return jsonify({'stats': stats}), 200
