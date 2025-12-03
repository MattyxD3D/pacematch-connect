# 📧 SendGrid Email OTP Setup Guide

## Overview

This guide sets up **email-based OTP (One-Time Password)** authentication using SendGrid as a backup login method. This is simpler than Firebase Phone Auth and doesn't require billing setup.

## Why SendGrid Email OTP?

- ✅ **No billing required** (free tier: 100 emails/day)
- ✅ **Simple setup** - just API key
- ✅ **No Firebase Phone Auth issues** - completely separate service
- ✅ **Works immediately** - no waiting for billing propagation
- ✅ **Email-based** - users receive code via email

## Prerequisites

1. SendGrid account (free tier available)
2. SendGrid API key
3. Verified sender email address in SendGrid

---

## Step 1: Create SendGrid Account

1. Go to [SendGrid](https://sendgrid.com/)
2. Click **"Start for Free"**
3. Sign up with your email
4. Verify your email address
5. Complete account setup

**Free Tier:**
- ✅ 100 emails/day forever
- ✅ Perfect for development and testing

---

## Step 2: Create API Key

1. Log in to [SendGrid Dashboard](https://app.sendgrid.com/)
2. Go to **Settings** → **API Keys**
3. Click **"Create API Key"**
4. Name it: `PaceMatch Email OTP`
5. **Important:** Select **"Restricted Access"**
6. Under **Mail Send**, select **"Full Access"** (or just "Mail Send" permissions)
7. Click **"Create & View"**
8. **Copy the API key immediately** (you won't be able to see it again!)

**Example API Key format:**
```
SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Step 3: Verify Sender Email Address

1. In SendGrid Dashboard, go to **Settings** → **Sender Authentication**
2. Click **"Verify a Single Sender"**
3. Fill in the form:
   - **From Email Address:** `noreply@yourdomain.com` (or your email)
   - **From Name:** `PaceMatch`
   - **Reply To:** Your email
   - **Company Address:** Your address
   - **City, State, Zip:** Your location
   - **Country:** Your country
4. Click **"Create"**
5. **Check your email** and click the verification link
6. Status should change to **"Verified"**

**Note:** For production, you'll want to set up Domain Authentication, but single sender is fine for development.

---

## Step 4: Add SendGrid API Key to Your App

### Option A: Environment Variable (Recommended)

1. Create/update `.env` file in `pacematch-connect/` directory:
```bash
VITE_SENDGRID_API_KEY=SG.your_actual_api_key_here
VITE_SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

2. **Important:** Add `.env` to `.gitignore` (never commit API keys!)

### Option B: Configuration File (Alternative)

If environment variables don't work, we can create a config file (see below).

---

## Step 5: Install SendGrid Package

Run this command in your `pacematch-connect` directory:

```bash
npm install @sendgrid/mail
```

---

## Step 6: Update Email Verification Function

The code has been updated to use SendGrid. The `sendEmailVerificationCode` function will now:
1. Generate 6-digit code
2. Store code in Firebase
3. **Send email via SendGrid** with the code
4. Return success (no code returned - check email!)

---

## Step 7: Test Email OTP

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Go to login page** → Click "Create Account"
3. **Enter name and email**
4. **Click "Send Verification Code"**
5. **Check your email inbox** for the code
6. **Enter code** to verify
7. **Set password** to complete signup

---

## Troubleshooting

### Email Not Arriving?

1. **Check spam/junk folder**
2. **Verify sender email is verified** in SendGrid
3. **Check SendGrid Activity Feed:**
   - Go to SendGrid Dashboard → **Activity**
   - Look for your email send attempt
   - Check for errors

### "Unauthorized" Error?

- ✅ Check API key is correct
- ✅ Check API key has "Mail Send" permissions
- ✅ Check environment variable is loaded (restart dev server)

### "From address not verified" Error?

- ✅ Verify sender email in SendGrid
- ✅ Check email matches exactly (case-sensitive)

### API Key Not Loading?

- ✅ Restart dev server after adding `.env`
- ✅ Check variable name: `VITE_SENDGRID_API_KEY`
- ✅ Check file is named exactly `.env` (not `.env.local`)

---

## Production Considerations

### For Production:

1. **Domain Authentication (Recommended):**
   - Set up domain authentication in SendGrid
   - Better email deliverability
   - Professional sender reputation

2. **Backend Endpoint (More Secure):**
   - Move SendGrid API calls to backend
   - Keep API key secure on server
   - Use Firebase Cloud Functions or Express server

3. **Rate Limiting:**
   - Free tier: 100 emails/day
   - Paid tier: Based on plan
   - Implement rate limiting in code

---

## Cost

- **Free Tier:** 100 emails/day forever
- **Paid Plans:** Start at $15/month for 40,000 emails
- **No credit card required** for free tier

---

## Next Steps

1. ✅ Complete Steps 1-5 (SendGrid setup)
2. ✅ Test email sending
3. ✅ Update email verification code
4. ✅ Test complete signup flow

---

## Summary

SendGrid Email OTP is now set up as a backup authentication method. Users can:
- Sign up with email + OTP code
- No Firebase Phone Auth billing needed
- Simple and reliable email delivery

**Ready to use once you add your SendGrid API key!**

