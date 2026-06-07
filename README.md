This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Cron Jobs and Retention Automation

This project includes two GitHub Actions workflows for free scheduled retention automation:

- `.github/workflows/abandoned-cart.yml` — runs daily and calls `/api/cron/abandoned-cart`
- `.github/workflows/winback.yml` — runs weekly and calls `/api/cron/winback`

### Required secrets

Add these repository secrets in GitHub: `Settings > Secrets and variables > Actions`.

- `RENDER_BACKEND_URL` — your Render backend URL, for example `https://nairobimart-api.onrender.com`
- `CRON_SECRET` — the same secret value configured in your Render service environment variables

### Render setup

In Render, add `CRON_SECRET` as an environment variable for your backend service.

### Manual test

Use PowerShell:

```powershell
$env:CRON_SECRET = "your-secret"
$env:BACKEND = "https://nairobimart-api.onrender.com"
$headers = @{ Authorization = "Bearer $env:CRON_SECRET" }

Invoke-RestMethod -Uri "$env:BACKEND/api/cron/abandoned-cart" -Headers $headers -Method Get
Invoke-RestMethod -Uri "$env:BACKEND/api/cron/winback" -Headers $headers -Method Get
```

### What the endpoints do

- `/api/cron/abandoned-cart` finds abandoned carts and sends recovery coupons via SMS or email.
- `/api/cron/winback` finds customers who haven’t ordered in 60 days and sends a win-back coupon.

Both endpoints validate the header `Authorization: Bearer <CRON_SECRET>` before running.
