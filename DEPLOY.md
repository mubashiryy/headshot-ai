# HeadshotAI — Deployment Guide

Free-to-host on Vercel. You only pay for API usage (Replicate per-generation + Stripe transaction fees).

---

## Step 1 — Set up Replicate (AI engine)

1. Sign up at **https://replicate.com** (free account, $5 credit on sign-up)
2. Go to **Account → API Tokens** → create a token
3. Visit **https://replicate.com/tencentarc/photomaker**
4. Click **"Use this model"** and note the latest version hash (looks like `cc35083c...`)

Cost: ~$0.05–0.10 per 4-image generation. At $19/user you have great margin.

---

## Step 2 — Set up Stripe

1. Sign up at **https://stripe.com** (free, no upfront cost)
2. In the Stripe dashboard go to **Products → Add product**

### Create Product 1 — One-time
- Name: `HeadshotAI HD Download`
- Price: `$19.00` · One-time
- Copy the **Price ID** (starts with `price_`)

### Create Product 2 — Subscription
- Name: `HeadshotAI Pro`
- Price: `$12.00` · Monthly recurring
- Copy the **Price ID**

3. Go to **Developers → API keys** → copy your **Publishable key** and **Secret key**

---

## Step 3 — Deploy to Vercel (free)

### Option A — GitHub deploy (recommended)

```bash
# 1. Push to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/headshot-ai.git
git push -u origin main

# 2. Go to vercel.com → Add New Project → import your GitHub repo
# 3. Add environment variables (see below)
# 4. Deploy!
```

### Option B — Vercel CLI

```bash
npm install -g vercel
vercel deploy --prod
```

---

## Step 4 — Add environment variables in Vercel

In **Vercel → Project → Settings → Environment Variables**, add:

| Variable | Value |
|---|---|
| `REPLICATE_API_TOKEN` | your Replicate token |
| `PHOTOMAKER_VERSION` | version hash from Replicate |
| `STRIPE_SECRET_KEY` | `sk_live_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` |
| `STRIPE_PRICE_ONE_TIME` | `price_...` from Step 2 |
| `STRIPE_PRICE_SUBSCRIPTION` | `price_...` from Step 2 |
| `STRIPE_WEBHOOK_SECRET` | (set up in Step 5) |
| `NEXT_PUBLIC_BASE_URL` | `https://your-app.vercel.app` |

---

## Step 5 — Set up Stripe webhook (required for subscriptions)

1. In Stripe → **Developers → Webhooks → Add endpoint**
2. Endpoint URL: `https://your-app.vercel.app/api/webhook`
3. Events to select:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy the **Signing secret** (`whsec_...`) → add to Vercel as `STRIPE_WEBHOOK_SECRET`
5. Redeploy Vercel so the new env var takes effect

---

## Step 6 — Test end to end

1. Visit your Vercel URL
2. Upload a selfie → click **Generate My Headshots**
3. Wait ~60s for results (watermarked)
4. Click **Download HD for $19** → use Stripe test card `4242 4242 4242 4242` (switch to test mode in Stripe first)
5. Confirm you land on `/success` and can download all 4 HD images

---

## Architecture overview

```
User browser
  │
  ├─ POST /api/generate   →  Starts Replicate PhotoMaker job (async)
  ├─ GET  /api/status/[id] →  Polls Replicate every 3.5s
  ├─ GET  /api/watermark   →  Serves free watermarked preview (sharp server-side)
  │
  ├─ POST /api/checkout    →  Creates Stripe Checkout session
  ├─ POST /api/webhook     →  Handles Stripe events
  │
  └─ GET  /api/success-details  →  Verifies Stripe payment, returns image URLs
     GET  /api/download         →  Proxies full HD image (payment-gated)
```

**Hosting cost:** $0/month on Vercel free tier  
**AI cost:** ~$0.05–0.10 / generation (Replicate)  
**Payment processing:** 2.9% + 30¢ per transaction (Stripe)

---

## Customisation ideas (post-launch)

- Add more styles (outdoor, casual, team photo)
- Add user accounts with generation history
- Email delivery of HD headshots via Resend (free tier)
- Add before/after comparison slider on the landing page
- A/B test pricing ($19 vs $29)
