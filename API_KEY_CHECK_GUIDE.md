# API Key Restrictions Check - Phone Authentication Fix

## Quick Check Before Removing Phone Auth

The `400` error from `identitytoolkit.googleapis.com` might be caused by **API key restrictions** in Google Cloud Console, not Firebase issues.

## Check API Key Restrictions

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Select your project**: `pacematch-gps`
3. **Navigate to**: APIs & Services → Credentials
4. **Find your API key**: `AIzaSyBhEjBsdXq1GYbz9IDkzj2fULj-IrC-PE4`
5. **Click on the API key** to edit it
6. **Check "API restrictions"**:
   - If set to "Restrict key", make sure these APIs are enabled:
     - ✅ Identity Toolkit API
     - ✅ Firebase Authentication API
   - If they're not listed, **click "Edit API restrictions"** and add them
7. **Check "Application restrictions"**:
   - If set to "HTTP referrers", make sure `localhost` is in the allowed list
   - Or temporarily set to "None" to test if that's the issue

## Enable Required APIs

Make sure these APIs are enabled in your project:

1. Go to: APIs & Services → Library
2. Search and enable:
   - ✅ **Identity Toolkit API** (required for phone auth)
   - ✅ **Firebase Authentication API**
   - ✅ **Firebase Realtime Database API** (you probably already have this)

## After Making Changes

1. **Save** the API key changes
2. **Wait 1-2 minutes** for changes to propagate
3. **Hard refresh** your browser: `Cmd+Shift+R` or `Ctrl+Shift+R`
4. **Try phone authentication again**

---

**If this doesn't work**, then we can consider other options (see main response).




