# 🔍 Quick Debug Steps for Google Sign-In Error

## Step 1: Check Chrome DevTools (EASIEST - Shows JavaScript logs)

1. **Connect your device via USB** (or use emulator)
2. **Open Chrome** on your computer
3. **Go to:** `chrome://inspect`
4. **Find "WebView in com.pacematch.app"** in the list
5. **Click "inspect"** next to it
6. **Click the Console tab**
7. **Click "Sign in with Google"** in the app
8. **Look for these messages:**

You should see:
```
📱 Capacitor native app detected - using native Google Sign-In
🔄 Initializing Google Auth plugin...
✅ Google Auth plugin initialized successfully
🔄 Calling GoogleAuth.signIn()...
```

**If you see an error after that, copy the full error message!**

---

## Step 2: Verify Android OAuth Client ID (MOST COMMON ISSUE)

**90% of errors are because this isn't configured!**

1. Go to: https://console.cloud.google.com/apis/credentials?project=pacematch-gps
2. **Check if you have an Android OAuth Client ID**
   - Look for type: "Android application"
   - Package name: `com.pacematch.app`
   - SHA-1: `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`

**If it doesn't exist:**
1. Click **"Create Credentials"** → **"OAuth client ID"**
2. Select **Application type: Android**
3. Enter:
   - **Name:** `PaceMatch Android`
   - **Package name:** `com.pacematch.app`
   - **SHA-1 certificate fingerprint:** `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`
4. Click **"Create"**
5. **Wait 5-10 minutes** for Google to propagate the change
6. **Rebuild and test again**

---

## Step 3: Check Logcat (If Chrome DevTools doesn't work)

In Android Studio Logcat:

1. **Clear any filters**
2. **Select log level: "Debug" or "Verbose"**
3. **In search box, try these filters:**

   Filter 1:
   ```
   chromium
   ```

   Filter 2:
   ```
   console
   ```

   Filter 3:
   ```
   📱|🔄|❌|✅
   ```

4. **Click "Sign in with Google"** in the app
5. **Look for our console.log messages**

---

## Common Error Messages & Fixes

### "INVALID_CLIENT" or "OAuth client not found"
**Fix:** Android OAuth Client ID not created or wrong package name/SHA-1

### "Sign-in cancelled" (happens immediately)
**Fix:** Android OAuth Client ID not configured correctly

### "Plugin not initialized"
**Fix:** Rebuild the app after `npx cap sync android`

### "No credentials found"
**Fix:** Check `serverClientId` in `capacitor.config.ts` is correct

---

## What to Share

After trying the above, share:

1. **Error message from Chrome DevTools Console** (preferred)
2. **OR Logcat error** (if Chrome DevTools doesn't work)
3. **Screenshot** of your OAuth Client IDs in Google Cloud Console

---

**Start with Step 1 (Chrome DevTools) - it's the easiest!** 🎯

