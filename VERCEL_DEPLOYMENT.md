# Vercel Deployment Guide (Single Project)

This guide will help you deploy your pricing-pin application to Vercel with session functionality working properly using serverless functions in the same project.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **B2 Backblaze Setup**: Follow the [B2_SETUP.md](./B2_SETUP.md) guide
3. **GitHub Repository**: Your code should be in a GitHub repository

## Project Structure

Your project now has the following structure:
```
pricing-pin/
├── api/
│   └── index.js          # Serverless function (backend)
├── src/                  # React frontend
├── public/               # Static files
├── vercel.json           # Vercel configuration
└── package.json          # Dependencies
```

## Step 1: Deploy to Vercel

1. **Deploy your project to Vercel:**
   ```bash
   vercel
   ```

2. **Set environment variables in Vercel dashboard:**
   - Go to your Vercel project settings
   - Navigate to "Environment Variables"
   - Add the following variables:
     - `B2_KEY_ID`: Your B2 Key ID
     - `B2_APP_KEY`: Your B2 Application Key
     - `B2_BUCKET_ID`: Your B2 Bucket ID
     - `B2_BUCKET_NAME`: Your B2 Bucket Name

## Step 2: Test the Deployment

1. **Test your backend health endpoint:**
   ```
   https://your-app.vercel.app/api/health
   ```

2. **Test your frontend:**
   - Visit your Vercel URL
   - Try creating and saving a session
   - Verify sessions persist across page reloads

## How It Works

### Frontend (React)
- Serves static files from the `build` directory
- Makes API calls to `/api/*` endpoints
- In production, uses relative URLs (e.g., `/api/sessions`)

### Backend (Serverless Functions)
- Located in `api/index.js`
- Handles all `/api/*` routes
- Uses B2 Backblaze for session storage
- Runs as serverless functions on Vercel

### Vercel Configuration (`vercel.json`)
- Routes `/api/*` requests to serverless functions
- Routes all other requests to the React app
- Builds the React app using `@vercel/static-build`
- Builds serverless functions using `@vercel/node`

## Environment Variables

### Required Environment Variables:
- `B2_KEY_ID`: Your B2 Key ID
- `B2_APP_KEY`: Your B2 Application Key  
- `B2_BUCKET_ID`: Your B2 Bucket ID
- `B2_BUCKET_NAME`: Your B2 Bucket Name

### Optional Environment Variables:
- `REACT_APP_API_URL`: Override API URL (defaults to `/api` in production)

## Troubleshooting

### Common Issues:

1. **CORS Errors:**
   - CORS is configured to allow requests from the same domain
   - No additional CORS setup needed for same-domain deployment

2. **B2 Connection Issues:**
   - Verify all B2 environment variables are set
   - Check B2 credentials are correct
   - Ensure B2 bucket exists and is accessible

3. **API Connection Issues:**
   - Frontend automatically uses `/api` in production
   - Check that serverless function is deployed
   - Test backend health endpoint

4. **Session Not Saving:**
   - Check browser console for errors
   - Verify B2 bucket permissions
   - Check Vercel function logs

### Debugging:

1. **Check Vercel Function Logs:**
   - Go to Vercel dashboard
   - Navigate to your project
   - Check "Functions" tab for logs

2. **Test Backend Locally:**
   ```bash
   npm run server
   ```

3. **Test Frontend Locally:**
   ```bash
   npm start
   ```

4. **Test API Endpoints:**
   ```bash
   curl https://your-app.vercel.app/api/health
   ```

## Development vs Production

### Development:
- Frontend runs on `http://localhost:3000`
- Backend runs on `http://localhost:3001`
- API calls go to `http://localhost:3001/api`

### Production:
- Frontend and backend on same domain
- API calls go to `/api` (relative URL)
- Serverless functions handle API requests

## Production Checklist

- [ ] Project deployed to Vercel
- [ ] All B2 environment variables set
- [ ] Health endpoint responding
- [ ] Sessions saving and loading
- [ ] No console errors in browser
- [ ] API calls working from frontend
- [ ] CORS working correctly

## Advantages of Single Project

1. **Simpler Deployment**: One project instead of two
2. **Same Domain**: No CORS issues
3. **Cost Effective**: Single Vercel project
4. **Easier Management**: All code in one repository
5. **Automatic Scaling**: Vercel handles scaling

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Vercel function logs
3. Test endpoints individually
4. Verify environment variables are set correctly 