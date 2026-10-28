from flask import Blueprint, request, jsonify
from models.leaderboard import (
    get_global_leaderboard, get_department_leaderboard, get_weekly_leaderboard,
    get_user_rank, get_department_rankings
)
from utils.jwt_helper import token_required
from bson import json_util
import json

leaderboard_bp = Blueprint('leaderboard', __name__)

@leaderboard_bp.route('/global', methods=['GET'])
@token_required
def get_global():
    """Get global leaderboard"""
    limit = int(request.args.get('limit', 100))
    leaderboard = get_global_leaderboard(limit)
    
    return jsonify({'leaderboard': json.loads(json_util.dumps(leaderboard))}), 200

@leaderboard_bp.route('/department/<department>', methods=['GET'])
@token_required
def get_department(department):
    """Get department leaderboard"""
    limit = int(request.args.get('limit', 50))
    leaderboard = get_department_leaderboard(department, limit)
    
    return jsonify({'leaderboard': json.loads(json_util.dumps(leaderboard))}), 200

@leaderboard_bp.route('/weekly', methods=['GET'])
@token_required
def get_weekly():
    """Get weekly leaderboard"""
    limit = int(request.args.get('limit', 50))
    leaderboard = get_weekly_leaderboard(limit)
    
    return jsonify({'leaderboard': json.loads(json_util.dumps(leaderboard))}), 200

@leaderboard_bp.route('/departments', methods=['GET'])
@token_required
def get_departments():
    """Get department rankings"""
    rankings = get_department_rankings()
    
    return jsonify({'rankings': json.loads(json_util.dumps(rankings))}), 200

@leaderboard_bp.route('/rank/<user_id>', methods=['GET'])
@token_required
def get_rank(user_id):
    """Get user's rank"""
    rank = get_user_rank(user_id)
    
    if rank is None:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({'rank': rank}), 200
