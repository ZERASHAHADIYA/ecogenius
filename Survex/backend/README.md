# Windsurf Platform Backend

A comprehensive MongoDB-based backend for the Windsurf Campus Sustainability Platform, built with Flask and designed to support all frontend functionalities including challenge management, user authentication, file uploads, and real-time analytics.

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- MongoDB Community Server
- pip (Python package manager)

### Installation

1. **Clone and navigate to backend directory**
```bash
cd windsurf-platform/backend
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start MongoDB**
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

5. **Run the server**
```bash
python start_server.py
```

## 📁 Project Structure

```
backend/
├── app_mongo.py              # Main Flask application with MongoDB
├── start_server.py           # Server startup script
├── database.py               # MongoDB connection and initialization
├── requirements.txt          # Python dependencies
├── .env.example              # Environment variables template
├── routes/                   # API route modules
│   ├── auth_mongo.py         # Authentication endpoints
│   ├── challenges_mongo.py   # Challenge management
│   ├── submissions_mongo.py  # Submission review system
│   ├── posts_mongo.py        # Social media posts
│   ├── users_mongo.py        # User management
│   ├── analytics_mongo.py    # Analytics and reporting
│   └── uploads_mongo.py      # File upload handling
├── models/                   # Legacy model files (reference)
└── static/                   # File uploads storage
    ├── uploads/
    ├── avatars/
    ├── posts/
    └── submissions/
```

## 🔧 Configuration

### Environment Variables (.env)

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/windsurf

# Security
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRATION=86400

# OAuth 2.0 Google (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
ALLOWED_DOMAIN=student.college.edu

# File Storage (Optional)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=windsurf-media

# Cloudinary (Alternative)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

## 📚 API Documentation

### Base URL
```
http://localhost:5000
```

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/verify` - Verify JWT token

### Challenge Endpoints
- `GET /api/challenges/` - Get all challenges
- `POST /api/challenges/` - Create challenge (Admin)
- `GET /api/challenges/{id}` - Get specific challenge
- `PUT /api/challenges/{id}` - Update challenge (Admin)
- `POST /api/challenges/{id}/join` - Join challenge
- `GET /api/challenges/my-challenges` - Get user's challenges
- `POST /api/challenges/{id}/submit-proof` - Submit proof
- `GET /api/challenges/categories` - Get challenge categories
- `GET /api/challenges/stats` - Get challenge statistics

### Submission Endpoints
- `GET /api/submissions/pending` - Get pending submissions (Admin)
- `GET /api/submissions/` - Get all submissions (Admin)
- `POST /api/submissions/{id}/review` - Review submission (Admin)
- `GET /api/submissions/my-submissions` - Get user's submissions
- `GET /api/submissions/stats` - Get submission statistics (Admin)

### Post Endpoints
- `GET /api/posts/` - Get all posts
- `POST /api/posts/` - Create post
- `GET /api/posts/{id}` - Get specific post
- `POST /api/posts/{id}/like` - Like/unlike post
- `POST /api/posts/{id}/comment` - Add comment
- `DELETE /api/posts/{id}/comments/{comment_id}` - Delete comment
- `GET /api/posts/my-posts` - Get user's posts
- `DELETE /api/posts/{id}` - Delete post
- `GET /api/posts/stats` - Get post statistics (Admin)

### User Management Endpoints
- `GET /api/users/` - Get all users (Admin)
- `GET /api/users/{id}` - Get specific user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user (Admin)
- `GET /api/users/leaderboard` - Get leaderboard
- `GET /api/users/{id}/stats` - Get user statistics
- `POST /api/users/{id}/award-points` - Award points (Admin)
- `GET /api/users/departments` - Get all departments
- `GET /api/users/search` - Search users

### Analytics Endpoints
- `GET /api/analytics/overview` - Comprehensive analytics (Admin)
- `GET /api/analytics/engagement` - Engagement analytics (Admin)
- `GET /api/analytics/challenges` - Challenge analytics (Admin)
- `GET /api/analytics/leaderboard-stats` - Leaderboard statistics (Admin)
- `GET /api/analytics/timeline` - Timeline analytics (Admin)
- `GET /api/analytics/export` - Export analytics data (Admin)

### File Upload Endpoints
- `POST /api/uploads/proof` - Upload proof files
- `POST /api/uploads/avatar` - Upload user avatar
- `POST /api/uploads/posts` - Upload post media
- `GET /api/uploads/submissions/{user_id}/{filename}` - Serve submission files
- `GET /api/uploads/avatars/{filename}` - Serve avatar files
- `GET /api/uploads/posts/{user_id}/{filename}` - Serve post media
- `GET /api/uploads/info/{type}/{user_id}/{filename}` - Get file info
- `DELETE /api/uploads/delete/{type}/{user_id}/{filename}` - Delete file

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

