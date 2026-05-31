# Migration Guide: From Old Render Deployment to New Blueprint Architecture

## PHASE 1: Undo Previous Render Deployment (5 minutes)

### Step 1: Delete Old Render Service
1. Go to **https://dashboard.render.com**
2. Find your current service (likely named `nairobimart-backend` or similar)
3. Click on the service name
4. Scroll to bottom → Click **"Delete Service"**
5. Confirm deletion by typing the service name
6. ✅ Old deployment is now removed

### Step 2: Verify Deletion
- Refresh the Render dashboard
- Your service should no longer appear in the list
- ✅ Confirmed: old deployment is gone

---

## PHASE 2: Prepare for New Blueprint Deployment (5 minutes)

### Step 1: Push Updated Code to GitHub
```powershell
# In PowerShell, in your project root:
git status  # See what files changed
git add .
git commit -m "Setup Vercel + Render split architecture with Blueprint"
git push origin main
```

**What you're pushing:**
- ✅ `vercel.json` (Vercel config)
- ✅ `render.yaml` (Render Blueprint config)
- ✅ `.env.vercel` (environment template)
- ✅ `lib/api-client.ts` (API routing utility)
- ✅ Updated docs

### Step 2: Verify Push Succeeded
- Go to **https://github.com/yourusername/NairobiMart**
- Verify you see the new files in your repository
- ✅ GitHub is updated

---

## PHASE 3: Deploy Frontend to Vercel (10 minutes)

### Step 1: Create Vercel Account
- Go to **https://vercel.com**
- Click "Sign Up"
- Choose "GitHub" → Authorize Vercel to access your repos
- ✅ Account created

### Step 2: Import Your Repository
- After login, click **"New Project"**
- Select your `NairobiMart` repository
- Click **"Import"**
- Vercel will auto-detect Next.js settings
- ✅ Project imported

### Step 3: Add Environment Variables for Vercel
- In the import screen, click **"Environment Variables"**
- Add these variables:

```
Name: NEXTAUTH_URL
Value: https://nairobimart.vercel.app

Name: NEXTAUTH_SECRET
Value: <generate-random-string-1>

Name: AUTH_SECRET  
Value: <generate-random-string-2>

Name: AUTH_TRUST_HOST
Value: true

Name: NEXT_PUBLIC_API_URL
Value: https://nairobimart-api.onrender.com

Name: NEXT_PUBLIC_SUPABASE_URL
Value: <your-supabase-url>

Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: <your-supabase-key>

Name: CLOUDINARY_CLOUD_NAME
Value: <your-cloudinary-name>
```

**To generate secure random strings:**
```powershell
# In PowerShell, run:
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Guid]::NewGuid())) 
# Copy the output twice (one for NEXTAUTH_SECRET, one for AUTH_SECRET)
```

### Step 4: Deploy to Vercel
- Click **"Deploy"**
- Wait for build (usually 3-5 minutes)
- Once done, you'll get a URL like: `https://nairobimart.vercel.app`
- ✅ Frontend is now live

### Step 5: Test Vercel Frontend
- Click the URL to visit your site
- Verify pages load (store, admin, homepage)
- Don't worry if API calls fail yet (backend isn't set up)
- ✅ Frontend working

---

## PHASE 4: Deploy Backend API to Render Using Blueprint (10 minutes)

### Step 1: Go to Render Blueprints
- Go to **https://dashboard.render.com**
- Click **"Blueprints"** in the left menu
- Click **"New Blueprint Instance"**
- ✅ Ready to create

### Step 2: Select Your Repository
- Choose **"GitHub"** (or connect if not already)
- Select your `NairobiMart` repository
- Click **"Connect"** or **"Select"**
- ✅ Repository selected

### Step 3: Render Reads render.yaml
- Render will automatically read your `render.yaml` file
- It will show:
  - Service name: `nairobimart-api`
  - Runtime: Node
  - Build command: `npm install && npm run build`
  - Start command: `npm start`
- ✅ Settings are auto-populated

### Step 4: Add Environment Variables
Render will ask for environment variables marked as `sync: false` in render.yaml.
Add these values:

