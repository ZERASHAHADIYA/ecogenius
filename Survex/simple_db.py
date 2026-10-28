"""
Simple in-memory database for development/testing
This eliminates the need for MongoDB installation
"""
import json
import os
from datetime import datetime
from typing import Dict, List, Any, Optional

class SimpleDB:
    def __init__(self, data_file='simple_db.json'):
        self.data_file = data_file
        self.data = {
            'users': [],
            'challenges': [],
            'submissions': [],
            'posts': [],
            'rewards': [],
            'leaderboard': []
        }
        self.load_data()
        self.init_default_data()
    
    def load_data(self):
        """Load data from JSON file if it exists"""
        if os.path.exists(self.data_file):
            try:
                with open(self.data_file, 'r') as f:
                    self.data = json.load(f)
            except:
                pass
    
    def save_data(self):
        """Save data to JSON file"""
        try:
            with open(self.data_file, 'w') as f:
                json.dump(self.data, f, indent=2, default=str)
        except:
            pass
    
    def init_default_data(self):
        """Initialize with demo users, challenges and rewards"""
        # Add demo users for immediate login
        if not self.data['users']:
            import bcrypt
            def hash_password(password):
                return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            demo_users = [
                {
                    '_id': 'user1',
                    'name': 'John Doe',
                    'email': 'john.doe@student.college.edu',
                    'password': hash_password('password123'),
                    'role': 'student',
                    'department': 'Computer Science Engineering',
                    'year': '3rd Year',
                    'eco_points': 250,
                    'badges': ['🌱 Green Beginner', '🌿 Eco Learner'],
                    'followers': [],
                    'following': [],
                    'created_at': datetime.now().isoformat()
                },
                {
                    '_id': 'user2',
                    'name': 'Admin User',
                    'email': 'admin@student.college.edu',
                    'password': hash_password('admin123'),
                    'role': 'admin',
                    'department': 'Administration',
                    'year': 'Faculty',
                    'eco_points': 1000,
                    'badges': ['🌱 Green Beginner', '🌿 Eco Learner', '🌾 Sustainability Hero'],
                    'followers': [],
                    'following': [],
                    'created_at': datetime.now().isoformat()
                },
                {
                    '_id': 'user3',
                    'name': 'Faculty Member',
                    'email': 'faculty@student.college.edu',
                    'password': hash_password('faculty123'),
                    'role': 'faculty',
                    'department': 'Environmental Science',
                    'year': 'Faculty',
                    'eco_points': 500,
                    'badges': ['🌱 Green Beginner', '🌿 Eco Learner'],
                    'followers': [],
                    'following': [],
                    'created_at': datetime.now().isoformat()
                }
            ]
            self.data['users'] = demo_users
        
        if not self.data['challenges']:
            default_challenges = [
                {
                    '_id': 'ch1',
                    'title': 'Campus Clean-Up Drive',
                    'description': 'Participate in cleaning common areas and report with photos',
                    'category': 'Waste Management',
                    'points': 50,
                    'status': 'active',
                    'created_by': 'admin',
                    'created_at': datetime.now().isoformat(),
                    'deadline': '2024-12-31'
                },
                {
                    '_id': 'ch2',
                    'title': 'Plant a Tree',
                    'description': 'Plant and maintain a tree on campus',
                    'category': 'Green Campus Activities',
                    'points': 100,
                    'status': 'active',
                    'created_by': 'admin',
                    'created_at': datetime.now().isoformat(),
                    'deadline': '2024-12-31'
                },
                {
                    '_id': 'ch3',
                    'title': 'Energy Conservation Week',
                    'description': 'Document energy-saving practices in your dorm/class',
                    'category': 'Energy Conservation',
                    'points': 75,
                    'status': 'active',
                    'created_by': 'admin',
                    'created_at': datetime.now().isoformat(),
                    'deadline': '2024-12-31'
                }
            ]
            self.data['challenges'] = default_challenges
        
        if not self.data['rewards']:
            default_rewards = [
                {
                    '_id': 'r1',
                    'title': 'Eco-Warrior Certificate',
                    'description': 'Digital certificate recognizing your sustainability efforts',
                    'cost': 100,
                    'type': 'certificate',
                    'stock': 100,
                    'active': True,
                    'created_at': datetime.now().isoformat()
                },
                {
                    '_id': 'r2',
                    'title': 'Campus Cafeteria Meal Token',
                    'description': 'Free meal at the campus cafeteria',
                    'cost': 200,
                    'type': 'meal_token',
                    'stock': 50,
                    'active': True,
                    'created_at': datetime.now().isoformat()
                },
                {
                    '_id': 'r3',
                    'title': 'Eco-Friendly Merchandise',
                    'description': 'Sustainable merchandise (water bottle, tote bag)',
                    'cost': 300,
                    'type': 'merchandise',
                    'stock': 25,
                    'active': True,
                    'created_at': datetime.now().isoformat()
                }
            ]
            self.data['rewards'] = default_rewards
        
        # Add sample posts
        if not self.data['posts']:
            sample_posts = [
                {
                    '_id': 'p1',
                    'content': 'Just completed the Campus Clean-Up Drive! 🌱 Feeling great about contributing to our green campus!',
                    'student_id': 'user1',
                    'student': {'name': 'John Doe', 'department': 'Computer Science Engineering'},
                    'post_type': 'challenge_completion',
                    'challenge_id': 'ch1',
                    'media_url': None,
                    'likes': 15,
                    'comments': [
                        {'user': 'Jane Smith', 'text': 'Great work! 🌿', 'timestamp': datetime.now().isoformat()},
                        {'user': 'Admin User', 'text': 'Keep it up!', 'timestamp': datetime.now().isoformat()}
                    ],
                    'shares': 3,
                    'timestamp': datetime.now().isoformat()
                },
                {
                    '_id': 'p2',
                    'content': 'Planted my first tree today as part of the Green Campus challenge! 🌳 Every small step counts!',
                    'student_id': 'user3',
                    'student': {'name': 'Faculty Member', 'department': 'Environmental Science'},
                    'post_type': 'challenge_completion',
                    'challenge_id': 'ch2',
                    'media_url': None,
                    'likes': 28,
                    'comments': [
                        {'user': 'John Doe', 'text': 'Inspiring! 🌱', 'timestamp': datetime.now().isoformat()}
                    ],
                    'shares': 5,
                    'timestamp': datetime.now().isoformat()
                }
            ]
            self.data['posts'] = sample_posts
        
        self.save_data()
    
    def find_one(self, collection: str, query: Dict) -> Optional[Dict]:
        """Find one document in collection"""
        for item in self.data.get(collection, []):
            match = True
            for key, value in query.items():
                if item.get(key) != value:
                    match = False
                    break
            if match:
                return item
        return None
    
    def find(self, collection: str, query: Dict = None) -> List[Dict]:
        """Find documents in collection"""
        if query is None:
            return self.data.get(collection, [])
        
        results = []
        for item in self.data.get(collection, []):
            match = True
            for key, value in query.items():
                if item.get(key) != value:
                    match = False
                    break
            if match:
                results.append(item)
        return results
    
    def insert_one(self, collection: str, document: Dict) -> str:
        """Insert one document"""
        import uuid
        document['_id'] = document.get('_id', str(uuid.uuid4()))
        document['created_at'] = document.get('created_at', datetime.now().isoformat())
        
        if collection not in self.data:
            self.data[collection] = []
        
        self.data[collection].append(document)
        self.save_data()
        return document['_id']
    
    def update_one(self, collection: str, query: Dict, update: Dict) -> bool:
        """Update one document"""
        for i, item in enumerate(self.data.get(collection, [])):
            match = True
            for key, value in query.items():
                if item.get(key) != value:
                    match = False
                    break
            if match:
                if '$set' in update:
                    item.update(update['$set'])
                else:
                    item.update(update)
                item['updated_at'] = datetime.now().isoformat()
                self.save_data()
                return True
        return False
    
    def delete_one(self, collection: str, query: Dict) -> bool:
        """Delete one document"""
        for i, item in enumerate(self.data.get(collection, [])):
            match = True
            for key, value in query.items():
                if item.get(key) != value:
                    match = False
                    break
            if match:
                del self.data[collection][i]
                self.save_data()
                return True
        return False

# Global database instance
db = SimpleDB()
