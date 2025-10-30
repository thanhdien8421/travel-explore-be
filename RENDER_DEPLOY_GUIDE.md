# Travel Explore Backend - Deploy to Render

## 🚀 Quick Deploy Guide

### Step 1: Push Code to GitHub

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

---

### Step 2: Create Render Account & Service

1. Go to [render.com](https://render.com) and sign up (use GitHub login)
2. Click **"New +"** → Select **"Web Service"**
3. Connect your GitHub repository: `travel-explore-be`

---

### Step 3: Configure Web Service

Fill in these settings:

| Setting | Value |
|---------|-------|
| **Name** | `travel-explore-be` (or your choice) |
| **Region** | Singapore (closest to Vietnam) |
| **Branch** | `main` |
| **Root Directory** | Leave empty |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build && npx prisma generate` |
| **Start Command** | `npm start` |
| **Plan** | Free (or paid if needed) |

---

### Step 4: Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add these variables:

```env
NODE_ENV=production
PORT=8000

# Database URLs (from your Supabase)
DATABASE_URL=postgresql://postgres.hhfylfdhehpnnkugiyur:nguyendinhducmt22kh02@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true

DIRECT_URL=postgresql://postgres.hhfylfdhehpnnkugiyur:nguyendinhducmt22kh02@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres

# Frontend URL (will update after frontend deploy)
FRONTEND_URL=https://travel-explore.azurewebsites.net

# Supabase (for image storage)
NEXT_PUBLIC_SUPABASE_URL=https://hhfylfdhehpnnkugiyur.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
STORAGE_BUCKET=images
```

⚠️ **Important:** Copy values from your `.env` file!

---

### Step 5: Deploy!

1. Click **"Create Web Service"**
2. Render will automatically:
   - Clone your repo
   - Install dependencies
   - Build TypeScript
   - Generate Prisma Client
   - Start the server

3. Wait 3-5 minutes for first deploy

---

### Step 6: Get Your Backend URL

After deployment, you'll get a URL like:
```
https://travel-explore-be.onrender.com
```

Test it:
- Health check: `https://travel-explore-be.onrender.com/health`
- Swagger docs: `https://travel-explore-be.onrender.com/api-docs`
- API: `https://travel-explore-be.onrender.com/api/places?featured=true&limit=8`

---

### Step 7: Run Database Migration (One-time)

After first deploy, you need to run Prisma migrations:

1. Go to Render Dashboard → Your service
2. Click **"Shell"** tab (top right)
3. Run these commands:
   ```bash
   npx prisma migrate deploy
   npm run seed
   ```

This will:
- Create database tables
- Seed 20 tourist attractions

---

### Step 8: Update Frontend CORS

After backend deploys, update CORS in your code:

In `src/index.ts`, the CORS is already configured to accept:
- `https://travel-explore.azurewebsites.net` (your current frontend)
- Any `http://localhost:3xxx` (local development)

✅ No changes needed if you keep the same frontend URL!

---

## 🔧 Important Notes

### Auto-Deploy
Render automatically redeploys when you push to GitHub:
```bash
git push origin main  # Triggers auto-deploy
```

### Free Tier Limitations
- ⚠️ **Cold starts**: Service sleeps after 15 min of inactivity
- First request after sleep takes ~30-60 seconds
- Solution: Upgrade to paid plan ($7/month) for always-on

### Logs & Debugging
View logs in Render Dashboard:
1. Go to your service
2. Click **"Logs"** tab
3. See real-time server logs

### Custom Domain (Optional)
Add your own domain:
1. Render Dashboard → Service → "Settings"
2. Scroll to "Custom Domain"
3. Add domain and configure DNS

---

## 📋 Pre-Deployment Checklist

Before deploying, make sure:

- ✅ All code is committed and pushed to GitHub
- ✅ `.env` is in `.gitignore` (don't commit secrets!)
- ✅ `package.json` has correct build and start scripts
- ✅ Database (Supabase) is accessible from internet
- ✅ Prisma schema is up to date

---

## 🐛 Troubleshooting

### Build Failed?
Check Render logs for errors. Common issues:
- Missing dependencies: `npm install <package>`
- TypeScript errors: Fix and push again
- Prisma errors: Check DATABASE_URL is correct

### 500 Internal Server Error?
1. Check environment variables are set correctly
2. Check database connection
3. View logs in Render dashboard
4. Test locally first: `npm run build && npm start`

### Swagger not showing?
- Check `/api-docs` route
- Check Helmet CSP is disabled for Swagger
- Check logs for errors

### CORS errors from frontend?
- Verify `FRONTEND_URL` is set correctly
- Check CORS config in `src/index.ts`
- Test with Postman first

---

## 🔄 Update Process

To update your backend after deployment:

```bash
# Make changes to code
git add .
git commit -m "Update feature X"
git push origin main

# Render auto-deploys in 2-3 minutes
```

---

## 🎯 Next Steps After Deploy

1. **Test all endpoints** with Postman or Swagger
2. **Update frontend** to use new Render URL
3. **Test CORS** from frontend
4. **Monitor logs** for any errors
5. **Set up health check** monitoring (optional)

---

## 📞 Support

If you have issues:
1. Check Render documentation: https://render.com/docs
2. Check service logs in Render dashboard
3. Test locally first before debugging deploy

---

**Ready to deploy?** Follow Step 1 and push your code to GitHub! 🚀
