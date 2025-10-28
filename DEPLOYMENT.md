# MedGuide Deployment Guide - Render.com

This guide will help you deploy MedGuide (both frontend and backend) to Render.com using the Blueprint feature.

## Prerequisites

1. **GitHub Account** - Your code should be in a GitHub repository
2. **Render Account** - Sign up at [render.com](https://render.com)
3. **MongoDB Atlas Account** - For production database (free tier available)
4. **Google Gemini API Key** - Get from [Google AI Studio](https://makersuite.google.com/app/apikey)

---

## Step 1: Prepare MongoDB Database

### Option A: MongoDB Atlas (Recommended)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user with username and password
4. Whitelist all IPs: Go to Network Access → Add IP Address → Allow Access from Anywhere (`0.0.0.0/0`)
5. Get your connection string:
   - Click "Connect" → "Connect your application"
   - Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/medguide`)
   - Replace `<password>` with your actual password
   - Replace `myFirstDatabase` with `medguide`

### Example MongoDB URI:
```
mongodb+srv://medguide_user:YourPassword123@cluster0.xxxxx.mongodb.net/medguide?retryWrites=true&w=majority
```

---

## Step 2: Push Code to GitHub

1. Make sure your project is in a GitHub repository
2. Ensure `.env` files are in `.gitignore` (they should not be committed)
3. Verify `render.yaml` is committed to the repository

```bash
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

---

## Step 3: Deploy to Render

### Method 1: Blueprint (Automated - Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New"** → **"Blueprint"**
3. Connect your GitHub repository
4. Render will automatically detect `render.yaml`
5. Click **"Apply"** to create both services

### Method 2: Manual Deployment

If Blueprint doesn't work, deploy manually:

#### Deploy Backend:

1. Click **"New"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `medguide-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

#### Deploy Frontend:

1. Click **"New"** → **"Static Site"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `medguide-frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Plan**: Free

---

## Step 4: Configure Environment Variables

### Backend Environment Variables

Go to your backend service → **Environment** tab and add:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Required |
| `PORT` | `10000` | Render uses this port |
| `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | Auto-generated or custom | Render can auto-generate this |
| `JWT_EXPIRE` | `30d` | Token expiration |
| `JWT_COOKIE_EXPIRE` | `30` | Cookie expiration in days |
| `CLIENT_URL` | `https://medguide-frontend.onrender.com` | Your frontend URL (update after deployment) |
| `GEMINI_API_KEY` | `AIzaSy...` | Your Google Gemini API key |

### Frontend Environment Variables

Go to your static site → **Environment** tab and add:

| Key | Value | Notes |
|-----|-------|-------|
| `VITE_API_URL` | `https://medguide-backend.onrender.com/api/v1` | Your backend URL |
| `VITE_GEMINI_API_KEY` | `AIzaSy...` | Your Google Gemini API key |
| `VITE_GEMINI_MODEL` | `gemini-1.5-flash` | Optional, defaults to this |

---

## Step 5: Update CORS Configuration

After deployment, update the `CLIENT_URL` environment variable in your backend service with your actual frontend URL:

```
CLIENT_URL=https://medguide-frontend.onrender.com
```

Then click **"Manual Deploy"** → **"Clear build cache & deploy"** to restart the backend.

---

## Step 6: Test Your Deployment

1. Visit your frontend URL: `https://medguide-frontend.onrender.com`
2. Test the following:
   - ✅ User registration and login
   - ✅ Medical report upload
   - ✅ AI chat functionality
   - ✅ Clinic finder (requires location permission)
   - ✅ Dashboard and reports page

---

## Important Notes

### Free Tier Limitations

- **Sleep Mode**: Free tier services sleep after 15 minutes of inactivity
- **First Load**: May take 30-60 seconds to wake up
- **Upgrade**: For production, consider upgrading to paid tier ($7/month per service)

### Security Best Practices

1. **Never commit `.env` files** to Git
2. **Use strong JWT secrets** (auto-generate on Render)
3. **Whitelist specific IPs** in MongoDB Atlas for better security (optional)
4. **Rotate API keys** periodically

### Troubleshooting

#### Backend not connecting to MongoDB:
- Verify MongoDB URI is correct
- Check MongoDB Atlas allows connections from `0.0.0.0/0`
- Check Render logs for detailed error messages

#### Frontend can't reach backend:
- Verify `VITE_API_URL` includes `/api/v1` at the end
- Check CORS configuration in backend
- Ensure `CLIENT_URL` in backend matches your frontend URL

#### Build failures:
- Check Render build logs for specific errors
- Verify all dependencies are in `package.json`
- Try "Clear build cache & deploy"

#### 500 errors:
- Check Render logs: Dashboard → Service → Logs
- Look for missing environment variables
- Verify database connection

---

## Monitoring and Logs

- **View Logs**: Dashboard → Service → Logs
- **Metrics**: Dashboard → Service → Metrics
- **Events**: Dashboard → Service → Events

---

## Custom Domain (Optional)

1. Go to your service → **Settings** → **Custom Domain**
2. Add your domain
3. Update DNS records as instructed by Render
4. Update `CLIENT_URL` environment variable accordingly

---

## Deployment Checklist

Before going live, ensure:

- [ ] MongoDB Atlas is set up with proper credentials
- [ ] All environment variables are configured correctly
- [ ] Backend URL is updated in frontend env vars
- [ ] Frontend URL is updated in backend CORS config
- [ ] Test user registration and login
- [ ] Test file uploads and AI features
- [ ] SSL certificates are active (automatic on Render)
- [ ] API keys are kept secure

---

## Cost Estimate

| Service | Tier | Monthly Cost |
|---------|------|--------------|
| Backend | Free | $0 |
| Frontend | Free | $0 |
| MongoDB Atlas | Free (512MB) | $0 |
| **Total** | | **$0/month** |

For production with no sleep:
| Service | Tier | Monthly Cost |
|---------|------|--------------|
| Backend | Starter | $7 |
| Frontend | Free | $0 |
| MongoDB Atlas | Free or M2 | $0-9 |
| **Total** | | **$7-16/month** |

---

## Support

- **Render Docs**: [render.com/docs](https://render.com/docs)
- **MongoDB Atlas Docs**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
- **Render Community**: [community.render.com](https://community.render.com)

---

## Quick Commands Reference

```bash
# Local development
npm run dev                    # Frontend
cd backend && npm run dev     # Backend

# Build for production (test locally)
npm run build                 # Frontend
cd backend && npm start       # Backend
```

---

**Deployment Complete! 🚀**

Your MedGuide application should now be live on Render.com.
