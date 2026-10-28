#!/usr/bin/env python3
"""
MongoDB Connection and Data Verification Script
This script checks if MongoDB is properly connected and displays stored data.
"""

import os
import sys
from pymongo import MongoClient
from bson import ObjectId
import json
from datetime import datetime

def serialize_doc(doc):
    """Convert MongoDB document to JSON-serializable format"""
    if isinstance(doc, dict):
        result = {}
        for key, value in doc.items():
            if isinstance(value, ObjectId):
                result[key] = str(value)
            elif isinstance(value, datetime):
                result[key] = value.isoformat()
            elif isinstance(value, dict):
                result[key] = serialize_doc(value)
            elif isinstance(value, list):
                result[key] = [serialize_doc(item) if isinstance(item, dict) else item for item in value]
            else:
                result[key] = value
        return result
    return doc

def check_mongodb_connection():
    """Test MongoDB connection"""
    try:
        print("🔍 Testing MongoDB Connection...")
        client = MongoClient('mongodb://localhost:27017/', serverSelectionTimeoutMS=5000)
        
        # Test connection
        client.admin.command('ping')
        print("✅ MongoDB is running and accessible!")
        
        # Get database
        db = client['windsurf']
        print(f"📊 Connected to database: {db.name}")
        
        return client, db
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        print("\n💡 Make sure MongoDB is running:")
        print("   - Install MongoDB Community Edition")
        print("   - Start MongoDB service")
        print("   - Default port should be 27017")
        return None, None

def check_collections(db):
    """Check all collections and their document counts"""
    print("\n📋 Database Collections:")
    print("=" * 50)
    
    collections = db.list_collection_names()
    if not collections:
        print("⚠️  No collections found in database")
        return {}
    
    collection_stats = {}
    for collection_name in collections:
        collection = db[collection_name]
        count = collection.count_documents({})
        collection_stats[collection_name] = count
        print(f"📁 {collection_name}: {count} documents")
    
    return collection_stats

def show_sample_data(db, collection_name, limit=3):
    """Show sample documents from a collection"""
    print(f"\n📄 Sample data from '{collection_name}':")
    print("-" * 40)
    
    collection = db[collection_name]
    documents = list(collection.find().limit(limit))
    
    if not documents:
        print("   No documents found")
        return
    
    for i, doc in enumerate(documents, 1):
        serialized_doc = serialize_doc(doc)
        print(f"   Document {i}:")
        for key, value in serialized_doc.items():
            if isinstance(value, str) and len(value) > 50:
                value = value[:50] + "..."
            print(f"     {key}: {value}")
        print()

def test_crud_operations(db):
    """Test Create, Read, Update, Delete operations"""
    print("\n🧪 Testing CRUD Operations:")
    print("=" * 40)
    
    test_collection = db['test_connection']
    
    try:
        # CREATE
        test_doc = {
            'test_id': 'verification_test',
            'message': 'MongoDB connection test',
            'timestamp': datetime.now(),
            'status': 'active'
        }
        
        result = test_collection.insert_one(test_doc)
        print(f"✅ CREATE: Inserted document with ID: {result.inserted_id}")
        
        # READ
        found_doc = test_collection.find_one({'test_id': 'verification_test'})
        if found_doc:
            print(f"✅ READ: Found document: {found_doc['message']}")
        
        # UPDATE
        update_result = test_collection.update_one(
            {'test_id': 'verification_test'},
            {'$set': {'status': 'updated', 'updated_at': datetime.now()}}
        )
        print(f"✅ UPDATE: Modified {update_result.modified_count} document(s)")
        
        # DELETE
        delete_result = test_collection.delete_one({'test_id': 'verification_test'})
        print(f"✅ DELETE: Removed {delete_result.deleted_count} document(s)")
        
        print("🎉 All CRUD operations successful!")
        
    except Exception as e:
        print(f"❌ CRUD test failed: {e}")

def check_windsurf_data(db):
    """Check specific Windsurf platform data"""
    print("\n🌿 Windsurf Platform Data Check:")
    print("=" * 45)
    
    # Check users
    users_count = db.users.count_documents({})
    admin_count = db.users.count_documents({'role': 'admin'})
    student_count = db.users.count_documents({'role': 'student'})
    
    print(f"👥 Users: {users_count} total ({admin_count} admins, {student_count} students)")
    
    # Check challenges
    challenges_count = db.challenges.count_documents({})
    active_challenges = db.challenges.count_documents({'status': 'active'})
    
    print(f"🎯 Challenges: {challenges_count} total ({active_challenges} active)")
    
    # Check posts
    posts_count = db.posts.count_documents({})
    print(f"📝 Posts: {posts_count} total")
    
    # Check submissions
    submissions_count = db.submissions.count_documents({})
    pending_submissions = db.submissions.count_documents({'status': 'pending'})
    
    print(f"📋 Submissions: {submissions_count} total ({pending_submissions} pending)")
    
    # Check joined challenges
    joined_count = db.joined_challenges.count_documents({})
    print(f"🤝 Joined Challenges: {joined_count} total")

def show_demo_credentials(db):
    """Show demo login credentials"""
    print("\n🔑 Demo Login Credentials:")
    print("=" * 30)
    
    # Find admin user
    admin = db.users.find_one({'role': 'admin'})
    if admin:
        print(f"👨‍💼 Admin: {admin.get('email', 'N/A')}")
        print("   Password: admin123")
    
    # Find a student user
    student = db.users.find_one({'role': 'student'})
    if student:
        print(f"👨‍🎓 Student: {student.get('email', 'N/A')}")
        print("   Password: password123")

def main():
    print("🌿 Windsurf Platform - MongoDB Verification")
    print("=" * 50)
    
    # Test connection
    client, db = check_mongodb_connection()
    if client is None or db is None:
        return
    
    # Check collections
    collection_stats = check_collections(db)
    
    # Show sample data from each collection
    for collection_name in collection_stats:
        if collection_stats[collection_name] > 0:
            show_sample_data(db, collection_name)
    
    # Test CRUD operations
    test_crud_operations(db)
    
    # Check Windsurf-specific data
    check_windsurf_data(db)
    
    # Show demo credentials
    show_demo_credentials(db)
    
    print("\n🎯 MongoDB Compass Connection:")
    print("   URL: mongodb://localhost:27017/windsurf")
    print("   Database: windsurf")
    
    print("\n🌐 Backend API Testing:")
    print("   Base URL: http://localhost:5000")
    print("   Health Check: http://localhost:5000/health")
    print("   API Docs: http://localhost:5000/api")
    
    # Close connection
    client.close()
    print("\n✅ Verification complete!")

if __name__ == "__main__":
    main()
