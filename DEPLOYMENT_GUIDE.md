# Deployment Guide: Vercel + Render Split

## PART 1: Deploy Frontend to Vercel

### 1. Create Vercel Account
- Go to https://vercel.com
- Sign up with GitHub account

### 2. Import Your Project
- Click "New Project"
- Select your GitHub repository (NairobiMart)
- Vercel will auto-detect it's a Next.js project

### 3. Configure Environment Variables
- Go to Settings → Environment Variables
- Add the variables from `.env.vercel`:
  ```
  NEXTAUTH_URL=https://nairobimart.vercel.app
  NEXTAUTH_SECRET=<generate-secure-string>
  AUTH_SECRET=<generate-secure-string>
  AUTH_TRUST_HOST=true
  NEXT_PUBLIC_API_URL=https://nairobimart-api.onrender.com
  NEXT_PUBLIC_SUPABASE_URL=xxx
  NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
  CLOUDINARY_CLOUD_NAME=xxx
  ```

### 4. Deploy
- Click "Deploy"
- Wait for build (3-5 minutes)
- Your app is now live at: https://nairobimart.vercel.app

---

## PART 2: Deploy Backend to Render

### 1. Create Render Account
- Go to https://render.com
- Sign up with GitHub account

### 2. Create Blueprint from render.yaml
- Click "Blueprints" 
- Click "New Blueprint Instance"
- Select your GitHub repository (NairobiMart)
- Render will read render.yaml automatically
- Click "Create"

### 3. Add Environment Variables (During Creation)
Render will prompt for env vars marked as `sync: false` in render.yaml:
  ```
  DATABASE_URL=mongodb+srv://...
  MPESA_CONSUMER_KEY=xxx
  MPESA_CONSUMER_SECRET=xxx
  PESAPAL_CONSUMER_KEY=xxx
  PESAPAL_CONSUMER_SECRET=xxx
  STRIPE_SECRET_KEY=xxx
  CLOUDINARY_API_KEY=xxx
  CLOUDINARY_API_SECRET=xxx
  RESEND_API_KEY=xxx
  CJ_API_KEY=xxx
  ```

### 4. Deploy
- Click "Create"
- Render will build and deploy
- Your API will be live at: https://nairobimart-api.onrender.com

---

## PART 3: Connect Frontend & Backend

### 1. Test API Connection
- Go to your Vercel frontend: https://nairobimart.vercel.app
- Open browser DevTools (F12) → Network tab
- Try logging in or making an API call
- Check if requests go to `nairobimart-api.onrender.com`

### 2. If API Calls Fail
Check these:
- ✅ Render API is running (check dashboard)
- ✅ Environment variables are set correctly on Render
- ✅ Database connection works (`DATABASE_URL` is correct)
- ✅ CORS is enabled (check API routes)

---

## Important Notes

✅ **Vercel frontend will now be lightweight** (no database calls)
✅ **Render API serves all backend logic** (from different server)
✅ **Both platforms use free tier** (sufficient for this split)
✅ **You can monitor each separately** (Vercel dashboard, Render dashboard)

⚠️ **First requests might be slow** (Render free tier cold starts in ~30 seconds)
⚠️ **Database must be separate** (MongoDB Atlas or similar)
⚠️ **Environment secrets must match** (NEXTAUTH_SECRET same on both)

---

## Troubleshooting

### Vercel: "API not found (503)"
- Check `NEXT_PUBLIC_API_URL` env var is set to Render URL
- Check Render API is running
- Check browser console for actual URL being called

### Render: "Cannot find database"
- Verify `DATABASE_URL` is correct
- Check MongoDB Atlas network access allows Render IPs
- Test connection locally first

### CORS Errors
- Check if `NEXT_PUBLIC_URL` is set on Render
- May need to add CORS middleware to API routes

---

## Next Steps
1. Push all changes to GitHub
2. Go to Vercel and import project
3. Go to Render and create blueprint instance
4. Add environment variables to both
5. Test the connection
