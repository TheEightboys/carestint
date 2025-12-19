# CareStint Payment Setup Guide

> **For Your Client**: This guide explains how to set up Flutterwave payments for CareStint.

## Quick Start

Your client needs to:
1. Create a Flutterwave account
2. Get API keys
3. Add keys to environment variables
4. Set up the webhook URL

---

## Step 1: Create Flutterwave Account

1. Go to [https://dashboard.flutterwave.com/signup](https://dashboard.flutterwave.com/signup)
2. Register with business details
3. Verify your email and phone
4. Complete KYC (Know Your Customer) verification

> **Note**: Flutterwave requires business verification before you can accept live payments.

---

## Step 2: Get Your API Keys

1. Log in to [Flutterwave Dashboard](https://dashboard.flutterwave.com)
2. Click **Settings** → **API** in the sidebar
3. You'll see:
   - **Public Key**: Starts with `FLWPUBK-`
   - **Secret Key**: Starts with `FLWSECK-`
   - **Encryption Key**: A 16-character string

> ⚠️ **Important**: Use **Test Keys** first (toggle "Test Mode" in dashboard). Only switch to **Live Keys** when ready for real payments.

---

## Step 3: Set Up Environment Variables

Create a `.env` file (or update existing) with these values:

```env
# Firebase Configuration (already set up)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# ===== FLUTTERWAVE - ENTER YOUR KEYS HERE =====

# Public key (safe for client-side)
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-xxxxxxxxxxxx-X

# Secret key (server-side only - NEVER expose to client!)
FLUTTERWAVE_SECRET_KEY=FLWSECK-xxxxxxxxxxxx-X

# Encryption key
FLUTTERWAVE_ENCRYPTION_KEY=xxxxxxxxxxxxxxxx

# Webhook secret (from Step 4 below)
FLUTTERWAVE_WEBHOOK_SECRET=your_webhook_secret

# Leave this as is
NEXT_PUBLIC_FLUTTERWAVE_BASE_URL=https://api.flutterwave.com/v3

# Your production URL
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Cron job security (generate with: openssl rand -hex 32)
CRON_SECRET=your_random_string_here
```

---

## Step 4: Set Up Webhook URL

Webhooks notify CareStint when payments complete. **This is required!**

1. In Flutterwave Dashboard, go to **Settings** → **Webhooks**
2. Add your webhook URL:
   ```
   https://your-domain.com/api/webhooks/flutterwave
   ```
3. Copy the **Webhook Secret Hash** and add it to your `.env` as `FLUTTERWAVE_WEBHOOK_SECRET`
4. Save

---

## Step 5: Vercel Cron Jobs (Optional but Recommended)

For automated payout processing, add this to your `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/process-payouts",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/expire-payments",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

This will:
- Process eligible payouts every hour
- Expire stale payments every 5 minutes

---

## Testing Payments

### Test M-Pesa
Use any Kenyan phone number format in sandbox mode. Payments will be simulated.

### Test Card
Use Flutterwave test cards:

| Card Number | CVV | Expiry | PIN | OTP |
|------------|-----|--------|-----|-----|
| 5531 8866 5214 2950 | 564 | 09/32 | 3310 | 12345 |
| 5399 8383 8383 8381 | 883 | 10/31 | 3310 | 12345 |

---

## Going Live Checklist

- [ ] Complete Flutterwave KYC verification
- [ ] Switch from Test Keys to Live Keys in `.env`
- [ ] Verify webhook URL is set correctly
- [ ] Test a real ₦100 payment to confirm everything works
- [ ] Update `NEXT_PUBLIC_APP_URL` to your production domain

---

## Payment Flow Summary

```
Employer Accepts Professional
        ↓
Payment Modal Opens (M-Pesa or Card)
        ↓
Payment Processed via Flutterwave
        ↓
Webhook Confirms Payment
        ↓
Shift Confirmed, Notifications Sent
        ↓
After Shift: Wait 24 Hours
        ↓
Automated Payout to Professional
```

---

## Support

- **Flutterwave Support**: [support@flutterwave.com](mailto:support@flutterwave.com)
- **Documentation**: [https://developer.flutterwave.com](https://developer.flutterwave.com)
