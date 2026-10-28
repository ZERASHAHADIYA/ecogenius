from pymongo import MongoClient
from bson.objectid import ObjectId
from datetime import datetime
from config import Config

client = MongoClient(Config.MONGODB_URI)
db = client.get_default_database()
challenges_collection = db.challenges

def create_challenge(title, category, description, points, deadline, created_by):
    """Create a new challenge"""
    challenge = {
        'title': title,
        'category': category,
        'description': description,
        'points': points,
        'deadline': deadline,
        'status': 'active',
        'created_by': created_by,
        'created_at': datetime.utcnow(),
        'participants': [],
        'completions': 0
    }
    
    result = challenges_collection.insert_one(challenge)
    challenge['_id'] = result.inserted_id
    return challenge

def get_challenge_by_id(challenge_id):
    """Get challenge by ID"""
    return challenges_collection.find_one({'_id': ObjectId(challenge_id)})

def get_all_challenges(status=None, category=None):
    """Get all challenges with optional filters"""
    query = {}
    if status:
        query['status'] = status
    if category:
        query['category'] = category
    
    return list(challenges_collection.find(query).sort('created_at', -1))

def update_challenge(challenge_id, updates):
    """Update challenge"""
    challenges_collection.update_one(
        {'_id': ObjectId(challenge_id)},
        {'$set': updates}
    )
    return get_challenge_by_id(challenge_id)

def delete_challenge(challenge_id):
    """Delete/Archive challenge"""
    challenges_collection.update_one(
        {'_id': ObjectId(challenge_id)},
        {'$set': {'status': 'archived'}}
    )
    return True

def join_challenge(challenge_id, user_id):
    """User joins a challenge"""
    challenges_collection.update_one(
        {'_id': ObjectId(challenge_id)},
        {'$addToSet': {'participants': str(user_id)}}
    )
    return True

def complete_challenge(challenge_id):
    """Increment completion count"""
    challenges_collection.update_one(
        {'_id': ObjectId(challenge_id)},
        {'$inc': {'completions': 1}}
    )
    return True

def get_challenge_stats():
    """Get challenge statistics"""
    total = challenges_collection.count_documents({})
    active = challenges_collection.count_documents({'status': 'active'})
    
    # Get participation by category
    pipeline = [
        {'$match': {'status': 'active'}},
        {'$group': {
            '_id': '$category',
            'count': {'$sum': 1},
            'total_participants': {'$sum': {'$size': '$participants'}}
        }}
    ]
    category_stats = list(challenges_collection.aggregate(pipeline))
    
    return {
        'total_challenges': total,
        'active_challenges': active,
        'category_breakdown': category_stats
    }
