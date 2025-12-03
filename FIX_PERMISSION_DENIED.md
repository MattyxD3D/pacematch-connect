# 🔧 Fix: Permission Denied Error for Email

## The Problem

You're getting "permission denied" when trying to send verification emails. This happens because:

1. **Firebase Cloud Function is not deployed yet** (most likely)
2. The function needs to be configured to allow unauthenticated calls

---

## ✅ Quick Fix: Use Fallback Email Service

The app automatically falls back to EmailJS or SendGrid if Firebase Functions isn't available. But you need to set up one of them.

### Option 1: Set Up EmailJS (Easiest - 5 minutes)

1. **Sign up at:** https://www.emailjs.com/ (free tier available)

2. **Create email service:**
   - Go to Email Services → Add New Service
   - Choose Gmail (or your email provider)
   - Connect your email account

3. **Create email template:**
   - Go to Email Templates → Create New Template
   - Template ID: `template_xxxxx` (copy this)
   - Service ID: `service_xxxxx` (copy this)
   - Public Key: Copy from Integration → API Keys

4. **Add to `.env` file:**
   ```bash
   VITE_EMAILJS_PUBLIC_KEY=your_public_key
   VITE_EMAILJS_SERVICE_ID=your_service_id
   VITE_EMAILJS_TEMPLATE_ID=your_template_id
   ```

5. **Restart your dev server**

**Done!** Emails will now work via EmailJS.

---

### Option 2: Deploy Firebase Cloud Function

If you want to use Firebase Cloud Functions (more secure):

1. **Install dependencies:**
   ```bash
   cd /Applications/q/pacematch-connect/functions
   npm install
   ```

2. **Set up email service** (choose one):
   - **Gmail:** Get App Password from https://myaccount.google.com/apppasswords
   - **SendGrid:** Sign up and get API key

3. **Set environment variables:**
   ```bash
   # For Gmail:
   firebase functions:config:set gmail.user="your-email@gmail.com" gmail.app_password="your-app-password"
   ```

4. **Deploy:**
   ```bash
   cd /Applications/q/pacematch-connect
   firebase deploy --only functions
   ```

5. **Make function public** (allow unauthenticated calls):
   ```bash
   firebase functions:config:get
   # Then in Firebase Console:
   # Go to Functions → sendOTPEmail → Permissions
   # Add "allUsers" with role "Cloud Functions Invoker"
   ```

---

## 🎯 Recommended: Use EmailJS for Now

**Why EmailJS?**
- ✅ No deployment needed
- ✅ Works immediately
- ✅ Free tier available
- ✅ No backend setup
- ✅ Perfect for development/testing

**Later, you can switch to Firebase Functions for production.**

---

## 📝 Current Behavior

The app tries in this order:
1. **Firebase Cloud Functions** (if deployed)
2. **EmailJS** (if configured)
3. **SendGrid** (if configured)
4. **Console log** (for development - code shown in console)

Right now, it's falling back to console logging because none are configured.

---

## ✅ Quick Setup (EmailJS)

1. Go to: https://www.emailjs.com/
2. Sign up (free)
3. Create service + template
4. Add keys to `.env`
5. Restart dev server
6. **Done!** ✅

**See `FIREBASE_EMAIL_SETUP.md` for Firebase Functions setup if you prefer that route.**
