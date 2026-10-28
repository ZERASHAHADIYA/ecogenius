from flask import Blueprint, request, jsonify
from models.user import users_collection
from models.challenge import get_challenge_stats
from models.submission import get_submission_stats
from models.reward import get_reward_stats
from models.leaderboard import get_department_rankings
from utils.jwt_helper import token_required, role_required
from bson import json_util
import json

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/overview', methods=['GET'])
@token_required
@role_required(['admin', 'faculty'])
def get_overview():
    """Get analytics overview dashboard"""
    
    # User statistics
    total_students = users_collection.count_documents({'role': 'student'})
    total_faculty = users_collection.count_documents({'role': 'faculty'})
    
    # Get active students (students who have made at least one submission)
    from models.submission import submissions_collection
    active_students = len(submissions_collection.distinct('student_id'))
    
    # Challenge statistics
    challenge_stats = get_challenge_stats()
    
    # Submission statistics
    submission_stats = get_submission_stats()
    
    # Reward statistics
    reward_stats = get_reward_stats()
    
    # Department rankings
    department_stats = get_department_rankings()
    
    # Calculate participation rate
    participation_rate = (active_students / total_students * 100) if total_students > 0 else 0
    
    overview = {
        'users': {
            'total_students': total_students,
            'active_students': active_students,
            'total_faculty': total_faculty,
            'participation_rate': round(participation_rate, 2)
        },
        'challenges': challenge_stats,
        'submissions': submission_stats,
        'rewards': reward_stats,
        'departments': json.loads(json_util.dumps(department_stats))
    }
    
    return jsonify({'analytics': overview}), 200

@analytics_bp.route('/participation', methods=['GET'])
@token_required
@role_required(['admin', 'faculty'])
def get_participation_data():
    """Get detailed participation data"""
    from datetime import datetime, timedelta
    
    # Get submissions over time
    from models.submission import submissions_collection
    
    # Last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    pipeline = [
        {
            '$match': {
                'timestamp': {'$gte': thirty_days_ago}
            }
        },
        {
            '$group': {
                '_id': {
                    'year': {'$year': '$timestamp'},
                    'month': {'$month': '$timestamp'},
                    'day': {'$dayOfMonth': '$timestamp'}
                },
                'count': {'$sum': 1}
            }
        },
        {'$sort': {'_id': 1}}
    ]
    
    daily_submissions = list(submissions_collection.aggregate(pipeline))
    
    return jsonify({
        'daily_submissions': json.loads(json_util.dumps(daily_submissions))
    }), 200

@analytics_bp.route('/impact', methods=['GET'])
@token_required
@role_required(['admin', 'faculty'])
def get_environmental_impact():
    """Get environmental impact metrics"""
    from models.challenge import challenges_collection
    
    # Calculate impact based on completed challenges
    # This is simplified - real calculations would need actual data
    
    pipeline = [
        {
            '$group': {
                '_id': '$category',
                'total_completions': {'$sum': '$completions'}
            }
        }
    ]
    
    category_impact = list(challenges_collection.aggregate(pipeline))
    
    # Rough estimates for demonstration
    impact_metrics = {
        'co2_saved_kg': 0,
        'water_saved_liters': 0,
        'energy_saved_kwh': 0,
        'waste_recycled_kg': 0,
        'trees_planted': 0
    }
    
    for category in category_impact:
        completions = category['total_completions']
        cat_name = category['_id']
        
        # Rough estimates per completion
        if cat_name == 'Energy Conservation':
            impact_metrics['energy_saved_kwh'] += completions * 5
            impact_metrics['co2_saved_kg'] += completions * 2
        elif cat_name == 'Water Conservation':
            impact_metrics['water_saved_liters'] += completions * 100
        elif cat_name == 'Waste Management':
            impact_metrics['waste_recycled_kg'] += completions * 10
        elif cat_name == 'Green Campus Activities':
            impact_metrics['trees_planted'] += completions * 1
    
    return jsonify({
        'impact': impact_metrics,
        'category_breakdown': json.loads(json_util.dumps(category_impact))
    }), 200

@analytics_bp.route('/export', methods=['GET'])
@token_required
@role_required(['admin'])
def export_data():
    """Export data for reports (admin only)"""
    export_type = request.args.get('type', 'leaderboard')
    
    if export_type == 'leaderboard':
        from models.leaderboard import get_global_leaderboard
        data = get_global_leaderboard(1000)
    elif export_type == 'submissions':
        from models.submission import submissions_collection
        data = list(submissions_collection.find())
    elif export_type == 'challenges':
        from models.challenge import challenges_collection
        data = list(challenges_collection.find())
    else:
        return jsonify({'error': 'Invalid export type'}), 400
    
    return jsonify({'data': json.loads(json_util.dumps(data))}), 200
