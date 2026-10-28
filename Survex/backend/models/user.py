"""
User model for Windsurf platform
"""
from datetime import datetime
from bson import ObjectId
import bcrypt
from typing import Dict, List, Optional

class User:
    def __init__(self, db):
        self.collection = db.users
    
    def create_user(self, user_data: Dict) -> str:
        """Create a new user"""
        # Hash password
        if 'password' in user_data:
            user_data['password'] = bcrypt.hashpw(
                user_data['password'].encode('utf-8'), 
                bcrypt.gensalt()
            )
        
        user_data['created_at'] = datetime.utcnow()
        user_data['updated_at'] = datetime.utcnow()
        user_data['eco_points'] = user_data.get('eco_points', 0)
        user_data['badges'] = user_data.get('badges', [])
        user_data['challenges_completed'] = user_data.get('challenges_completed', 0)
        
        result = self.collection.insert_one(user_data)
        return str(result.inserted_id)
    
    def find_by_email(self, email: str) -> Optional[Dict]:
        """Find user by email"""
        return self.collection.find_one({"email": email})
    
    def find_by_id(self, user_id: str) -> Optional[Dict]:
        """Find user by ID"""
        return self.collection.find_one({"_id": ObjectId(user_id)})
    
    def verify_password(self, password: str, hashed_password: bytes) -> bool:
        """Verify password"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password)
    
    def update_user(self, user_id: str, update_data: Dict) -> bool:
        """Update user data"""
        update_data['updated_at'] = datetime.utcnow()
        result = self.collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        return result.modified_count > 0
    
    def get_leaderboard(self, limit: int = 15) -> List[Dict]:
        """Get top users by eco points"""
        return list(self.collection.find(
            {"role": "student"},
            {"password": 0}
        ).sort("eco_points", -1).limit(limit))
    
    def add_points(self, user_id: str, points: int) -> bool:
        """Add eco points to user"""
        result = self.collection.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$inc": {"eco_points": points, "challenges_completed": 1},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        return result.modified_count > 0
    
    def get_all_students(self) -> List[Dict]:
        """Get all student users"""
        return list(self.collection.find(
            {"role": "student"},
            {"password": 0}
        ).sort("eco_points", -1))
    
    def get_user_stats(self, user_id: str) -> Dict:
        """Get user statistics"""
        user = self.find_by_id(user_id)
        if not user:
            return {}
        
        return {
            "eco_points": user.get("eco_points", 0),
            "challenges_completed": user.get("challenges_completed", 0),
            "badges": user.get("badges", []),
            "rank": self.get_user_rank(user_id)
        }
    
    def get_user_rank(self, user_id: str) -> int:
        """Get user's rank in leaderboard"""
        user = self.find_by_id(user_id)
        if not user:
            return 0
        
        higher_users = self.collection.count_documents({
            "role": "student",
            "eco_points": {"$gt": user.get("eco_points", 0)}
        })
        return higher_users + 1
