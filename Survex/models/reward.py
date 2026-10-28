from pymongo import MongoClient
from bson.objectid import ObjectId
from datetime import datetime
from config import Config

client = MongoClient(Config.MONGODB_URI)
db = client.get_default_database()
rewards_collection = db.rewards

def create_reward(title, description, points_required, category='certificate', stock=None):
    """Create a new reward"""
    reward = {
        'title': title,
        'description': description,
        'points_required': points_required,
        'category': category,  # certificate, eco-merch, meal-token, etc.
        'stock': stock,
        'claimed_by': [],
        'created_at': datetime.utcnow(),
        'active': True
    }
    
    result = rewards_collection.insert_one(reward)
    reward['_id'] = result.inserted_id
    return reward

def get_reward_by_id(reward_id):
    """Get reward by ID"""
    return rewards_collection.find_one({'_id': ObjectId(reward_id)})

def get_all_rewards(active_only=True):
    """Get all rewards"""
    query = {'active': True} if active_only else {}
    return list(rewards_collection.find(query).sort('points_required', 1))

def get_available_rewards(user_points):
    """Get rewards available for user based on points"""
    return list(rewards_collection.find({
        'active': True,
        'points_required': {'$lte': user_points}
    }).sort('points_required', 1))

def claim_reward(reward_id, user_id):
    """Claim a reward"""
    reward = get_reward_by_id(reward_id)
    
    if not reward or not reward.get('active'):
        return {'success': False, 'error': 'Reward not available'}
    
    # Check stock
    if reward.get('stock') is not None:
        if reward['stock'] <= 0:
            return {'success': False, 'error': 'Out of stock'}
        
        # Decrement stock
        rewards_collection.update_one(
            {'_id': ObjectId(reward_id)},
            {'$inc': {'stock': -1}}
        )
    
    # Add to claimed_by
    claim = {
        'user_id': str(user_id),
        'claimed_at': datetime.utcnow()
    }
    
    rewards_collection.update_one(
        {'_id': ObjectId(reward_id)},
        {'$push': {'claimed_by': claim}}
    )
    
    return {'success': True, 'reward': reward}

def update_reward(reward_id, updates):
    """Update reward details"""
    rewards_collection.update_one(
        {'_id': ObjectId(reward_id)},
        {'$set': updates}
    )
    return get_reward_by_id(reward_id)

def get_user_claimed_rewards(user_id):
    """Get rewards claimed by a user"""
    rewards = list(rewards_collection.find({
        'claimed_by.user_id': str(user_id)
    }))
    
    user_claims = []
    for reward in rewards:
        for claim in reward.get('claimed_by', []):
            if claim['user_id'] == str(user_id):
                user_claims.append({
                    'reward': reward,
                    'claimed_at': claim['claimed_at']
                })
    
    return user_claims

def get_reward_stats():
    """Get reward statistics"""
    total = rewards_collection.count_documents({})
    active = rewards_collection.count_documents({'active': True})
    
    # Total claims
    pipeline = [
        {'$project': {
            'title': 1,
            'claims_count': {'$size': '$claimed_by'}
        }},
        {'$group': {
            '_id': None,
            'total_claims': {'$sum': '$claims_count'}
        }}
    ]
    
    result = list(rewards_collection.aggregate(pipeline))
    total_claims = result[0]['total_claims'] if result else 0
    
    return {
        'total_rewards': total,
        'active_rewards': active,
        'total_claims': total_claims
    }
