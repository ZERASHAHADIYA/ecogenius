import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # MongoDB
    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/windsurf')
    
    # JWT
    JWT_SECRET = os.getenv('JWT_SECRET', 'dev-secret-key-change-in-production')
    JWT_EXPIRATION = int(os.getenv('JWT_EXPIRATION', 86400))  # 24 hours
    
    # OAuth
    GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
    GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
    ALLOWED_DOMAIN = os.getenv('ALLOWED_DOMAIN', 'student.college.edu')
    
    # AWS S3
    AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
    AWS_S3_BUCKET = os.getenv('AWS_S3_BUCKET')
    
    # Cloudinary
    CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME')
    CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY')
    CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRET')
    
    # Email
    SMTP_HOST = os.getenv('SMTP_HOST', 'smtp.gmail.com')
    SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
    SMTP_USER = os.getenv('SMTP_USER')
    SMTP_PASSWORD = os.getenv('SMTP_PASSWORD')
    
    # Badge Tiers
    BADGE_TIERS = [
        {'name': 'Green Beginner', 'emoji': '🌱', 'min_points': 0},
        {'name': 'Eco Learner', 'emoji': '🌿', 'min_points': 100},
        {'name': 'Sustainability Hero', 'emoji': '🌾', 'min_points': 500},
        {'name': 'Eco-Champion', 'emoji': '🌳', 'min_points': 1500},
        {'name': 'Legend', 'emoji': '🏅', 'min_points': 5000}
    ]
    
    # Challenge Categories
    CHALLENGE_CATEGORIES = [
        'Waste Management',
        'Green Campus Activities',
        'Energy Conservation',
        'Water Conservation',
        'Sustainable Mobility',
        'Awareness & Innovation',
        'Community Impact'
    ]
