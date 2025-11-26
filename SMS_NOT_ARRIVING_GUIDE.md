# SMS Code Not Arriving - Troubleshooting Guide

## Overview
If you see "✅ SMS code sent successfully" but don't receive the SMS, this guide will help you diagnose and fix the issue.

## Quick Diagnosis Checklist

### ✅ Step 1: Check Browser Console

Open Browser DevTools (F12) → Console tab and look for:

1. **Success message:**
   ```
   ✅ SMS code sent successfully
   ✅ Verification ID received - SMS should be on its way!
   ```

2. **If you see errors:**
   - `auth/quota-exceeded` → SMS quota limit reached
   - `auth/invalid-phone-number` → Phone number format issue
   - `auth/too-many-requests` → Too many SMS requests

### ✅ Step 2: Firebase Phone Authentication Test Mode

**IMPORTANT:** Firebase has a **test mode** for Phone Authentication that only sends SMS to whitelisted phone numbers!

1. Go to [Firebase Console](https://console.firebase.google.com/project/pacematch-gps/authentication)
2. Click on **Authentication** → **Settings** → **Phone numbers for testing**
3. **Add your phone number** to the test list:
   - Click **Add phone number**
   - Enter your phone number in E.164 format: `+631234567890`
   - Optionally add a test verification code (e.g., `123456`)
   - Click **Add**

**Note:** In test mode, if you provide a test code, Firebase will use that code instead of sending a real SMS. If you don't provide a test code, Firebase will send a real SMS but only to numbers in this list.

### ✅ Step 3: Check Firebase SMS Quota

1. Go to [Firebase Console](https://console.firebase.google.com/project/pacematch-gps/usage)
2. Check **Authentication** usage
3. Look for SMS quota limits

**Free Tier Limits:**
- Limited number of SMS per day
- If quota exceeded, you'll need to wait or upgrade

**Check Usage:**
- Firebase Console → Usage & Billing → Authentication
- See how many SMS have been sent today

### ✅ Step 4: Verify Phone Number Format

Make sure the phone number is in **E.164 format**:
- ✅ Correct: `+631234567890` (Philippines: +63 followed by 10 digits)
- ❌ Wrong: `09123456789` (missing country code)
- ❌ Wrong: `+63 912 345 6789` (has spaces)
- ❌ Wrong: `9123456789` (missing + and country code)

### ✅ Step 5: Check Firebase Billing

Firebase Phone Authentication requires:
- **Billing enabled** (even on free tier, you need to add a payment method)
- Or be in **test mode** with whitelisted numbers

**To check:**
1. Go to [Firebase Console](https://console.firebase.google.com/project/pacematch-gps/usage)
2. Check if billing is enabled
3. If not, you'll need to enable it or use test mode

### ✅ Step 6: Wait Time

SMS delivery can take:
- **30 seconds to 2 minutes** normally
- **Up to 5 minutes** in some cases
- Sometimes carrier delays can be longer

**If you clicked "Send Code" multiple times:**
- Only the **most recent code** will work
- Older codes expire after 10 minutes

### ✅ Step 7: Carrier Issues

Sometimes carriers block or delay SMS:
- Try a different phone number if possible
- Check if your carrier blocks short codes or automated messages
- Try from a different carrier/network

## Common Solutions

### Solution 1: Add Phone Number to Test List (Recommended for Development)

1. Firebase Console → Authentication → Settings → **Phone numbers for testing**
2. Add your phone: `+631234567890`
3. Add test code (optional): `123456`
4. Try sending SMS again

**With test code:** You can use the test code you specified instead of waiting for SMS
**Without test code:** Firebase will send a real SMS only to whitelisted numbers

### Solution 2: Enable Billing (For Production)

1. Firebase Console → Usage & Billing
2. Enable billing (requires payment method)
3. This allows unlimited SMS (within quotas)

### Solution 3: Check Phone Number Format

Verify your phone number format in the browser console:
- Look for: `📱 Phone number format check:`
- Should show: `startsWithPlus: true`, `length: 13` (for +63 + 10 digits)

### Solution 4: Use Test Code Mode

If you added a test code in Firebase Console:
- Enter that test code directly (e.g., `123456`)
- You don't need to wait for SMS

## Diagnostic Steps

### 1. Check Console Logs

After clicking "Send Verification Code", you should see:

```
📱 Sending SMS verification code to: +631234567890
📱 Phone number format check: { startsWithPlus: true, length: 13, formatted: "+631234567890" }
✅ reCAPTCHA verifier created successfully
✅ SMS code sent successfully
✅ Confirmation result: { verificationId: "Present" }
✅ Verification ID received - SMS should be on its way!
```

### 2. Check Firebase Console

1. Go to Firebase Console → Authentication → Users
2. Check if a temporary user was created (this confirms SMS was sent)
3. Go to Authentication → Settings → Phone numbers for testing
4. Verify your number is added (if using test mode)

### 3. Check Network Tab

1. Open Browser DevTools → Network tab
2. Filter by "identitytoolkit" or "firebase"
3. Look for successful API calls
4. Check response status (should be 200)

## Still Not Working?

### Option 1: Use Email Authentication Instead

If SMS continues to have issues, you can use email/password authentication as a temporary workaround.

### Option 2: Check Firebase Console Errors

1. Firebase Console → Authentication → Settings
2. Look for any error messages or warnings
3. Check reCAPTCHA configuration

### Option 3: Contact Firebase Support

If none of the above works:
1. Check [Firebase Status Page](https://status.firebase.google.com/)
2. Contact Firebase Support
3. Provide:
   - Project ID: `pacematch-gps`
   - Phone number format used
   - Error messages from console
   - Screenshots of Firebase Console settings

## Firebase Console Links

- **Phone numbers for testing**: https://console.firebase.google.com/project/pacematch-gps/authentication/settings/phone
- **Authentication settings**: https://console.firebase.google.com/project/pacematch-gps/authentication/settings
- **Usage & Billing**: https://console.firebase.google.com/project/pacematch-gps/usage
- **Authentication users**: https://console.firebase.google.com/project/pacematch-gps/authentication/users

---

## Summary

Most common reasons SMS doesn't arrive:

1. **Test mode** - Phone number not in whitelist (90% of cases)
2. **SMS quota exceeded** - Free tier limits reached
3. **Billing not enabled** - Required for production SMS
4. **Wrong phone format** - Not in E.164 format
5. **Carrier delay** - SMS can take 1-5 minutes

**Quick Fix:** Add your phone number to "Phone numbers for testing" in Firebase Console!

