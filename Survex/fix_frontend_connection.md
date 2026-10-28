# 🔧 Fix Frontend Data Persistence Issue

## 🚨 **Root Cause of Data Loss**

Your frontend is currently using **localStorage** instead of connecting to the MongoDB backend. This is why data disappears after refresh.

## 🛠️ **Solution Steps**

### 1. **Start MongoDB Backend** (Not quick_app.py)
```bash
# Run this in backend directory:
python setup_and_run.py
```

### 2. **Update Frontend API Calls**

Your frontend components need to make HTTP requests to the MongoDB backend instead of using localStorage.

#### **Current Issue:**
```javascript
// Frontend is doing this (localStorage):
localStorage.setItem('posts', JSON.stringify(posts));

// Should be doing this (API call):
fetch('http://localhost:5000/api/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(postData)
});
```

### 3. **Frontend Components to Update**

#### **Student Dashboard (Dashboard_final.jsx):**
- Replace localStorage posts with API calls to `/api/posts`
- Replace localStorage user data with API calls to `/api/auth/profile`
- Replace localStorage challenges with API calls to `/api/challenges`

#### **Admin Dashboard (AdminDashboard.jsx):**
- Replace mock data with API calls to `/api/submissions/pending`
- Replace localStorage with API calls to `/api/analytics/overview`
- Replace mock students with API calls to `/api/users/leaderboard`

#### **All Challenges (AllChallenges.jsx):**
- Replace mock challenges with API calls to `/api/challenges`
- Replace localStorage joins with API calls to `/api/challenges/{id}/join`

#### **My Challenges (MyChallenges.jsx):**
- Replace localStorage with API calls to `/api/challenges/my-challenges`
- Replace localStorage proof submissions with API calls to `/api/uploads/proof`

### 4. **Authentication Integration**

Update your login component to:
```javascript
// Login API call
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const data = await response.json();
if (data.token) {
  localStorage.setItem('token', data.token); // Only store token
  localStorage.setItem('user', JSON.stringify(data.user));
}
```

### 5. **API Base URL Configuration**

Create a config file for API endpoints:
```javascript
// frontend/src/config/api.js
export const API_BASE_URL = 'http://localhost:5000/api';

export const API_ENDPOINTS = {
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    register: `${API_BASE_URL}/auth/register`,
    profile: `${API_BASE_URL}/auth/profile`
  },
  challenges: {
    list: `${API_BASE_URL}/challenges`,
    join: (id) => `${API_BASE_URL}/challenges/${id}/join`,
    myList: `${API_BASE_URL}/challenges/my-challenges`
  },
  posts: {
    list: `${API_BASE_URL}/posts`,
    create: `${API_BASE_URL}/posts`,
    like: (id) => `${API_BASE_URL}/posts/${id}/like`
  },
  submissions: {
    pending: `${API_BASE_URL}/submissions/pending`,
    review: (id) => `${API_BASE_URL}/submissions/${id}/review`
  }
};
```

## 🔍 **MongoDB Compass Connection**

To manually check your data in MongoDB Compass:

**Connection String:**
```
mongodb://localhost:27017/windsurf
```

**Collections to check:**
- `users` - All registered users
- `challenges` - Available challenges  
- `posts` - Social media posts
- `submissions` - Proof submissions
- `joined_challenges` - User challenge participations

## ✅ **Verification Steps**

1. **Start MongoDB Backend**: `python setup_and_run.py`
2. **Test API**: Visit `http://localhost:5000` in browser
3. **Login Test**: Use demo credentials in frontend
4. **Check Database**: Open MongoDB Compass and connect
5. **Create Post**: Make a post in frontend and check `posts` collection
6. **Join Challenge**: Join a challenge and check `joined_challenges` collection

## 🎯 **Expected Result**

After connecting frontend to MongoDB backend:
- ✅ Posts persist after refresh
- ✅ Challenge joins are saved
- ✅ User data is stored in database
- ✅ Admin can review real submissions
- ✅ Analytics show real data
- ✅ File uploads are saved to server

## 🚨 **Important Notes**

1. **Stop quick_app.py** - It uses in-memory arrays
2. **Start app_mongo.py** - It uses MongoDB database
3. **Update frontend** - Replace localStorage with API calls
4. **Use JWT tokens** - For authenticated requests
5. **Check CORS** - Backend has CORS enabled for frontend
