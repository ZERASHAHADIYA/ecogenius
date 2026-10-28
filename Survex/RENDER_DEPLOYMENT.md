# 🚀 Render Deployment Guide for Windsurf Platform

## 📋 Prerequisites
- GitHub account
- Render account (free tier available)
- Your Windsurf Platform code pushed to GitHub

## 🔧 Step-by-Step Deployment

### 1. Prepare Your Repository
Make sure your code is pushed to GitHub with all the deployment files we just created:
- `render.yaml` (deployment configuration)
- `backend/app_render.py` (production backend)
- `frontend/.env.production` (production environment)
- Updated `requirements.txt` (simplified dependencies)

### 2. Deploy Backend on Render

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click "New +"** → **"Web Service"**
3. **Connect GitHub Repository**: Select your windsurf-platform repo
4. **Configure Backend Service**:
   - **Name**: `windsurf-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && python app_render.py`
   - **Instance Type**: `Free`

5. **Environment Variables** (Add these):
   ```
   PYTHON_VERSION=3.9.16
   FLASK_ENV=production
   PORT=10000
   ```

6. **Click "Create Web Service"**

### 3. Deploy Frontend on Render

1. **Click "New +"** → **"Static Site"**
2. **Connect Same GitHub Repository**
3. **Configure Frontend Service**:
   - **Name**: `windsurf-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build:production`
   - **Publish Directory**: `frontend/dist`

4. **Environment Variables** (Add these):
   ```
   NODE_VERSION=18.17.0
   VITE_API_URL=https://windsurf-backend.onrender.com/api
   ```

5. **Click "Create Static Site"**

### 4. Update API URLs (After Backend Deployment)

Once your backend is deployed, Render will give you a URL like:
`https://windsurf-backend-xyz123.onrender.com`

Update the frontend environment variable:
1. Go to your frontend service in Render
2. Go to **Environment** tab
3. Update `VITE_API_URL` to: `https://your-actual-backend-url.onrender.com/api`
4. **Save Changes** and **Redeploy**

## 🌐 Alternative: Single Service Deployment

If you prefer to deploy everything as one service:

### Option A: Backend Serves Frontend

1. **Create Web Service** (Python)
2. **Build Command**: 
   ```bash
   pip install -r backend/requirements.txt && cd frontend && npm install && npm run build:production && cp -r dist ../backend/static
   ```
3. **Start Command**: `cd backend && python app_render.py`

### Option B: Use Docker (Advanced)

Create `Dockerfile` in root:
```dockerfile
FROM node:18 AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build:production

FROM python:3.9
WORKDIR /app
COPY backend/requirements.txt ./
RUN pip install -r requirements.txt
COPY backend/ ./
COPY --from=frontend-build /app/frontend/dist ./static
EXPOSE 10000
CMD ["python", "app_render.py"]
```

## 🔍 Testing Your Deployment

### Health Check Endpoints
- **Backend**: `https://your-backend-url.onrender.com/health`
- **Frontend**: `https://your-frontend-url.onrender.com`

### Expected Response
Backend health check should return:
```json
{
  "status": "healthy",
  "message": "Windsurf Platform API is running on Render",
  "timestamp": "2024-01-07T...",
  "version": "1.0.0-render"
}
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Build Fails
- **Check logs** in Render dashboard
- **Verify** all files are committed to GitHub
- **Ensure** `requirements.txt` has correct dependencies

#### 2. Backend Won't Start
- **Check** `PORT` environment variable is set to `10000`
- **Verify** `app_render.py` exists in backend folder
- **Check** Python version compatibility

#### 3. Frontend Can't Connect to Backend
- **Verify** `VITE_API_URL` points to correct backend URL
- **Check** CORS settings in backend
- **Ensure** backend is running and accessible

#### 4. CORS Errors
Backend `app_render.py` includes CORS settings for Render domains. If you get CORS errors, check that your frontend URL is included in the CORS origins.

### Render Free Tier Limitations
- **Sleep after 15 minutes** of inactivity
- **750 hours/month** (about 31 days)
- **Cold starts** may take 30+ seconds
- **No custom domains** on free tier

## 🚀 Going Live

### Custom Domain (Paid Plans)
1. Go to **Settings** → **Custom Domains**
2. Add your domain
3. Update DNS records as instructed
4. SSL certificates are automatically provided

### Performance Optimization
- **Enable caching** for static assets
- **Optimize images** and bundle sizes
- **Consider upgrading** to paid plan for better performance

## 📊 Monitoring

### Render Dashboard
- **Metrics**: CPU, Memory, Response times
- **Logs**: Real-time application logs
- **Events**: Deployment history

### Health Monitoring
Set up monitoring for:
- `/health` endpoint availability
- Response time performance
- Error rates

## 🔄 Continuous Deployment

Render automatically deploys when you push to your connected GitHub branch:
1. **Push changes** to GitHub
2. **Render detects** the push
3. **Automatically rebuilds** and deploys
4. **Zero downtime** deployment

## 💡 Tips for Success

1. **Test locally first** with production build
2. **Use environment variables** for all configuration
3. **Monitor logs** during initial deployment
4. **Start with free tier** to test everything
5. **Upgrade when needed** for better performance

## 🎯 Expected URLs

After successful deployment:
- **Frontend**: `https://windsurf-frontend.onrender.com`
- **Backend API**: `https://windsurf-backend.onrender.com/api`
- **Health Check**: `https://windsurf-backend.onrender.com/health`

Your Windsurf Platform will be live and accessible worldwide! 🌍
