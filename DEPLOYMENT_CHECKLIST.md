# 🚀 Deployment Checklist

Use this checklist before deploying to production.

## Pre-Deployment

### Code Quality
- [ ] All console.log statements removed or replaced with proper logging
- [ ] No hardcoded API keys or secrets in code
- [ ] All TODO/FIXME comments addressed or documented
- [ ] Error handling implemented for all API calls
- [ ] Input validation implemented on frontend and backend

### Environment Variables
- [ ] `.env` files are in `.gitignore`
- [ ] `.env.example` files exist for both frontend and backend
- [ ] All required environment variables documented
- [ ] MongoDB connection string ready
- [ ] Gemini API key obtained
- [ ] JWT secret generated (or let Render auto-generate)

### Dependencies
- [ ] `package.json` includes all dependencies
- [ ] No dev dependencies in production code
- [ ] Package versions are compatible
- [ ] No vulnerabilities (`npm audit`)

### Database
- [ ] MongoDB Atlas cluster created
- [ ] Database user created with strong password
- [ ] Network access configured (0.0.0.0/0 for Render)
- [ ] Connection string tested locally
- [ ] Database indexes created (if any)

### Security
- [ ] CORS configured properly
- [ ] JWT authentication working
- [ ] Password hashing implemented
- [ ] File upload validation implemented
- [ ] Rate limiting considered (if needed)
- [ ] HTTPS enforced in production

### Testing
- [ ] User registration works
- [ ] User login works
- [ ] File upload works
- [ ] AI chat functionality works
- [ ] Clinic finder works
- [ ] All protected routes require authentication
- [ ] Error messages are user-friendly

## Deployment

### GitHub
- [ ] Code pushed to GitHub repository
- [ ] `.env` files NOT committed
- [ ] `render.yaml` committed
- [ ] README.md updated with project info

### Render Setup
- [ ] Render account created
- [ ] GitHub connected to Render
- [ ] Blueprint applied or services created manually
- [ ] Both services deployed successfully

### Backend Configuration
- [ ] `NODE_ENV=production` set
- [ ] `PORT=10000` set
- [ ] `MONGODB_URI` configured
- [ ] `JWT_SECRET` generated
- [ ] `JWT_EXPIRE` set to `30d`
- [ ] `JWT_COOKIE_EXPIRE` set to `30`
- [ ] `CLIENT_URL` set to frontend URL
- [ ] `GEMINI_API_KEY` configured

### Frontend Configuration
- [ ] `VITE_API_URL` set to backend URL with `/api/v1`
- [ ] `VITE_GEMINI_API_KEY` configured
- [ ] `VITE_GEMINI_MODEL` set (optional)

### Post-Deployment
- [ ] Backend service is "Live" (green)
- [ ] Frontend service is "Live" (green)
- [ ] Backend CORS updated with actual frontend URL
- [ ] Backend redeployed after CORS update

## Testing in Production

### Basic Functionality
- [ ] Frontend loads without errors
- [ ] Can access login page
- [ ] Can create new account
- [ ] Can log in with new account
- [ ] Dashboard displays correctly
- [ ] Can log out

### Features
- [ ] File upload works (PDF/image)
- [ ] AI chat responds correctly
- [ ] Medical report analysis works
- [ ] Clinic finder shows nearby clinics
- [ ] Location permission prompts correctly
- [ ] All pages accessible

### Performance
- [ ] Page load time acceptable
- [ ] Images load correctly
- [ ] No console errors in browser
- [ ] API responses are reasonable (<3s)
- [ ] No memory leaks observed

### Mobile
- [ ] Site responsive on mobile
- [ ] Touch interactions work
- [ ] Text is readable
- [ ] Buttons are clickable
- [ ] Forms work on mobile keyboards

## Monitoring

### Logs
- [ ] Backend logs checked for errors
- [ ] No sensitive data in logs
- [ ] Error tracking configured (optional)

### Metrics
- [ ] Response times monitored
- [ ] Memory usage checked
- [ ] CPU usage acceptable
- [ ] Database connections stable

## Documentation

- [ ] README.md updated with live URL
- [ ] API documentation created (if needed)
- [ ] Deployment guide available
- [ ] Troubleshooting guide available
- [ ] Environment variables documented

## Optional Enhancements

- [ ] Custom domain configured
- [ ] SSL certificate verified (auto on Render)
- [ ] CDN configured for assets (if needed)
- [ ] Database backups scheduled
- [ ] Monitoring/alerting set up
- [ ] Analytics integrated (optional)
- [ ] Error tracking service (Sentry, etc.)
- [ ] Performance monitoring (New Relic, etc.)

## Known Issues (Document These)

**Issue 1:**
- Description:
- Workaround:
- Status:

**Issue 2:**
- Description:
- Workaround:
- Status:

---

## Service Information

**Deployed On:** ____________

**Frontend URL:** https://medguide-frontend.onrender.com

**Backend URL:** https://medguide-backend.onrender.com

**MongoDB Cluster:** ____________

**Render Plan:** Free Tier

**Estimated Cost:** $0/month

---

## Emergency Contacts

**Render Support:** support@render.com

**MongoDB Support:** https://support.mongodb.com

**Project Maintainer:** ____________

---

## Rollback Plan

If deployment fails:

1. Check Render logs for errors
2. Verify all environment variables
3. Test database connection
4. Redeploy from last known good commit
5. Contact support if issue persists

```bash
# Rollback to previous commit
git log --oneline  # Find last good commit
git revert <commit-hash>
git push origin main  # Triggers auto-deploy on Render
```

---

**Deployment Completed:** ☐ Yes ☐ No

**Signed Off By:** ____________

**Date:** ____________

---

✅ **All checks passed? You're ready to go live!**
