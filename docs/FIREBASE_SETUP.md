# Firebase Authentication Setup Guide

This guide will help you set up **real Firebase authentication** for CareStint using the Firebase **free Spark plan**.

## What's Included Free

| Feature | Free Limit |
|---------|------------|
| Email/Password Auth | **Unlimited** |
| Phone OTP (SMS) | **10,000/month** |
| Firestore | 50K reads, 20K writes/day |
| Storage | 5GB |

---

## Step-by-Step Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Create a project"** (or use existing)
3. Enter project name (e.g., "carestint")
4. Disable Google Analytics if not needed (optional)
5. Click **Create project**

### Step 2: Add Web App

1. In Firebase Console, click the gear icon → **Project settings**
2. Scroll down to **"Your apps"**
3. Click the web icon **(</>)** to add a web app
4. Enter app nickname: "CareStint Web"
5. Click **Register app**
6. Copy the Firebase configuration object shown

### Step 3: Create .env.local File

Create a file named `.env.local` in the project root with your Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Step 4: Enable Email/Password Authentication

1. In Firebase Console, go to **Authentication** (left sidebar)
2. Click **"Get started"** if first time
3. Go to **Sign-in method** tab
4. Click on **Email/Password**
5. Toggle **"Enable"** to ON
6. Click **Save**

### Step 5: Enable Phone Authentication

1. In **Authentication → Sign-in method**
2. Click on **Phone**
3. Toggle **"Enable"** to ON
4. Click **Save**

### Step 6: Add Authorized Domains

1. In **Authentication → Settings** tab
2. Scroll to **Authorized domains**
3. Add your production domain(s)
4. `localhost` is already authorized by default

### Step 7: Enable Firestore Database

1. Go to **Firestore Database** (left sidebar)
2. Click **Create database**
3. Select **Start in test mode** (for development)
4. Choose a location close to your users
5. Click **Enable**

### Step 8: Set Firestore Security Rules (For Production)

Go to **Firestore → Rules** and set:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /employers/{employerId} {
      allow read, write: if request.auth != null;
    }
    match /professionals/{professionalId} {
      allow read, write: if request.auth != null;
    }
    match /stints/{stintId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /applications/{applicationId} {
      allow read, write: if request.auth != null;
    }
    match /disputes/{disputeId} {
      allow read, write: if request.auth != null;
    }
    match /payouts/{payoutId} {
      allow read: if request.auth != null;
    }
    match /audit_logs/{logId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

---

## Restart Dev Server

After creating `.env.local`, restart the dev server:

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

---

## Test Real Authentication

1. Open http://localhost:9002
2. Click "Sign in as Employer/Facility"
3. Switch to "Sign up" and create a real account
4. Use a real email - you'll be able to sign back in!

For Phone OTP:
1. Switch to "Phone" tab
2. Enter your real phone number with country code (e.g., +254712345678)
3. You will receive a real SMS with OTP
4. Enter the OTP to verify

---

## Troubleshooting

### "auth/configuration-not-found" Error
- Email/Password provider is not enabled
- Go to Firebase Console → Authentication → Sign-in method → Enable Email/Password

### "auth/operation-not-allowed" Error
- The auth provider is disabled
- Enable the required provider in Firebase Console

### Phone OTP Not Sending
- Phone provider not enabled in Firebase Console
- Add localhost to authorized domains
- Check if you've exceeded free SMS limit (10k/month)

### reCAPTCHA Issues
- Phone auth requires reCAPTCHA verification
- Make sure you're on an authorized domain
- Try using incognito mode if issues persist

---

## Production Checklist

- [ ] Create production Firebase project (separate from dev)
- [ ] Set production environment variables
- [ ] Update Firestore security rules
- [ ] Add production domain to authorized domains
- [ ] Enable App Check for additional security (optional)