```
DATABASE_URL
Value: mongodb+srv://username:password@cluster.mongodb.net/nairobimart?retryWrites=true&w=majority
(Get this from MongoDB Atlas → Connect → Connection String)

NEXTAUTH_URL
Value: https://nairobimart-api.onrender.com

NEXTAUTH_SECRET
Value: <same-as-Vercel-NEXTAUTH_SECRET>

AUTH_SECRET
Value: <same-as-Vercel-AUTH_SECRET>

AUTH_TRUST_HOST
Value: true

NEXT_PUBLIC_URL
Value: https://nairobimart.vercel.app

GOOGLE_CLIENT_ID
Value: <your-value-if-using>

GOOGLE_CLIENT_SECRET
Value: <your-value-if-using>

NEXT_PUBLIC_SUPABASE_URL
Value: <your-supabase-url>

NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: <your-supabase-key>

SUPABASE_SERVICE_ROLE_KEY
Value: <your-service-role-key>

MPESA_CONSUMER_KEY
Value: <your-key>

MPESA_CONSUMER_SECRET
Value: <your-secret>

MPESA_SHORTCODE
Value: <your-shortcode>

MPESA_PASSKEY
Value: <your-passkey>

MPESA_CALLBACK_URL
Value: https://nairobimart-api.onrender.com/api/mpesa/callback

MPESA_ENV
Value: sandbox

PESAPAL_CONSUMER_KEY
Value: <your-key>

PESAPAL_CONSUMER_SECRET
Value: <your-secret>

PESAPAL_ENV
Value: production

PESAPAL_TEST_MODE
Value: false

STRIPE_SECRET_KEY
Value: <your-stripe-secret>

STRIPE_WEBHOOK_SECRET
Value: <your-webhook-secret>

CLOUDINARY_CLOUD_NAME
Value: <your-name>

CLOUDINARY_API_KEY
Value: <your-key>

CLOUDINARY_API_SECRET
Value: <your-secret>

RESEND_API_KEY
Value: <your-resend-key>

CJ_API_KEY
Value: <your-cj-key>
```

### Step 5: Create Blueprint Instance
- After adding all env vars, click **"Create Blueprint Instance"**
- Render will start deploying
- Watch the build logs
- ✅ Deployment in progress

### Step 6: Wait for Deployment
- Build takes 5-10 minutes
- You'll see logs:
  - "Installing dependencies..."
  - "Building application..."
  - "Starting server..."
- Once complete: `✅ Your service is live`
- Your API URL: `https://nairobimart-api.onrender.com`
- ✅ Backend deployed

---

## PHASE 5: Test the Complete Setup (5 minutes)

### Step 1: Test Frontend
- Go to **https://nairobimart.vercel.app**
- Homepage should load
- Try clicking around (products, categories, etc.)

### Step 2: Test API Connection
- Open DevTools in browser: **F12**
- Go to **"Network"** tab
- Try an action that calls the API:
  - Try to log in
  - Try to add product to cart
  - Try to search products
- In Network tab, look for requests
- **IMPORTANT**: Requests should show URL like:
  - `https://nairobimart-api.onrender.com/api/...`
  - NOT `https://nairobimart.vercel.app/api/...`

### Step 3: If API Calls Show Errors (503, CORS, etc.)
Check these troubleshooting steps in the next section...

---

## Troubleshooting Common Issues

### ❌ Issue: "Failed to load API" or 503 Error

**Solution:**
1. Go to **Render Dashboard**
2. Click on your `nairobimart-api` service
3. Scroll down to see build logs
4. Look for errors like:
   - `DATABASE_URL not found` → Add DATABASE_URL env var
   - `Prisma schema error` → Check `prisma/schema.prisma`
   - `Port not found` → Make sure app listens on port 3000

### ❌ Issue: CORS Error (blocked by browser)

**Solution:**
1. Your API routes need CORS headers
2. Check if your API route handlers have:
```typescript
headers: {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_URL || '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}
```

### ❌ Issue: "Cannot connect to database"

**Solution:**
1. Go to MongoDB Atlas → Network Access
2. Add IP: `0.0.0.0/0` (or find Render's IP range)
3. Verify DATABASE_URL is correct (check MongoDB Atlas → Connect)
4. Go to Render dashboard → Redeploy service (button in top right)

### ❌ Issue: Cold start (first request takes 30+ seconds)

**Solution:**
- This is normal on Render free tier!
- First request will be slow
- Subsequent requests are faster
- Solution: Upgrade to paid tier if needed

---

## Summary of Changes

| Component | Before | After |
|-----------|--------|-------|
| Frontend | Render (crashed) | Vercel ✅ |
| Backend API | Render (same service) | Render (separate) ✅ |
| Database | Local or Atlas | MongoDB Atlas ✅ |
| Memory Issues | 512MB (shared) | Unlimited (separate) ✅ |
| Cold Starts | Slow | Faster ✅ |

---

## Quick Reference: Your New URLs

```
Frontend:  https://nairobimart.vercel.app
Backend:   https://nairobimart-api.onrender.com
Database:  MongoDB Atlas (internal connection)
```

---

## Need Help?

If anything fails:
1. Check the specific troubleshooting section above
2. Check Render dashboard logs
3. Check Vercel dashboard logs
4. Review environment variables (must match on both platforms)
