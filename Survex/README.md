
Team Hexaura Members 
1. Tamilselvan P
2. Zerashahadiya S
3. Vihasini K S 
4. Suryaprakash S

# 🌿 Survex- Campus Sustainability Social Media Platform

A comprehensive full-stack platform for Sri Eshwar College of Engineering that gamifies sustainability through social challenges, rewards, and community engagement.

## 🎯 Overview

Survex is a campus sustainability platform where students participate in eco-challenges, share achievements in a social feed, earn points and badges, while faculty and administrators manage challenges, verify submissions, and track analytics.
Think of Survex as a social media platform for sustainability. Students can:
-Take part in eco-challenges,
-Share their achievements in a social feed,
-Earn points, badges, and real rewards,
-Compete on leaderboards,
-And celebrate their impact with peers.

Meanwhile, faculty and admins can:
-Create and manage challenges,
-Verify student submissions,
-Monitor progress with analytics,
-And reward students

## ✨ Features

### 🔐 Authentication & Roles
- **JWT-based authentication** with role-based access control
- **Google OAuth integration** (domain-restricted to college emails)
- **Two user roles**: Student, Admin
- **Secure password handling** with bcrypt

### 🏡 Student Features
- **Green Hub (Social Feed)**: Share posts, interact with likes/comments/shares
- **EcoQuest (Challenges)**: Join sustainability challenges and submit proof
- **Leaderboard**: Global, departmental, and weekly rankings
- **Rewards Store**: Redeem eco-points for certificates, merchandise, meal tokens
- **Profile Management**: Track progress, badges, and achievements
- **Points & Badges System**: 5-tier progression from Green Beginner to Legend

  👨‍🏫 Faculty/Admin Features
- **Challenge Management**: Create, and edit challenges
- **Submission Verification**: Review and approve/reject student submissions
- **Analytics Dashboard**: Participation rates, environmental impact metrics
- **Reward Management**: Create and manage reward catalog
- **User Management**: Monitor student engagement and progress

 🌿 Challenge System
- **7 Categories**: Waste Management, Green Campus, Energy Conservation, Water Conservation, Sustainable Mobility, Awareness & Innovation, Community Impact
- **Submission Workflow**: Upload proof → Faculty verification → Auto-post to feed
- **Point Rewards**: Earn points for verified challenge completions
- **Real-time Updates**: Notifications for challenge updates and verifications

 🏆 Gamification
- **Badge Tiers**: 🌱 Green Beginner → 🌿 Eco Learner → 🌾 Sustainability Hero → 🌳 Eco-Champion → 🏅 Legend
- **Leaderboards**: Global, departmental, and weekly rankings
- **Reward System**: Certificates, eco-merchandise, meal tokens, vouchers
- **Social Recognition**: Auto-posts for achievements, follower system


 🛠️ Tech Stack

 Frontend
- **React.js 18** with modern hooks and functional components
- **Tailwind CSS** for responsive, utility-first styling
- **React Router** for client-side routing

 Backend
- **Python Flask** REST API with modular blueprint structure
- **MongoDB** with PyMongo for flexible document storage
- **JWT** for stateless authentication
- **bcrypt** for secure password hashing
- **Flask-CORS** for cross-origin resource sharing
- **Google OAuth 2.0** for social authentication

 Database Schema
```
Collections:
- users: Profile data, points, badges, followers
- challenges: Challenge details, categories, deadlines
- submissions: Student submissions with verification status
- posts: Social feed posts with interactions
- rewards: Reward catalog with stock management
- leaderboard: Cached ranking data
```
>>>>>>> 32080adc5c0ebf6fee65ab5b8506d31d43a9cac5

## 🚀 Quick Start

### Prerequisites
<<<<<<< HEAD
- Python 3.8+
- MongoDB Community Server
- pip (Python package manager)

### Installation

1. **Clone and navigate to backend directory**
```bash
cd windsurf-platform/backend
```

2. **Install dependencies**
=======
- **Node.js 16+** and npm
- **Python 3.8+** and pip
- **MongoDB** (local or cloud)
- **Git**

### Backend Setup

1. **Clone and navigate to backend**
```bash
git clone <repository-url>
cd windsurf-platform/backend
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
>>>>>>> 32080adc5c0ebf6fee65ab5b8506d31d43a9cac5
```bash
pip install -r requirements.txt
```


3. **Set up environment variables**
=======
4. **Environment configuration**
>>>>>>> 32080adc5c0ebf6fee65ab5b8506d31d43a9cac5
```bash
cp .env.example .env
# Edit .env with your configuration
```

<<<<<<< HEAD
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
=======
5. **Configure environment variables**
```env
MONGODB_URI=mongodb://localhost:27017/windsurf
JWT_SECRET=your-secret-key-change-in-production
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
ALLOWED_DOMAIN=student.college.edu
```

6. **Start the server**
```bash
python app_mongo.py
```
Backend runs on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend**
```bash
cd ../frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```
Frontend runs on `http://localhost:3000`

### Database Setup

**MongoDB Collections** are automatically created when the application runs. For production,  proper indexing is ensured:

```javascript
// Recommended indexes
db.users.createIndex({ "email": 1 }, { unique: true })
db.challenges.createIndex({ "status": 1, "category": 1 })
db.submissions.createIndex({ "verification_status": 1, "timestamp": -1 })
db.posts.createIndex({ "timestamp": -1 })
>>>>>>> 32080adc5c0ebf6fee65ab5b8506d31d43a9cac5
```

## 📁 Project Structure

