from pymongo import MongoClient
from bson.objectid import ObjectId
from datetime import datetime
from config import Config

client = MongoClient(Config.MONGODB_URI)
db = client.get_default_database()
submissions_collection = db.submissions

def create_submission(challenge_id, student_id, media_url, caption=None, location=None):
    """Create a new submission"""
    submission = {
        'challenge_id': str(challenge_id),
        'student_id': str(student_id),
        'media_url': media_url,
        'caption': caption,
        'location': location,
        'timestamp': datetime.utcnow(),
        'verification_status': 'pending',
        'faculty_comment': None,
        'verified_by': None,
        'verified_at': None
    }
    
    result = submissions_collection.insert_one(submission)
    submission['_id'] = result.inserted_id
    return submission

def get_submission_by_id(submission_id):
    """Get submission by ID"""
    return submissions_collection.find_one({'_id': ObjectId(submission_id)})

def get_submissions_by_challenge(challenge_id, status=None):
    """Get all submissions for a challenge"""
    query = {'challenge_id': str(challenge_id)}
    if status:
        query['verification_status'] = status
    
    return list(submissions_collection.find(query).sort('timestamp', -1))

def get_submissions_by_student(student_id, status=None):
    """Get all submissions by a student"""
    query = {'student_id': str(student_id)}
    if status:
        query['verification_status'] = status
    
    return list(submissions_collection.find(query).sort('timestamp', -1))

def get_pending_submissions():
    """Get all pending submissions for verification"""
    return list(submissions_collection.find({'verification_status': 'pending'}).sort('timestamp', 1))

def verify_submission(submission_id, verified_by, approved, comment=None):
    """Verify a submission (approve or reject)"""
    status = 'verified' if approved else 'rejected'
    
    submissions_collection.update_one(
        {'_id': ObjectId(submission_id)},
        {'$set': {
            'verification_status': status,
            'verified_by': str(verified_by),
            'verified_at': datetime.utcnow(),
            'faculty_comment': comment
        }}
    )
    
    return get_submission_by_id(submission_id)

def get_submission_stats():
    """Get submission statistics"""
    total = submissions_collection.count_documents({})
    pending = submissions_collection.count_documents({'verification_status': 'pending'})
    verified = submissions_collection.count_documents({'verification_status': 'verified'})
    rejected = submissions_collection.count_documents({'verification_status': 'rejected'})
    
    return {
        'total_submissions': total,
        'pending': pending,
        'verified': verified,
        'rejected': rejected
    }

def get_student_submission_count(student_id):
    """Get count of verified submissions by student"""
    return submissions_collection.count_documents({
        'student_id': str(student_id),
        'verification_status': 'verified'
    })
