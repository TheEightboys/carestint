# CareStint Deployment Guide

## Prerequisites
- Node.js 18+ installed
- Git installed
- Firebase account with project created
- Vercel account

---

## Step 1: Environment Variables

Before deploying, you need to set up your environment variables.

### Required Firebase Variables:
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
```

### Get these values from:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon → Project Settings
4. Scroll to "Your apps" section
5. Copy each value

---

## Step 2: Push to GitHub (Safely)

### Verify no secrets are exposed:
```bash
# Check what files will be committed
git status

# Make sure .env files are NOT listed
# If they are, they're not in .gitignore properly
```

### Create repository and push:
```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - CareStint Healthcare Staffing Platform"

# Add your GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/carestint.git

# Push
git push -u origin main
```

---

## Step 3: Deploy to Vercel

### Option A: Via Vercel Dashboard (Recommended)
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. **IMPORTANT**: Add Environment Variables
   - Click "Environment Variables" section
   - Add each Firebase variable from Step 1
5. Click "Deploy"

### Option B: Via CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts, then add environment variables in Vercel Dashboard
```

---

## Step 4: Configure Firebase for Production

### Update Firebase Auth domains:
1. Go to Firebase Console → Authentication → Settings
2. Add your Vercel domain to "Authorized domains":
   - `your-project.vercel.app`
   - Any custom domain

### Update Firestore Rules (if needed):
```bash
firebase deploy --only firestore:rules
```

---

## Step 5: Share with Client

Once deployed, your app will be available at:
- **Vercel URL**: `https://your-project.vercel.app`
- **Custom Domain**: Configure in Vercel Dashboard → Domains

### Share these with your client:
1. Production URL
2. Test accounts (if created)
3. Documentation/user guide

---

## Security Checklist ✅

- [x] `.env` files are in `.gitignore`
- [x] No hardcoded API keys in source code
- [x] Firebase config uses environment variables
- [x] Firestore rules deployed
- [x] Auth domains configured

---

## Troubleshooting

### "Firebase not initialized" error
- Check environment variables are set in Vercel

### "Missing permissions" error
- Deploy latest Firestore rules: `firebase deploy --only firestore:rules`

### Build fails
- Check Node.js version (needs 18+)
- Run `npm install` locally first