### Demo Credentials
- **Admin**: admin@sece.ac.in / admin123
- **Student**: priya.sharma@sece.ac.in / password123

## 📊 Database Schema

### Collections

#### Users
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (student/admin/faculty),
  department: String,
  year: String,
  eco_points: Number,
  badges: [String],
  challenges_completed: Number,
  avatar_url: String,
  created_at: Date,
  updated_at: Date
}
```

#### Challenges
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  category: String,
  difficulty: String,
  points: Number,
  duration: String,
  status: String,
  requirements: [String],
  tips: [String],
  participants: Number,
  created_by: String,
  created_at: Date,
  updated_at: Date
}
```

#### Submissions
```javascript
{
  _id: ObjectId,
  student_id: String,
  challenge_id: ObjectId,
  proof_files: [Object],
  proof_description: String,
  verification_status: String,
  admin_comment: String,
  reviewed_by: String,
  submitted_at: Date,
  reviewed_at: Date,
  created_at: Date,
  updated_at: Date
}
```

#### Posts
```javascript
{
  _id: ObjectId,
  student_id: String,
  author: Object,
  content: String,
  post_type: String,
  challenge_id: String,
  proof_images: [String],
  likes: Number,
  liked_by_admin: Boolean,
  comments: [Object],
  timestamp: Date,
  created_at: Date,
  updated_at: Date
}
```

#### Joined Challenges
```javascript
{
  _id: ObjectId,
  student_id: String,
  challenge_id: String,
  joined_date: String,
  status: String,
  progress: Number,
  submitted_proof: Boolean,
  proof_status: String,
  proof_files: [Object],
  proof_description: String,
  created_at: Date,
  updated_at: Date
}
```

## 🔧 Development

### Running in Development Mode
```bash
python start_server.py
```

### Database Management
```bash
# Connect to MongoDB shell
mongo windsurf

# View collections
show collections

# Query users
db.users.find().pretty()

# Query challenges
db.challenges.find().pretty()
```

### File Upload Configuration
- **Max file size**: 16MB
- **Allowed image types**: PNG, JPG, JPEG, GIF, WEBP
- **Allowed document types**: PDF, DOC, DOCX, TXT
- **Storage location**: `static/uploads/`

## 🚀 Production Deployment

### Using Gunicorn
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app_mongo:app
```

### Environment Variables for Production
```bash
FLASK_ENV=production
JWT_SECRET=your-secure-production-secret
MONGODB_URI=mongodb://your-production-db-url
```

### Security Considerations
- Change JWT_SECRET in production
- Use HTTPS in production
- Configure proper CORS origins
- Set up MongoDB authentication
- Use environment variables for sensitive data
- Implement rate limiting
- Set up proper logging

## 🧪 Testing

### Health Check
```bash
curl http://localhost:5000/health
```

### Test Authentication
```bash
# Register new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@sece.ac.in","password":"test123","department":"Computer Science"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@sece.ac.in","password":"test123"}'
```

## 📝 Features

### ✅ Implemented
- **MongoDB Integration**: Full database setup with collections and indexes
- **JWT Authentication**: Secure user authentication and authorization
- **Challenge Management**: Complete CRUD operations for challenges
- **File Upload System**: Multi-file upload with compression and validation
- **Submission Review**: Admin approval/rejection system with point allocation
- **Social Media Posts**: Post creation, likes, comments with admin interaction
- **User Management**: Profile management, leaderboard, statistics
- **Analytics Dashboard**: Comprehensive analytics for admin dashboard
- **Real-time Updates**: SocketIO integration for live updates
- **Error Handling**: Comprehensive error handling and validation
- **Security**: Input validation, file type checking, access control

### 🔄 In Progress
- Real-time notifications
- Advanced analytics charts
- Email notifications
- OAuth integration

### 📋 Planned
- Push notifications
- Advanced search and filtering
- Batch operations
- Data export functionality
- API rate limiting
- Comprehensive logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is part of the Windsurf Campus Sustainability Platform.

## 🆘 Support

For issues and questions:
1. Check the logs in the console
2. Verify MongoDB connection
3. Check environment variables
4. Review API documentation
5. Contact the development team

---

**Windsurf Platform Backend v2.0.0** - Built with ❤️ for campus sustainability
