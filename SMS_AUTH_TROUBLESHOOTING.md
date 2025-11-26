# SMS Authentication Troubleshooting Guide

## Overview
This guide helps you diagnose and fix SMS authentication issues with Firebase Phone Authentication.

## Common Issues and Solutions

### 1. "Authentication error. Please refresh the page and try again."

This error usually means one of the following:

#### ✅ **Check 1: Enable Phone Authentication in Firebase Console**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **pacematch-gps**
3. Navigate to **Authentication** > **Sign-in method**
4. Find **Phone** in the list
5. Click on it and make sure it's **Enabled**
6. Click **Save**

**Important:** If Phone Authentication is not enabled, SMS verification will fail with authentication errors.

#### ✅ **Check 2: Authorized Domains**

1. In Firebase Console, go to **Authentication** > **Settings** > **Authorized domains**
2. Make sure your domain is listed:
   - `localhost` (for local development)
   - Your production domain (e.g., `yourdomain.com`)
   - Firebase hosting domain (automatically added)

3. To add a domain:
   - Click **Add domain**
   - Enter your domain
   - Click **Add**

#### ✅ **Check 3: reCAPTCHA Configuration**

Firebase automatically sets up reCAPTCHA for Phone Authentication. However, you should verify:

1. Go to **Authentication** > **Settings** > **reCAPTCHA**
2. Make sure reCAPTCHA is configured (it should be automatic)
3. If you see any errors here, contact Firebase support

#### ✅ **Check 4: Firebase Project Configuration**

Verify your Firebase config in `src/services/firebase.ts` matches your Firebase Console:

- **Project ID**: `pacematch-gps`
- **API Key**: Should match your Firebase Console
- **Auth Domain**: `pacematch-gps.firebaseapp.com`

### 2. "reCAPTCHA initialization failed" or CSP (Content Security Policy) violations

**Common Error:**
```
Loading the script 'https://www.google.com/recaptcha/api.js' violates the following Content Security Policy directive
```

**Solution:**
1. **Restart your dev server** - CSP changes require a server restart
   ```bash
   # Stop the server (Ctrl+C), then:
   npm run dev
   ```
2. Refresh the page completely (hard refresh: Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
3. Check browser console for detailed error messages
4. Ensure you're not blocking reCAPTCHA with ad blockers
5. Try in an incognito/private window

**Note:** The CSP has been configured to allow reCAPTCHA. If you still see CSP errors, make sure:
- The dev server has been restarted after the CSP update
- You're not using cached HTML files
- Browser cache is cleared

### 3. "Phone authentication is not enabled"

**Solution:**
- Follow **Check 1** above to enable Phone Authentication

### 4. "SMS quota exceeded"

**Solution:**
- Firebase free tier has SMS limits
- Wait a few minutes and try again
- Consider upgrading Firebase plan if you need more SMS quota

### 5. "Invalid phone number"

**Solution:**
- Phone number must be in E.164 format: `+[country code][number]`
- Example: `+631234567890` (Philippines)
- Do not use spaces or special characters except the leading `+`

## Testing SMS Authentication

### Step-by-Step Test

1. **Open the app** and navigate to the login screen
2. **Select Phone login** method
3. **Enter phone number** (e.g., `09123456789` or `9123456789`)
4. **Click "Send Verification Code"**
5. **Check browser console** for detailed logs:
   - Look for: `📱 Sending SMS verification code to: +63...`
   - Look for: `✅ SMS code sent successfully`
   - Or error messages with codes like `auth/internal-error`

### Browser Console Logs

Open browser DevTools (F12) and check the Console tab. You should see:

```
📱 Sending SMS verification code to: +631234567890
✅ reCAPTCHA verifier created successfully
✅ SMS code sent successfully
```

If you see errors, check the error code:
- `auth/operation-not-allowed` → Phone Auth not enabled
- `auth/invalid-phone-number` → Wrong phone format
- `auth/internal-error` → Check Firebase Console configuration
- `auth/captcha-check-failed` → reCAPTCHA issue

## Quick Checklist

Before testing, verify:

- [ ] Phone Authentication is **Enabled** in Firebase Console
- [ ] Your domain is in **Authorized domains**
- [ ] Firebase config in code matches Firebase Console
- [ ] You're using correct phone number format (`+63XXXXXXXXXX`)
- [ ] Browser console is open to see error details
- [ ] You're not blocking reCAPTCHA with ad blockers

## Still Having Issues?

1. **Check browser console** for the exact error code and message
2. **Copy the error details** from the console
3. **Verify Firebase Console** settings match the checklist above
4. **Try in incognito mode** to rule out browser extensions
5. **Check Firebase Console > Usage** to see if SMS quota is available

## Firebase Console Links

- **Authentication**: https://console.firebase.google.com/project/pacematch-gps/authentication
- **Settings**: https://console.firebase.google.com/project/pacematch-gps/authentication/settings
- **Sign-in methods**: https://console.firebase.google.com/project/pacematch-gps/authentication/providers

---

**Note:** SMS verification requires:
1. Phone Authentication enabled in Firebase
2. Valid reCAPTCHA configuration (automatic)
3. Authorized domain configuration
4. Sufficient SMS quota (free tier has limits)

