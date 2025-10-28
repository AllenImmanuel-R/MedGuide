# Quick Render Setup Guide

Follow these steps to deploy MedGuide to Render.com quickly.

## 📋 Pre-Deployment Checklist

### 1. Get Your API Keys Ready

- [ ] **MongoDB Atlas Connection String**
  - Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
  - Create a free cluster
  - Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/medguide`

- [ ] **Google Gemini API Key**
  - Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
  - Format: `AIzaSy...`

### 2. Prepare Your Repository

```bash
# Make sure .env files are NOT committed
git status

# If .env is shown, it's already ignored. Good!
# If you see .env files, remove them from git:
git rm --cached .env
git rm --cached backend/.env
git commit -m "Remove .env files from git"

# Push to GitHub
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

---

## 🚀 Deploy to Render (5 Minutes)

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub

### Step 2: Deploy Using Blueprint
1. Click **"New"** → **"Blueprint"**
2. Select your GitHub repository: `MedGuide`
3. Render detects `render.yaml` automatically
4. Click **"Apply"**
5. Wait for services to be created (2 services: backend + frontend)

### Step 3: Configure Backend Environment Variables

1. Go to **Dashboard** → **medguide-backend**
2. Click **"Environment"** tab
3. Add these variables:

```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://YOUR_MONGODB_URI_HERE
JWT_SECRET=(click "Generate" button - Render will create a secure random string)
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30
CLIENT_URL=https://medguide-frontend.onrender.com
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
```

4. Click **"Save Changes"**

### Step 4: Configure Frontend Environment Variables

1. Go to **Dashboard** → **medguide-frontend**
2. Click **"Environment"** tab
3. Add these variables:

```
VITE_API_URL=https://medguide-backend.onrender.com/api/v1
VITE_GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
VITE_GEMINI_MODEL=gemini-1.5-flash
```

4. Click **"Save Changes"**

### Step 5: Update Backend CORS

1. After frontend deploys, copy its URL (e.g., `https://medguide-frontend.onrender.com`)
2. Go back to **backend** → **Environment**
3. Update `CLIENT_URL` to your actual frontend URL
4. Click **"Manual Deploy"** → **"Clear build cache & deploy"**

---

## ✅ Verify Deployment

Once both services show "Live" (green dot):

1. **Visit Frontend**: `https://medguide-frontend.onrender.com`
2. **Test Registration**: Create a new account
3. **Test Login**: Sign in with your account
4. **Test Features**:
   - Upload a medical report
   - Use AI chat
   - Find nearby clinics (allow location access)

---

## 🐛 Quick Troubleshooting

### Backend Shows Error

**Check Logs:**
- Dashboard → medguide-backend → Logs
- Look for MongoDB connection errors

**Common Issues:**
```
Error: MongooseServerSelectionError
→ Fix: Check MONGODB_URI is correct and MongoDB Atlas allows 0.0.0.0/0

Error: JWT_SECRET is required
→ Fix: Add JWT_SECRET in environment variables

Error: CORS
→ Fix: Update CLIENT_URL to match your frontend URL
```

### Frontend Shows "Network Error"

**Check:**
- VITE_API_URL includes `/api/v1` at the end
- Backend is "Live" (green dot)
- Try rebuilding frontend: Manual Deploy → Clear build cache & deploy

### Services Keep Sleeping

**Free Tier Behavior:**
- Services sleep after 15 minutes of inactivity
- First load takes 30-60 seconds to wake up
- **Solution**: Upgrade to paid plan ($7/month per service) for 24/7 uptime

---

## 📊 Service URLs

After deployment, your URLs will be:

- **Frontend**: `https://medguide-frontend.onrender.com`
- **Backend**: `https://medguide-backend.onrender.com`
- **API**: `https://medguide-backend.onrender.com/api/v1`

---

## 💡 Pro Tips

1. **Custom Domain**: Add your own domain in Settings → Custom Domain
2. **Auto-Deploy**: Render auto-deploys on every git push to main branch
3. **Environment Sync**: Use Render's environment groups for shared variables
4. **Monitoring**: Check Metrics tab for performance insights
5. **Logs**: View real-time logs in the Logs tab

---

## 📱 Share Your App

Your MedGuide app is now live! Share the frontend URL with users:
```
https://medguide-frontend.onrender.com
```

---

## 💰 Cost

**Current Setup (Free):**
- Backend: Free tier
- Frontend: Free tier
- MongoDB: Free tier (512MB)
- **Total: $0/month**

**Production Ready (Recommended):**
- Backend: Starter plan ($7/month) - No sleep, 512MB RAM
- Frontend: Free tier (sufficient for static sites)
- MongoDB: Free or M2 ($9/month for 2GB)
- **Total: $7-16/month**

---

## 🆘 Need Help?

- **Render Docs**: [render.com/docs](https://render.com/docs)
- **Render Community**: [community.render.com](https://community.render.com)
- **MongoDB Docs**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)

---

**That's it! Your MedGuide app is deployed! 🎉**

For detailed deployment information, see [DEPLOYMENT.md](./DEPLOYMENT.md)
