from pymongo import MongoClient
from bson.objectid import ObjectId
from datetime import datetime, timedelta
from config import Config

client = MongoClient(Config.MONGODB_URI)
db = client.get_default_database()
users_collection = db.users

def get_global_leaderboard(limit=100):
    """Get global leaderboard"""
    users = list(users_collection.find(
        {'role': 'student'},
        {'name': 1, 'email': 1, 'eco_points': 1, 'badges': 1, 'department': 1, 'avatar_url': 1}
    ).sort('eco_points', -1).limit(limit))
    
    # Add rank
    for idx, user in enumerate(users, 1):
        user['rank'] = idx
    
    return users

def get_department_leaderboard(department, limit=50):
    """Get leaderboard for a specific department"""
    users = list(users_collection.find(
        {'role': 'student', 'department': department},
        {'name': 1, 'email': 1, 'eco_points': 1, 'badges': 1, 'department': 1, 'avatar_url': 1}
    ).sort('eco_points', -1).limit(limit))
    
    # Add rank
    for idx, user in enumerate(users, 1):
        user['rank'] = idx
    
    return users

def get_weekly_leaderboard(limit=50):
    """Get weekly leaderboard based on recent activity"""
    # This requires tracking weekly points separately
    # For now, we'll use a simplified version
    one_week_ago = datetime.utcnow() - timedelta(days=7)
    
    # Get recent submissions
    from models.submission import submissions_collection
    
    pipeline = [
        {
            '$match': {
                'verification_status': 'verified',
                'verified_at': {'$gte': one_week_ago}
            }
        },
        {
            '$lookup': {
                'from': 'challenges',
                'localField': 'challenge_id',
                'foreignField': '_id',
                'as': 'challenge'
            }
        },
        {'$unwind': '$challenge'},
        {
            '$group': {
                '_id': '$student_id',
                'weekly_points': {'$sum': '$challenge.points'}
            }
        },
        {'$sort': {'weekly_points': -1}},
        {'$limit': limit}
    ]
    
    weekly_stats = list(submissions_collection.aggregate(pipeline))
    
    # Enrich with user data
    leaderboard = []
    for idx, stat in enumerate(weekly_stats, 1):
        user = users_collection.find_one({'_id': ObjectId(stat['_id'])})
        if user:
            leaderboard.append({
                '_id': user['_id'],
                'name': user['name'],
                'email': user['email'],
                'department': user.get('department'),
                'avatar_url': user.get('avatar_url'),
                'weekly_points': stat['weekly_points'],
                'rank': idx
            })
    
    return leaderboard

def get_user_rank(user_id):
    """Get user's current rank"""
    user = users_collection.find_one({'_id': ObjectId(user_id)})
    if not user:
        return None
    
    # Count users with higher points
    higher_rank_count = users_collection.count_documents({
        'role': 'student',
        'eco_points': {'$gt': user.get('eco_points', 0)}
    })
    
    return higher_rank_count + 1

def get_department_rankings():
    """Get aggregated department rankings"""
    pipeline = [
        {'$match': {'role': 'student'}},
        {
            '$group': {
                '_id': '$department',
                'total_points': {'$sum': '$eco_points'},
                'student_count': {'$sum': 1},
                'avg_points': {'$avg': '$eco_points'}
            }
        },
        {'$sort': {'total_points': -1}}
    ]
    
    return list(users_collection.aggregate(pipeline))
