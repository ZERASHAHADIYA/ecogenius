# 🚀 Vercel Deployment Guide for Windsurf Platform

## 📋 Prerequisites
- GitHub account
- Vercel account (free tier available)
- Your Windsurf Platform code pushed to GitHub

## 🔧 Step-by-Step Deployment

### 1. Prepare Your Repository Structure

Make sure your GitHub repository has this structure:
```
your-repo/
├── frontend/           # React frontend
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── api/               # Vercel serverless functions
│   └── index.py       # Main API handler
├── vercel.json        # Vercel configuration
├── requirements.txt   # Python dependencies
└── README.md
```

### 2. Deploy to Vercel

#### Option A: Vercel Dashboard (Recommended)
1. **Go to Vercel**: https://vercel.com/dashboard
2. **Click "New Project"**
3. **Import from GitHub**: Select your windsurf-platform repository
4. **Configure Project**:
   - **Framework Preset**: Vite
   - **Root Directory**: Leave empty (uses root)
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `cd frontend && npm install`

5. **Environment Variables** (Add these):
   ```
   VITE_API_URL=/api
   ```

6. **Click "Deploy"**

#### Option B: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from your project root
vercel

# Follow the prompts:
# - Set up and deploy? Y
# - Which scope? (select your account)
# - Link to existing project? N
# - Project name: windsurf-platform
# - Directory: ./
```

### 3. Verify Deployment

After deployment, you'll get URLs like:
- **Frontend**: `https://windsurf-platform.vercel.app`
- **API Health**: `https://windsurf-platform.vercel.app/api/health`

Test the API endpoints:
- `GET /api/health` - Should return platform status
- `GET /api/challenges` - Should return challenge list
- `POST /api/auth/login` - Should handle login

## 🔧 Configuration Details

### vercel.json Explanation
```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    },
    {
      "src": "api/**/*.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/dist/$1"
    }
  ]
}
```

### API Structure
The `api/index.py` file contains all backend endpoints:
- Authentication (`/api/auth/login`, `/api/auth/register`)
- Challenges (`/api/challenges`)
- Posts (`/api/feed`)
- Leaderboard (`/api/leaderboard/global`)
- Health check (`/api/health`)

## 🐛 Troubleshooting

### Common Issues

#### 1. "frontend: No such file or directory"
**Solution**: Make sure your repository structure matches exactly:
```
repo-root/
├── frontend/
│   └── package.json
└── api/
    └── index.py
```

#### 2. Python Function Errors
**Check**:
- `requirements.txt` is in the root directory
- Only includes necessary dependencies (Flask, Flask-cors)
- Python version compatibility

#### 3. Frontend Build Fails
**Check**:
- `frontend/package.json` exists
- All dependencies are listed
- Build command works locally: `cd frontend && npm run build`

#### 4. API Routes Not Working
**Verify**:
- `api/index.py` exists and has proper Flask routes
- Routes are defined without `/api` prefix (Vercel adds it)
- CORS is properly configured

### Debug Steps

1. **Check Build Logs**:
   - Go to Vercel Dashboard → Your Project → Deployments
   - Click on failed deployment to see logs

2. **Test Locally**:
   ```bash
   # Test frontend build
   cd frontend
   npm install
   npm run build
   
   # Test API locally
   cd ../api
   python index.py
   ```

3. **Check Function Logs**:
   - Vercel Dashboard → Functions tab
   - View real-time logs for API calls

## 🌟 Vercel Features

### Automatic Deployments
- **Git Integration**: Auto-deploys on push to main branch
- **Preview Deployments**: Each PR gets a preview URL
- **Rollback**: Easy rollback to previous deployments

### Performance
- **Global CDN**: Fast loading worldwide
- **Edge Functions**: Low latency API responses
- **Automatic Optimization**: Image and asset optimization

### Monitoring
- **Analytics**: Built-in web analytics
- **Function Logs**: Real-time serverless function logs
- **Performance Insights**: Core Web Vitals tracking

## 🔒 Environment Variables

### Production Environment
Set these in Vercel Dashboard → Settings → Environment Variables:

```
VITE_API_URL=/api
NODE_ENV=production
```

### Development Environment
For local development:
```bash
# frontend/.env.local
VITE_API_URL=http://localhost:3000/api
```

## 📊 Expected Performance

### Free Tier Limits
- **Bandwidth**: 100GB/month
- **Function Executions**: 100GB-hours/month
- **Function Duration**: 10 seconds max
- **Build Time**: 45 minutes max

### Typical Response Times
- **Static Assets**: < 100ms (CDN cached)
- **API Functions**: 200-500ms (cold start)
- **API Functions**: 50-100ms (warm)

## 🚀 Going Live

### Custom Domain
1. **Vercel Dashboard** → Project → Settings → Domains
2. **Add Domain**: Enter your custom domain
3. **Configure DNS**: Add CNAME record pointing to Vercel
4. **SSL**: Automatically provisioned

### Production Checklist
- ✅ All API endpoints working
- ✅ Frontend loads and navigates properly
- ✅ Student dashboard displays correctly
- ✅ Admin dashboard functions work
- ✅ Challenge system operational
- ✅ Social features (posts, likes) working
- ✅ Mobile responsive design verified

## 🎯 Expected URLs

After successful deployment:
- **Main App**: `https://your-project.vercel.app`
- **Student Dashboard**: `https://your-project.vercel.app` (auto-loads)
- **API Health**: `https://your-project.vercel.app/api/health`
- **API Docs**: `https://your-project.vercel.app/api` (shows available endpoints)

Your Windsurf Platform will be live with:
- ⚡ **Instant global deployment**
- 🔄 **Automatic updates** on git push
- 📊 **Built-in analytics** and monitoring
- 🌍 **Worldwide CDN** for fast loading
- 🔒 **HTTPS** by default
- 📱 **Mobile optimized** performance

## 💡 Pro Tips

1. **Use Preview Deployments**: Test changes before merging to main
2. **Monitor Function Usage**: Keep an eye on execution time and memory
3. **Optimize Bundle Size**: Use Vite's build analyzer to reduce bundle size
4. **Enable Analytics**: Get insights into user behavior
5. **Set up Monitoring**: Use Vercel's built-in monitoring or external tools

Your Windsurf Platform is now ready for global deployment on Vercel! 🌍✨
