"""
MongoDB Database Configuration and Connection
"""
from flask_pymongo import PyMongo
from pymongo import MongoClient
from datetime import datetime
import os
from bson import ObjectId
import bcrypt

class Database:
    def __init__(self, app=None):
        self.mongo = None
        self.db = None
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize MongoDB connection"""
        self.mongo = PyMongo(app)
        self.db = self.mongo.db
        self.init_collections()
        self.create_default_data()
    
    def init_collections(self):
        """Create indexes for better performance"""
        try:
            # Users collection indexes
            self.db.users.create_index("email", unique=True)
            self.db.users.create_index("role")
            
            # Challenges collection indexes
            self.db.challenges.create_index("status")
            self.db.challenges.create_index("category")
            self.db.challenges.create_index("created_at")
            
            # Posts collection indexes
            self.db.posts.create_index("student_id")
            self.db.posts.create_index("timestamp")
            self.db.posts.create_index("post_type")
            
            # Submissions collection indexes
            self.db.submissions.create_index("student_id")
            self.db.submissions.create_index("challenge_id")
            self.db.submissions.create_index("verification_status")
            self.db.submissions.create_index("submitted_at")
            
            # Joined challenges collection indexes
            self.db.joined_challenges.create_index([("student_id", 1), ("challenge_id", 1)], unique=True)
            self.db.joined_challenges.create_index("student_id")
            self.db.joined_challenges.create_index("challenge_id")
            
            print("✅ Database indexes created successfully")
        except Exception as e:
            print(f"⚠️ Index creation warning: {e}")
    
    def create_default_data(self):
        """Create default admin user and sample data"""
        try:
            # Check if admin exists
            admin_exists = self.db.users.find_one({"role": "admin"})
            if not admin_exists:
                # Create default admin
                admin_password = bcrypt.hashpw("admin123".encode('utf-8'), bcrypt.gensalt())
                admin_user = {
                    "name": "Dr. Rajesh Kumar",
                    "email": "admin@sece.ac.in",
                    "password": admin_password,
                    "role": "admin",
                    "department": "Environmental Sciences",
                    "designation": "Head of Sustainability",
                    "experience": "15 years",
                    "specialization": "Environmental Management & Green Technologies",
                    "phone": "+91 9876543210",
                    "eco_points": 1000,
                    "badges": ["🌱 Green Beginner", "🌿 Eco Learner", "🌾 Sustainability Hero"],
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
                self.db.users.insert_one(admin_user)
                print("✅ Default admin user created")
            
            # Create sample student users
            student_exists = self.db.users.find_one({"role": "student"})
            if not student_exists:
                students = [
                    {
                        "name": "Priya Sharma",
                        "email": "priya.sharma@sece.ac.in",
                        "password": bcrypt.hashpw("password123".encode('utf-8'), bcrypt.gensalt()),
                        "role": "student",
                        "department": "Environmental Science",
                        "year": "3rd Year",
                        "eco_points": 320,
                        "badges": ["🌱 Green Beginner", "🌿 Eco Learner"],
                        "challenges_completed": 8,
                        "created_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    },
                    {
                        "name": "Rahul Kumar",
                        "email": "rahul.kumar@sece.ac.in",
                        "password": bcrypt.hashpw("password123".encode('utf-8'), bcrypt.gensalt()),
                        "role": "student",
                        "department": "Computer Science",
                        "year": "2nd Year",
                        "eco_points": 285,
                        "badges": ["🌱 Green Beginner"],
                        "challenges_completed": 6,
                        "created_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    },
                    {
                        "name": "Anita Patel",
                        "email": "anita.patel@sece.ac.in",
                        "password": bcrypt.hashpw("password123".encode('utf-8'), bcrypt.gensalt()),
                        "role": "student",
                        "department": "Business Administration",
                        "year": "4th Year",
                        "eco_points": 250,
                        "badges": ["🌱 Green Beginner", "🌿 Eco Learner"],
                        "challenges_completed": 5,
                        "created_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                ]
                self.db.users.insert_many(students)
                print("✅ Sample student users created")
            
            # Create default challenges
            challenges_exist = self.db.challenges.find_one()
            if not challenges_exist:
                challenges = [
                    {
                        "title": "Plastic-Free Week Challenge",
                        "description": "Eliminate single-use plastics from your daily routine for one week.",
                        "category": "Waste Reduction",
                        "difficulty": "Medium",
                        "points": 50,
                        "duration": "7 days",
                        "status": "active",
                        "requirements": [
                            "Document daily plastic usage",
                            "Find alternatives to single-use plastics",
                            "Share progress with photos"
                        ],
                        "tips": [
                            "Use reusable bags for shopping",
                            "Carry a water bottle",
                            "Choose bulk items without packaging"
                        ],
                        "participants": 45,
                        "created_by": "admin",
                        "created_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    },
                    {
                        "title": "Energy Conservation Week",
                        "description": "Reduce energy consumption in your dorm/home by 20%.",
                        "category": "Energy Conservation",
                        "difficulty": "Hard",
                        "points": 100,
                        "duration": "7 days",
                        "status": "active",
                        "requirements": [
                            "Track daily energy usage",
                            "Implement energy-saving measures",
                            "Document savings with proof"
                        ],
                        "tips": [
                            "Switch to LED bulbs",
                            "Unplug devices when not in use",
                            "Use natural light during day"
                        ],
                        "participants": 32,
                        "created_by": "admin",
                        "created_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    },
                    {
                        "title": "Campus Tree Planting",
                        "description": "Plant and maintain trees around the campus area.",
                        "category": "Green Campus Activities",
                        "difficulty": "Easy",
                        "points": 75,
                        "duration": "1 day",
                        "status": "active",
                        "requirements": [
                            "Plant at least one tree",
                            "Commit to maintenance for 1 month",
                            "Share photos of planting process"
                        ],
                        "tips": [
                            "Choose native plant species",
                            "Water regularly in first month",
                            "Coordinate with campus maintenance"
                        ],
                        "participants": 28,
                        "created_by": "admin",
                        "created_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                ]
                self.db.challenges.insert_many(challenges)
                print("✅ Default challenges created")
            
            print("✅ Database initialization completed successfully")
            
        except Exception as e:
            print(f"❌ Error creating default data: {e}")

# Global database instance
db_instance = Database()

def get_db():
    """Get database instance"""
    return db_instance.db

def init_db(app):
    """Initialize database with Flask app"""
    db_instance.init_app(app)
    return db_instance
