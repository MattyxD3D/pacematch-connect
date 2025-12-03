# 📱 Firebase Phone Authentication Setup Guide

This guide will help you set up Firebase Phone Authentication as a backup login method for PaceMatch.

## 🔍 Important Note: SendGrid vs Firebase Phone Auth

**Firebase Phone Auth uses Twilio (via Firebase) for SMS, NOT SendGrid.**
- **SendGrid** is an **email service** (for sending emails)
- **Firebase Phone Auth** uses **Twilio** (for sending SMS)
- These are different services for different purposes

If you want **email OTP**, you would use SendGrid. If you want **SMS/Phone OTP**, Firebase Phone Auth already handles this through Twilio.

## ✅ Prerequisites

Before setting up Firebase Phone Authentication, ensure:

1. ✅ Firebase project is created
2. ✅ Firebase Authentication is enabled
3. ✅ Firebase Blaze Plan (pay-as-you-go) is activated
   - **Required for production SMS sending**
   - Free tier only works with test phone numbers

## 📋 Step-by-Step Setup

### Step 1: Enable Phone Authentication in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **pacematch-gps**
3. Navigate to **Authentication** → **Sign-in method**
4. Click on **Phone** provider
5. Click **Enable** toggle
6. Click **Save**

### Step 2: Enable Billing (Required for Production)

Firebase Phone Auth requires the **Blaze Plan** (pay-as-you-go) to send SMS to real phone numbers:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to **Project Settings** → **Usage and billing**
3. Click **Upgrade project**
4. Select **Blaze Plan** (pay-as-you-go)
5. Complete the billing setup
6. **Wait 5-15 minutes** for billing changes to propagate

### Step 3: Configure Test Phone Numbers (Optional - Development Only)

For testing without billing:

1. Go to **Authentication** → **Settings** → **Phone numbers for testing**
2. Add test phone numbers with verification codes:
   - Phone: `+639123456789`
   - Code: `123456`
3. **Note**: In test mode, SMS will only work for numbers in this list
4. **To enable production**: Remove all test phone numbers

### Step 4: Verify Firebase Configuration

Your Firebase config should already be set in `src/services/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "AIzaSyBhEjBsdXq1GYbz9IDkzj2fULj-IrC-PE4",
  authDomain: "pacematch-gps.firebaseapp.com",
  projectId: "pacematch-gps",
  // ... other config
};
```

✅ **This is already configured in your project.**

### Step 5: Enable Phone Authentication in Code

Phone authentication is **already implemented** in your codebase:

- ✅ `sendPhoneVerificationCode()` - Sends SMS code
- ✅ `verifyPhoneCode()` - Verifies SMS code
- ✅ Phone login UI in `LoginScreen.tsx`

**The code is ready - you just need to enable it in Firebase Console.**

### Step 6: Configure Authorized Domains

1. Go to **Authentication** → **Settings** → **Authorized domains**
2. Ensure your domain is listed:
   - `localhost` (for development)
   - Your production domain
   - Custom domain (if applicable)

### Step 7: Test Phone Authentication

1. **Development Testing (Test Mode):**
   - Add your phone number to test numbers list
   - Use the test verification code
   - SMS won't actually be sent

2. **Production Testing:**
   - Remove all test phone numbers
   - Ensure billing is enabled
   - Use your real phone number
   - SMS will be sent to your phone

## 🔧 Troubleshooting

### Issue: "Billing not enabled" Error

**Solution:**
1. Verify Blaze Plan is active: **Usage and billing** → Check status
2. Wait 15-30 minutes after enabling billing (propagation delay)
3. Refresh Firebase Console and try again

### Issue: SMS Not Arriving

**Check:**
1. ✅ Is billing enabled? (Required for production)
2. ✅ Is Phone Auth enabled in Firebase Console?
3. ✅ Is your phone number in test list? (If yes, remove it for production)
4. ✅ Phone number format correct? (Must be `+63XXXXXXXXXX` for Philippines)
5. ✅ Wait 30 seconds - 2 minutes for SMS to arrive

### Issue: "Invalid app credentials" Error

**Solution:**
1. Check Firebase config matches your project
2. Verify `authDomain` is correct
3. Ensure Phone Auth is enabled in Firebase Console
4. Check authorized domains include your domain

### Issue: reCAPTCHA Not Loading

**Solution:**
1. Ensure Phone Auth is enabled in Firebase Console
2. Check browser console for errors
3. Clear browser cache and try again
4. Verify authorized domains are configured

## 📱 Phone Number Format

For Philippines, use format: `+63XXXXXXXXXX`

Examples:
- ✅ `+639123456789`
- ✅ `+639171234567`
- ❌ `09123456789` (missing country code)
- ❌ `639123456789` (missing +)

## 💰 Cost Information

Firebase Phone Auth Pricing:
- **Free tier**: Only works with test phone numbers
- **Blaze Plan**: Pay-as-you-go
  - SMS rates vary by country
  - Philippines: ~$0.05-$0.10 per SMS
  - Check [Firebase Pricing](https://firebase.google.com/pricing) for current rates

## ✅ Setup Checklist

- [ ] Phone Authentication enabled in Firebase Console
- [ ] Blaze Plan (billing) enabled
- [ ] Test phone numbers configured (development only)
- [ ] Authorized domains configured
- [ ] Phone login tested in app
- [ ] Production mode tested (real SMS)

## 🎯 Next Steps

1. **Enable Phone Auth in Firebase Console** (Steps 1-2)
2. **Wait for billing to propagate** (15-30 minutes)
3. **Test phone login** in your app
4. **Make phone login prominent** as backup option

## 📚 Additional Resources

- [Firebase Phone Auth Documentation](https://firebase.google.com/docs/auth/web/phone-auth)
- [Firebase Billing Guide](https://firebase.google.com/pricing)
- [Twilio SMS Rates](https://www.twilio.com/sms/pricing) (Firebase uses Twilio)

---

**Note**: The code for phone authentication is already implemented in your app. You just need to enable it in Firebase Console and configure billing for production use.