```
<<<<<<< HEAD
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
🔧 Configuration

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

 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

 📄 License

This project is part of the Windsurf Campus Sustainability Platform.

 🆘 Support

For issues and questions:
1. Check the logs in the console
2. Verify MongoDB connection
3. Check environment variables
4. Review API documentation
5. Contact the development team

---

Platform Backend v2.0.0** - Built with ❤️ for campus sustainability
=======
windsurf-platform/
├── backend/
│   ├── app.py                 # Flask application entry point
│   ├── config.py              # Configuration settings
│   ├── requirements.txt       # Python dependencies
│   ├── models/               # Database models
│   │   ├── user.py
│   │   ├── challenge.py
│   │   ├── submission.py
│   │   ├── post.py
│   │   ├── reward.py
│   │   └── leaderboard.py
│   ├── routes/               # API endpoints
│   │   ├── auth.py
│   │   ├── challenges.py
│   │   ├── submissions.py
│   │   ├── feed.py
│   │   ├── leaderboard.py
│   │   ├── rewards.py
│   │   ├── users.py
│   │   └── analytics.py
│   └── utils/                # Utility functions
│       ├── jwt_helper.py
│       ├── file_upload.py
│       └── email_helper.py
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── Navbar.jsx
│   │   │   ├── FeedCard.jsx
│   │   │   ├── ChallengeCard.jsx
│   │   │   ├── RewardCard.jsx
│   │   │   └── ProgressRing.jsx
│   │   ├── pages/           # Main application pages
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Challenges.jsx
│   │   │   ├── Leaderboard.jsx
│   │   │   ├── Rewards.jsx
│   │   │   └── AdminPanel.jsx
│   │   ├── services/        # API communication
│   │   │   └── api.js
│   │   ├── App.jsx          # Main app component
│   │   └── main.jsx         # React entry point
│   ├── package.json         # Node.js dependencies
│   ├── tailwind.config.js   # Tailwind CSS configuration
│   └── vite.config.js       # Vite build configuration
└── README.md
```

## 🎨 Design System

### Color Palette
- **Primary Green**: `#2E7D32` - Main brand color
- **Primary Dark**: `#1B5E20` - Hover states
- **Primary Light**: `#4CAF50` - Accents
- **Secondary**: `#81C784` - Supporting elements
- **Background**: `#F5F5F5` - Page background

### Typography
- **Primary Font**: Poppins (headings, UI elements)
- **Secondary Font**: Inter (body text)
- **Font Weights**: 300, 400, 500, 600, 700

### Components
- **Cards**: Rounded corners, subtle shadows, white background
- **Buttons**: Primary (green), Secondary (gray), consistent padding
- **Forms**: Clean inputs with focus states, proper validation
- **Navigation**: Responsive navbar with role-based menu items

## 🔧 API Endpoints

### Authentication
```
POST /api/auth/register     # User registration
POST /api/auth/login        # Email/password login
POST /api/auth/google-login # Google OAuth login
GET  /api/auth/me          # Get current user
```

### Challenges
```
GET    /api/challenges           # List challenges
POST   /api/challenges           # Create challenge (admin/faculty)
GET    /api/challenges/:id       # Get challenge details
PUT    /api/challenges/:id       # Update challenge (admin/faculty)
DELETE /api/challenges/:id       # Archive challenge (admin/faculty)
POST   /api/challenges/:id/join  # Join challenge
```

### Submissions
```
POST /api/submissions              # Submit challenge proof
GET  /api/submissions/pending      # Get pending submissions (admin/faculty)
POST /api/submissions/:id/verify   # Verify submission (admin/faculty)
GET  /api/submissions/student/:id  # Get student submissions
```

### Social Feed
```
GET    /api/feed           # Get feed posts
POST   /api/feed           # Create post
POST   /api/feed/:id/like  # Like/unlike post
POST   /api/feed/:id/comment # Add comment
POST   /api/feed/:id/share   # Share post
```

### Leaderboard
```
GET /api/leaderboard/global              # Global leaderboard
GET /api/leaderboard/department/:dept    # Department leaderboard
GET /api/leaderboard/weekly              # Weekly leaderboard
GET /api/leaderboard/departments         # Department rankings
```

### Rewards
```
GET  /api/rewards              # List all rewards
GET  /api/rewards/available    # Get available rewards for user
POST /api/rewards              # Create reward (admin)
POST /api/rewards/:id/claim    # Claim reward
GET  /api/rewards/my-claims    # Get user's claimed rewards
```


## 🌱 Environmental Impact Tracking

The platform includes basic environmental impact calculations:
- **CO₂ Saved**: Estimated based on energy and transportation challenges
- **Water Conserved**: Tracked through water conservation challenges
- **Energy Saved**: Calculated from energy efficiency activities
- **Waste Recycled**: Measured through waste management challenges
- **Trees Planted**: Direct count from green campus activities

## 📱 Responsive Design

- **Mobile-First Approach** with Tailwind CSS
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Touch-Friendly Interface** with appropriate button sizes
- **Optimized Images** with responsive sizing
- **Progressive Web App** ready structure

## 🚀 Deployment

### Backend Deployment (Heroku/Railway)
```bash
# Add Procfile
echo "web: gunicorn app:app" > Procfile

# Deploy to Heroku
heroku create windsurf-api
heroku config:set MONGODB_URI=your-mongodb-uri
heroku config:set JWT_SECRET=your-jwt-secret
git push heroku main
```
**Built with 💚 for a sustainable future** 🌍
>>>>>>> 32080adc5c0ebf6fee65ab5b8506d31d43a9cac5
