## NairobiMart Deployment: Environment Variables Reference

### VERCEL (Frontend + Public APIs)
These go in Vercel Dashboard → Project Settings → Environment Variables

```
NEXTAUTH_URL=https://nairobimart.vercel.app
NEXTAUTH_SECRET=<generate-a-random-string>
AUTH_SECRET=<generate-a-random-string>
AUTH_TRUST_HOST=true
NEXT_PUBLIC_API_URL=https://nairobimart-api.onrender.com
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-key>
CLOUDINARY_CLOUD_NAME=<your-cloudinary-name>
```

### RENDER (Backend API Only)
These go in Render Dashboard → Environment Variables

```
# Database - REQUIRED
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/nairobimart

# Auth
AUTH_TRUST_HOST=true
NEXTAUTH_URL=https://nairobimart-api.onrender.com
NEXTAUTH_SECRET=<same-as-vercel>
AUTH_SECRET=<same-as-vercel>

# Frontend URL (for CORS)
NEXT_PUBLIC_URL=https://nairobimart.vercel.app

# Google Auth (if using)
GOOGLE_CLIENT_ID=<your-google-id>
GOOGLE_CLIENT_SECRET=<your-google-secret>

# Supabase (for file storage/auth)
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Payments - M-Pesa
MPESA_CONSUMER_KEY=<your-key>
MPESA_CONSUMER_SECRET=<your-secret>
MPESA_SHORTCODE=<your-shortcode>
MPESA_PASSKEY=<your-passkey>
MPESA_CALLBACK_URL=https://nairobimart-api.onrender.com/api/mpesa/callback
MPESA_ENV=sandbox

# Payments - PesaPal
PESAPAL_CONSUMER_KEY=<your-key>
PESAPAL_CONSUMER_SECRET=<your-secret>
PESAPAL_ENV=production
PESAPAL_TEST_MODE=false

# Payments - Stripe
STRIPE_SECRET_KEY=<your-stripe-secret>
STRIPE_WEBHOOK_SECRET=<your-webhook-secret>

# Images - Cloudinary
CLOUDINARY_CLOUD_NAME=<your-name>
CLOUDINARY_API_KEY=<your-key>
CLOUDINARY_API_SECRET=<your-secret>

# Email - Resend
RESEND_API_KEY=<your-resend-key>

# Dropshipping
CJ_API_KEY=<your-cj-key>
```

---

## Summary

**Vercel serves:**
- ✅ Store pages (frontend)
- ✅ Admin pages (frontend)
- ❌ API routes (calls Render instead)

**Render serves:**
- ✅ API routes
- ✅ Database queries
- ✅ Payment processing
- ✅ Email sending

**Traffic flow:**
Browser → Vercel (renders page) → Render (fetches data from API)
