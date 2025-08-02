# Deployment Guide

This guide covers deploying the DotNet Calendar application with a free backend on Render.com and frontend on Vercel.

## Overview

- **Frontend**: Vercel (FREE - unlimited)
- **Backend**: Render.com (FREE - with limitations)
- **Total Cost**: $0

### Free Tier Limitations
- Backend goes to sleep after 15 minutes of inactivity
- First request after sleep takes ~30 seconds (cold start)
- The app includes a friendly "Server Warming" loader to handle this gracefully

## Backend Deployment (Render.com)

### Option 1: Direct Docker Deployment (Recommended)

1. **Create a Render Account**
   - Sign up at https://render.com
   - No credit card required for free tier

2. **Create New Web Service**
   - Go to Dashboard > New > Web Service
   - Choose "Deploy from a Git repo"
   - Connect your GitHub account and select your repository

3. **Configure the Service**
   - **Name**: `dotnet-calendar-api` (or your preferred name)
   - **Root Directory**: `backend/DotNetCalendarAPI`
   - **Environment**: Docker
   - **Branch**: `v2.0-deployment` (or your main branch)
   - **Instance Type**: Free

4. **Add Environment Variables**
   - None required for basic setup
   - The Dockerfile handles PORT configuration automatically

5. **Deploy**
   - Click "Create Web Service"
   - First deployment takes 5-10 minutes
   - Your API URL will be: `https://your-service-name.onrender.com`

### Option 2: Using Docker Hub

If you prefer to use Docker Hub:

1. **Push to Docker Hub**
   ```bash
   cd backend/DotNetCalendarAPI
   docker build -t yourusername/dotnet-calendar-api .
   docker push yourusername/dotnet-calendar-api
   ```

2. **Deploy on Render**
   - Create new Web Service
   - Choose "Deploy an existing image from a registry"
   - Image URL: `docker.io/yourusername/dotnet-calendar-api`
   - Configure as above

### GitHub Actions Setup (Optional)

To enable automatic deployments:

1. **Add GitHub Secrets**
   - `DOCKER_USERNAME`: Your Docker Hub username
   - `DOCKER_PASSWORD`: Your Docker Hub password
   - `RENDER_DEPLOY_HOOK_URL`: (Optional) From Render dashboard

2. **Get Render Deploy Hook**
   - In Render dashboard, go to your service
   - Settings > Deploy Hook
   - Copy the URL and add as GitHub secret

## Frontend Deployment (Vercel)

### Prerequisites

1. A Vercel account (https://vercel.com)
2. Vercel CLI installed (optional): `npm i -g vercel`

### Automatic Deployment (Recommended)

1. **Import Project to Vercel**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Configure:
     - Root Directory: `frontend/dotnet-calendar`
     - Framework Preset: Create React App
     - Build Command: `npm run build`
     - Output Directory: `build`

2. **Add Environment Variables**
   - Go to Project Settings > Environment Variables
   - Add: `REACT_APP_API_URL` = `https://your-service-name.onrender.com/api`
   - This should be your Render backend URL + `/api`

3. **Deploy**
   - Vercel automatically deploys on every push to your selected branches
   - Preview deployments for pull requests

### Manual Deployment

```bash
cd frontend/dotnet-calendar
npm run build
vercel --prod
```

### GitHub Actions Configuration

The project includes automatic deployment workflows. To use them:

1. **Add GitHub Secrets**
   - `VERCEL_TOKEN`: Get from Vercel account settings
   - `VERCEL_ORG_ID`: Run `vercel whoami` to get org ID
   - `VERCEL_PROJECT_ID`: After first deploy, check `.vercel/project.json`

## Post-Deployment Setup

### 1. Update CORS Settings

Update `backend/DotNetCalendarAPI/Program.cs`:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("CalendarPolicy", policy =>
    {
        policy.WithOrigins(
            "http://localhost:3000",
            "https://your-app.vercel.app" // Add your Vercel URL
        )
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials();
    });
});
```

### 2. Update Frontend API URL

Create `.env.production` in `frontend/dotnet-calendar`:

```
REACT_APP_API_URL=https://your-service-name.onrender.com/api
```

### 3. Test the Deployment

1. Visit your Vercel URL
2. The first load will show the "Server Warming" loader
3. After ~30 seconds, the app will connect
4. Subsequent requests will be instant (for 15 minutes)

## Handling Cold Starts

The application includes a user-friendly server warming experience:

1. **Automatic Detection**: The frontend detects when the backend is cold
2. **Progress Indicator**: Shows warming progress with estimated time
3. **Informative Message**: Explains why the wait is happening
4. **Automatic Retry**: Handles connection attempts transparently

## Monitoring

### Render Dashboard
- View logs: Dashboard > Your Service > Logs
- Monitor metrics: Dashboard > Your Service > Metrics
- Check deploy status and history

### Vercel Dashboard
- View function logs
- Monitor performance metrics
- Check build logs

## Troubleshooting

### Backend Issues

1. **Service won't start**
   - Check Render logs for errors
   - Ensure Dockerfile is in the correct directory
   - Verify .NET version compatibility

2. **CORS errors**
   - Update CORS origins in Program.cs
   - Ensure URLs don't have trailing slashes
   - Check that credentials are allowed

3. **Slow cold starts**
   - This is normal for free tier
   - Consider upgrading to paid tier for always-on service

### Frontend Issues

1. **Can't connect to backend**
   - Verify REACT_APP_API_URL is set correctly
   - Check browser console for errors
   - Ensure backend is deployed and running

2. **Build failures**
   - Check Vercel build logs
   - Ensure all dependencies are in package.json
   - Verify Node version compatibility

## Cost Optimization

To stay within free tiers:

1. **Render Free Tier**
   - 750 hours/month (more than enough)
   - Automatic sleep after 15 minutes
   - Perfect for portfolio projects

2. **Vercel Free Tier**
   - 100GB bandwidth/month
   - Unlimited sites
   - Perfect for frontend hosting

3. **Upgrade Options**
   - Render Starter: $7/month for always-on service
   - Keeps backend running 24/7
   - Eliminates cold starts

## Alternative Free Hosting Options

### Backend Alternatives
- **Railway.app**: $5 credit/month
- **Fly.io**: Generous free tier
- **Google Cloud Run**: Pay per request
- **Azure Container Instances**: Pay per second

### Frontend Alternatives
- **Netlify**: Similar to Vercel
- **GitHub Pages**: Static hosting only
- **Cloudflare Pages**: Generous free tier

## Security Considerations

1. **Environment Variables**
   - Never commit secrets to Git
   - Use platform-specific secret management
   - Rotate credentials regularly

2. **HTTPS**
   - Both Render and Vercel provide free SSL
   - Always use HTTPS URLs in production

3. **API Security**
   - Consider adding authentication if needed
   - Implement rate limiting for production use
   - Monitor for unusual activity

## Summary

With this setup, you get:
- ✅ Completely free hosting
- ✅ Automatic deployments from Git
- ✅ HTTPS enabled
- ✅ Custom domains supported (on free tier)
- ✅ Professional portfolio presence
- ✅ User-friendly cold start handling

The only limitation is the 30-second cold start, which is handled gracefully with the Server Warming loader.