# Invalid App Credentials Error - Troubleshooting Guide

## What This Error Means

The `auth/invalid-app-credential` error occurs when Firebase cannot verify your app's credentials during phone authentication. This is typically a configuration or billing issue.

## Quick Fix Checklist

Follow these steps **in order**:

### Step 1: Wait for Billing Activation (5-15 minutes)

If you just enabled billing or upgraded to the Blaze plan:
- ⏱️ **Wait 5-15 minutes** for changes to propagate across Firebase servers
- 🔄 **Refresh the page** after waiting
- 🔄 **Try again** - the error may resolve automatically

### Step 2: Verify Phone Authentication is Enabled

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **pacematch-gps**
3. Navigate to **Authentication** → **Sign-in method**
4. Find **Phone** in the provider list
5. Click on **Phone** to open settings
6. Ensure it shows **Enabled** (toggle should be ON)
7. If disabled, click **Enable** and then **Save**

**Important:** Phone Authentication MUST be enabled for SMS verification to work.

### Step 3: Verify Firebase Configuration Matches Project

Check that your Firebase config in code matches Firebase Console:

1. Go to Firebase Console → **Project Settings** (gear icon ⚙️)
2. Scroll down to **Your apps** section
3. Find your web app (should have app ID: `1:891545961086:web:9842aed06947710b5d0e2f`)
4. Click on **Config** to see your Firebase config
5. Compare with your code in `src/services/firebase.ts`:

**Expected Config:**
- **Project ID**: `pacematch-gps`
- **Auth Domain**: `pacematch-gps.firebaseapp.com`
- **API Key**: Should match Firebase Console
- **App ID**: `1:891545961086:web:9842aed06947710b5d0e2f`

If any values don't match, update your code to match Firebase Console.

### Step 4: Verify Billing is Enabled (Blaze Plan)

Phone Authentication in production requires the Blaze (pay-as-you-go) plan:

1. Go to Firebase Console → **Usage and billing** (gear icon ⚙️)
2. Verify billing is enabled
3. Check that you're on the **Blaze plan** (not Spark/free tier)
4. If billing is not enabled:
   - Click **Modify plan**
   - Select **Blaze plan**
   - Add a payment method
   - Wait 5-15 minutes for activation

**Note:** Spark (free) plan only supports test phone numbers. Production mode requires Blaze.

### Step 5: Check Authorized Domains

Ensure your domain is authorized for Firebase Auth:

1. Go to Firebase Console → **Authentication** → **Settings**
2. Scroll to **Authorized domains** section
3. Verify these domains are listed:
   - `localhost` (for local development)
   - Your production domain (if deployed)
   - Firebase hosting domain (automatically added)

4. If `localhost` is missing:
   - Click **Add domain**
   - Enter `localhost`
   - Click **Add**

### Step 6: Remove Test Phone Numbers (For Production Mode)

If you want to send SMS to any phone number (production mode):

1. Go to Firebase Console → **Authentication** → **Settings**
2. Scroll to **Phone numbers for testing** section
3. **Remove ALL test phone numbers** from the list
4. **Save** the changes

**Important:** Production mode only activates when the test numbers list is **empty** AND billing is enabled.

### Step 7: Verify App Configuration in Firebase Console

1. Go to Firebase Console → **Project Settings**
2. Check for any **warnings** or **errors** displayed
3. Look for app-specific issues in the **Your apps** section
4. Verify the app is properly registered and active

## Advanced Troubleshooting

### Check Browser Console for Detailed Errors

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Look for Firebase-related errors
4. Check for any configuration warnings

The app now automatically validates Firebase configuration and logs diagnostic information when this error occurs.

### Verify reCAPTCHA Setup

Firebase Phone Auth uses reCAPTCHA. It should be automatically configured, but you can verify:

1. Go to Firebase Console → **Authentication** → **Settings**
2. Scroll to **reCAPTCHA** section
3. Verify it shows as configured (should be automatic)

### Clear Browser Cache and Cookies

Sometimes cached data can cause issues:

1. Clear browser cache and cookies
2. Refresh the page
3. Try again

### Check Network/Firewall Issues

- Ensure you can access `firebase.google.com`
- Check if corporate firewall is blocking Firebase requests
- Try from a different network if possible

## Still Not Working?

If the error persists after following all steps:

1. **Double-check all steps** - especially Steps 2, 3, and 4
2. **Wait longer** - billing activation can take up to 15 minutes
3. **Check Firebase Console** for any red error messages or warnings
4. **Verify your app ID** matches exactly between code and Firebase Console
5. **Try a different browser** to rule out browser-specific issues
6. **Check Firebase Status Page** - [status.firebase.google.com](https://status.firebase.google.com/) for service issues

## Common Causes Summary

| Cause | Solution |
|-------|----------|
| Billing not activated | Enable Blaze plan, wait 5-15 min |
| Phone Auth disabled | Enable in Firebase Console |
| Config mismatch | Update code to match Firebase Console |
| Test mode active | Remove test phone numbers |
| Domain not authorized | Add domain to authorized list |
| Recent billing change | Wait for propagation (5-15 min) |

## Validation Function

The app includes an automatic validation function that runs when this error occurs. Check the browser console for diagnostic output that shows:
- Firebase configuration status
- Missing required fields
- Configuration mismatches
- Warnings about settings

---

**Need More Help?**
- Check `SMS_AUTH_TROUBLESHOOTING.md` for general SMS issues
- Check `PHONE_AUTH_PRODUCTION_SETUP.md` for production setup
- Review Firebase Console for specific error messages
