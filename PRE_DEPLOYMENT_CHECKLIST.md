# Pre-Deployment Checklist

## ✅ Code Preparation
- [ ] Verify all API calls use the API client utility (see `lib/api-client.ts`)
- [ ] Check that environment-dependent URLs are handled correctly
- [ ] Ensure database queries only run on Render, not Vercel

## ✅ Environment Variables
- [ ] Generate secure values for NEXTAUTH_SECRET and AUTH_SECRET
- [ ] Have MongoDB Atlas DATABASE_URL ready
- [ ] Have all third-party API keys (M-Pesa, PesaPal, Stripe, etc.)
- [ ] Prepare Cloudinary credentials
- [ ] Prepare Supabase credentials
- [ ] Prepare Resend API key

## ✅ GitHub Setup
- [ ] Push all code changes to GitHub (`git push`)
- [ ] Verify `vercel.json` is in repository
- [ ] Verify `render.yaml` is in repository
- [ ] Verify `.env.vercel` and `DEPLOYMENT_ENV_REFERENCE.md` are in repository

## ✅ Vercel Setup
- [ ] Create Vercel account (vercel.com)
- [ ] Connect GitHub account to Vercel
- [ ] Import NairobiMart repository
- [ ] Add all environment variables
- [ ] Verify build succeeds

## ✅ Render Setup
- [ ] Create Render account (render.com)
- [ ] Connect GitHub account to Render
- [ ] Create Blueprint Instance from render.yaml
- [ ] Add all environment variables (especially DATABASE_URL)
- [ ] Verify deployment succeeds

## ✅ Post-Deployment Testing
- [ ] Visit https://nairobimart.vercel.app in browser
- [ ] Check if homepage loads
- [ ] Open DevTools → Network tab
- [ ] Try logging in → verify API calls go to `nairobimart-api.onrender.com`
- [ ] Try adding products to cart
- [ ] Try checkout flow

## ✅ Troubleshooting
- [ ] If API fails: Check Render dashboard for errors
- [ ] If CORS error: Add CORS headers to API routes
- [ ] If build fails on Vercel: Check build logs
- [ ] If build fails on Render: Check database connection

## Quick Redeploy Commands
```bash
# If you need to redeploy after changes:

# Update Vercel
git push  # Vercel auto-deploys on push

# Redeploy Render Blueprint
# Go to Render dashboard → Click "Deploy" button
```

## Monitoring
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Render Dashboard**: https://dashboard.render.com
- **Monitor API calls**: Open DevTools → Network tab
