# Vercel Deployment Guide

This guide will help you deploy your pricing-pin application to Vercel with session functionality working properly.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **B2 Backblaze Setup**: Follow the [B2_SETUP.md](./B2_SETUP.md) guide
3. **GitHub Repository**: Your code should be in a GitHub repository

## Step 1: Deploy Backend

### Option A: Deploy Backend to Vercel (Recommended)

1. **Create a new Vercel project for your backend:**
   ```bash
   # Clone your repository to a new directory
   git clone <your-repo-url> pricing-pin-backend
   cd pricing-pin-backend
   
   # Remove frontend files (keep only server and package.json)
   rm -rf src/ public/ tailwind.config.js postcss.config.js
   ```

2. **Update package.json for backend:**
   ```json
   {
     "name": "pricing-pin-backend",
     "version": "1.0.0",
     "main": "server/index.js",
     "scripts": {
       "start": "node server/index.js",
       "dev": "node server/index.js"
     },
     "dependencies": {
       "backblaze-b2": "^1.7.1",
       "body-parser": "^1.20.2",
       "cors": "^2.8.5",
       "dotenv": "^16.3.1",
       "express": "^4.18.2"
     }
   }
   ```

3. **Deploy to Vercel:**
   ```bash
   vercel
   ```

4. **Set environment variables in Vercel dashboard:**
   - `B2_KEY_ID`: Your B2 Key ID
   - `B2_APP_KEY`: Your B2 Application Key
   - `B2_BUCKET_ID`: Your B2 Bucket ID
   - `B2_BUCKET_NAME`: Your B2 Bucket Name
   - `FRONTEND_URL`: Your frontend Vercel URL (e.g., `https://your-app.vercel.app`)

5. **Note your backend URL** (e.g., `https://your-backend.vercel.app`)

### Option B: Deploy to Railway/Render/Heroku

Follow the platform-specific deployment guides for your chosen platform.

## Step 2: Deploy Frontend

1. **Deploy your main repository to Vercel:**
   ```bash
   vercel
   ```

2. **Set environment variables in Vercel dashboard:**
   - `REACT_APP_API_URL`: Your backend URL (e.g., `https://your-backend.vercel.app/api`)

## Step 3: Test the Deployment

1. **Test your backend health endpoint:**
   ```
   https://your-backend.vercel.app/api/health
   ```

2. **Test your frontend:**
   - Visit your frontend URL
   - Try creating and saving a session
   - Verify sessions persist across page reloads

## Environment Variables Summary

### Backend Environment Variables:
- `B2_KEY_ID`: Your B2 Key ID
- `B2_APP_KEY`: Your B2 Application Key  
- `B2_BUCKET_ID`: Your B2 Bucket ID
- `B2_BUCKET_NAME`: Your B2 Bucket Name
- `FRONTEND_URL`: Your frontend domain (for CORS)

### Frontend Environment Variables:
- `REACT_APP_API_URL`: Your backend API URL

## Troubleshooting

### Common Issues:

1. **CORS Errors:**
   - Ensure `FRONTEND_URL` is set correctly in backend
   - Check that your frontend domain matches exactly

2. **B2 Connection Issues:**
   - Verify all B2 environment variables are set
   - Check B2 credentials are correct
   - Ensure B2 bucket exists and is accessible

3. **API Connection Issues:**
   - Verify `REACT_APP_API_URL` is set correctly
   - Check that backend is deployed and accessible
   - Test backend health endpoint

4. **Session Not Saving:**
   - Check browser console for errors
   - Verify B2 bucket permissions
   - Check backend logs in Vercel dashboard

### Debugging:

1. **Check Vercel Function Logs:**
   - Go to Vercel dashboard
   - Navigate to your backend project
   - Check "Functions" tab for logs

2. **Test Backend Locally:**
   ```bash
   npm run server
   ```

3. **Test Frontend Locally:**
   ```bash
   REACT_APP_API_URL=https://your-backend.vercel.app/api npm start
   ```

## Production Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible  
- [ ] All environment variables set
- [ ] CORS configured correctly
- [ ] B2 credentials working
- [ ] Sessions saving and loading
- [ ] Health endpoint responding
- [ ] No console errors in browser
- [ ] API calls working from frontend

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Vercel function logs
3. Test endpoints individually
4. Verify environment variables are set correctly 