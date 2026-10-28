# Windsurf Platform - Quick Start Guide

## 🚀 Simple Setup (No Database Required)

### Backend Setup
1. Open terminal in `backend` folder
2. Install basic dependencies:
   ```bash
   pip install flask flask-cors
   ```
3. Start the simple server:
   ```bash
   python start_simple.py
   ```
   OR directly:
   ```bash
   python simple_server.py
   ```

### Frontend Setup
1. Open another terminal in `frontend` folder
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the frontend:
   ```bash
   npm run dev
   ```

### Access the Platform
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## 🎯 Demo Login
- Click **"Student Login"** for student dashboard
- Click **"Admin Login"** for admin dashboard
- No registration required - instant access!

## 🔧 Full Setup (With MongoDB)

If you want the complete experience with database persistence:

### Backend (Full)
1. Install MongoDB Community Server
2. Install all dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start with MongoDB:
   ```bash
   python start_server.py
   ```

## 🐛 Troubleshooting

### "Fetch Error" or Pages Not Loading
1. Make sure both backend and frontend servers are running
2. Check that backend is accessible at http://localhost:5000/health
3. Ensure no other applications are using ports 3000 or 5000

### Backend Won't Start
1. Try the simple server first: `python simple_server.py`
2. Check if Flask is installed: `pip install flask flask-cors`
3. Make sure you're in the `backend` directory

### Frontend Won't Start
1. Install dependencies: `npm install`
2. Make sure you're in the `frontend` directory
3. Check if Node.js is installed

## 📁 Project Structure
```
windsurf-platform/
├── backend/
│   ├── simple_server.py     # Simple server (no DB)
│   ├── start_simple.py      # Simple startup script
│   ├── app_mongo.py         # Full server (with MongoDB)
│   └── start_server.py      # Full startup script
├── frontend/
│   ├── src/
│   └── package.json
└── QUICK_START.md
```

## 🌟 Features Available
- ✅ Student Dashboard with challenges and social feed
- ✅ Admin Dashboard with user management
- ✅ Challenge system with proof submission
- ✅ Leaderboard and points system
- ✅ Social media features (posts, likes, comments)
- ✅ Responsive design for mobile and desktop
