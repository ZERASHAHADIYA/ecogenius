from pymongo import MongoClient
from bson.objectid import ObjectId
from datetime import datetime
from config import Config

client = MongoClient(Config.MONGODB_URI)
db = client.get_default_database()
posts_collection = db.posts

def create_post(student_id, content, media_url=None, post_type='manual', challenge_id=None):
    """Create a new post"""
    post = {
        'student_id': str(student_id),
        'content': content,
        'media_url': media_url,
        'post_type': post_type,  # 'manual' or 'challenge_completion'
        'challenge_id': str(challenge_id) if challenge_id else None,
        'likes': [],
        'comments': [],
        'shares': 0,
        'timestamp': datetime.utcnow()
    }
    
    result = posts_collection.insert_one(post)
    post['_id'] = result.inserted_id
    return post

def get_post_by_id(post_id):
    """Get post by ID"""
    return posts_collection.find_one({'_id': ObjectId(post_id)})

def get_all_posts(limit=50, skip=0, filter_by=None):
    """Get all posts with pagination"""
    query = {}
    
    if filter_by:
        if filter_by.get('student_id'):
            query['student_id'] = str(filter_by['student_id'])
        if filter_by.get('post_type'):
            query['post_type'] = filter_by['post_type']
    
    return list(posts_collection.find(query)
                .sort('timestamp', -1)
                .skip(skip)
                .limit(limit))

def get_trending_posts(limit=20):
    """Get trending posts based on likes and comments"""
    pipeline = [
        {
            '$addFields': {
                'engagement': {
                    '$add': [
                        {'$size': '$likes'},
                        {'$multiply': [{'$size': '$comments'}, 2]},
                        {'$divide': ['$shares', 2]}
                    ]
                }
            }
        },
        {'$sort': {'engagement': -1}},
        {'$limit': limit}
    ]
    
    return list(posts_collection.aggregate(pipeline))

def like_post(post_id, user_id):
    """Like a post"""
    post = get_post_by_id(post_id)
    if str(user_id) in post.get('likes', []):
        # Unlike
        posts_collection.update_one(
            {'_id': ObjectId(post_id)},
            {'$pull': {'likes': str(user_id)}}
        )
        return {'liked': False}
    else:
        # Like
        posts_collection.update_one(
            {'_id': ObjectId(post_id)},
            {'$addToSet': {'likes': str(user_id)}}
        )
        return {'liked': True}

def add_comment(post_id, user_id, comment_text):
    """Add a comment to a post"""
    comment = {
        'user_id': str(user_id),
        'text': comment_text,
        'timestamp': datetime.utcnow()
    }
    
    posts_collection.update_one(
        {'_id': ObjectId(post_id)},
        {'$push': {'comments': comment}}
    )
    
    return comment

def share_post(post_id):
    """Increment share count"""
    posts_collection.update_one(
        {'_id': ObjectId(post_id)},
        {'$inc': {'shares': 1}}
    )
    return True

def delete_post(post_id, user_id):
    """Delete a post (only by owner)"""
    result = posts_collection.delete_one({
        '_id': ObjectId(post_id),
        'student_id': str(user_id)
    })
    return result.deleted_count > 0

def get_posts_by_department(department, limit=50):
    """Get posts from students in a specific department"""
    from models.user import users_collection
    
    # Get users in department
    users = users_collection.find({'department': department}, {'_id': 1})
    user_ids = [str(u['_id']) for u in users]
    
    return list(posts_collection.find({'student_id': {'$in': user_ids}})
                .sort('timestamp', -1)
                .limit(limit))
