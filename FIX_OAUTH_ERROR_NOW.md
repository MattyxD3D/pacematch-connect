# 🔧 Fix OAuth Error - Complete Troubleshooting Guide

## ✅ Your Configuration (Verified)

- **Package Name:** `com.pacematch.app` ✅
- **Debug SHA-1:** `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD` ✅
- **Server Client ID:** `891545961086-cs7aq62rgshps172c95ijdcnh2lsej5r.apps.googleusercontent.com` ✅

---

## 🔍 Step 1: VERIFY Android OAuth Client ID Exists

**Go to:** https://console.cloud.google.com/apis/credentials?project=pacematch-gps

### What to Look For:

1. **Scroll through all OAuth Client IDs**
2. **Look for ONE with:**
   - Application type: **Android** (NOT Web!)
   - Package name: `com.pacematch.app`
   - SHA-1: `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`

### ❌ If You DON'T See It:

**CREATE IT NOW:**

1. Click **"Create Credentials"** (top of page)
2. Select **"OAuth client ID"**
3. If prompted about "Configure consent screen":
   - Click **"Configure consent screen"**
   - User Type: **External**
   - App name: **PaceMatch**
   - User support email: **Your email**
   - Developer contact: **Your email**
   - Click **"Save and Continue"** (twice) → **"Back to Dashboard"**
   - Then click **"Create Credentials"** → **"OAuth client ID"** again

4. **Application type:** Select **"Android"** ⚠️ (NOT Web!)
5. **Fill in EXACTLY:**
   - **Name:** `PaceMatch Android Debug`
   - **Package name:** `com.pacematch.app` (copy/paste this exactly)
   - **SHA-1 certificate fingerprint:** `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD` (copy/paste this exactly)
6. Click **"Create"**

**⚠️ IMPORTANT:** Wait **10-15 minutes** before testing!

---

### ✅ If You DO See It - Check for Typos:

**Click on the Android OAuth Client ID** to edit/view details.

**Check these EXACTLY:**

1. **Package name:**
   - ✅ Must be: `com.pacematch.app` (all lowercase, no spaces)
   - ❌ Wrong: `com.pacematch` (missing `.app`)
   - ❌ Wrong: `Com.pacematch.app` (capital C)
   - ❌ Wrong: `com.pacematch.app ` (extra space at end)

2. **SHA-1:**
   - ✅ Must be: `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`
   - Check for:
     - All uppercase letters (C, B, A, etc.)
     - All 19 colons (:) present
     - No extra spaces
     - No line breaks

**If there's ANY typo:**
- Click **"Edit"** (or delete and recreate)
- Fix the typo
- Click **"Save"**
- Wait 10-15 minutes

---

## 🔄 Step 2: Complete App Reset

After verifying/creating the OAuth Client ID, do a COMPLETE reset:

### A. Uninstall App from Device/Emulator

**Option 1: From Android Studio**
1. Connect device/emulator
2. In Android Studio: **Run** → **Uninstall app**
3. Or select device and click trash icon

**Option 2: From Terminal**
```bash
adb uninstall com.pacematch.app
```

**Option 3: From Device**
1. Settings → Apps → PaceMatch → Uninstall

### B. Clean Build

```bash
cd /Applications/q/pacematch-connect
npm run build
npx cap sync android
```

### C. In Android Studio

1. **File** → **Invalidate Caches...**
   - Check "Invalidate and Restart"
   - Click "Invalidate and Restart"
   - Wait for Android Studio to restart

2. After restart:
   - **Build** → **Clean Project**
   - Wait for clean to finish
   - **Build** → **Rebuild Project**
   - Wait for rebuild to finish

### D. Reinstall and Test

1. Select your device/emulator
2. Click **Run ▶️**
3. Wait for app to install and launch
4. **Wait 1-2 minutes** (for Google services to initialize)
5. Try Google Sign-In

---

## ⏰ Step 3: Timing is Critical!

### Important Wait Times:

1. **After creating OAuth Client ID:** Wait **10-15 minutes**
2. **After editing OAuth Client ID:** Wait **10-15 minutes**
3. **After uninstalling/reinstalling app:** Wait **1-2 minutes** before testing

### Why Wait?

- Google's servers need time to propagate OAuth Client ID changes
- The app needs time to initialize Google Sign-In services
- Testing too soon will show the same error even if config is correct

---

## 🎯 Quick Verification Checklist

Before testing, verify:

- [ ] Android OAuth Client ID exists in Google Cloud Console
- [ ] Application type is **"Android"** (NOT Web)
- [ ] Package name is EXACTLY: `com.pacematch.app` (no typos)
- [ ] SHA-1 is EXACTLY: `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD` (no typos)
- [ ] Waited **10-15 minutes** after creating/editing
- [ ] Uninstalled old app from device
- [ ] Ran `npm run build && npx cap sync android`
- [ ] Cleaned and rebuilt project in Android Studio
- [ ] Reinstalled app
- [ ] Waited 1-2 minutes after app launch before testing

---

## 🚨 Still Not Working?

### Check Logcat for Exact Error

In Android Studio:

1. Open **Logcat** tab (bottom panel)
2. Filter by: `pacematch` or `google` or `auth`
3. Click "Sign in with Google" in the app
4. Look for error messages
5. Share the **exact error code** and message

### Common Issues:

**Error Code 10 (DEVELOPER_ERROR):**
- OAuth Client ID doesn't exist OR
- Package name/SHA-1 mismatch OR
- Not propagated yet (wait longer)

**Error Code 7 (NETWORK_ERROR):**
- Internet connection issue
- Check device has internet

**Error Code 12500 (SIGN_IN_CANCELLED):**
- User cancelled (not an error)
- Try again

---

## 📝 Summary

**The Most Common Mistakes:**

1. ❌ Creating "Web application" instead of "Android application"
2. ❌ Typo in package name (capital C, missing `.app`, extra space)
3. ❌ Typo in SHA-1 (missing colon, wrong case, extra space)
4. ❌ Testing immediately (not waiting 10-15 minutes)
5. ❌ Not uninstalling old app (cached credentials)

**Follow These Steps:**

1. Verify Android OAuth Client ID exists with correct values
2. Wait 10-15 minutes after creating/editing
3. Uninstall old app completely
4. Clean and rebuild
5. Reinstall app
6. Wait 1-2 minutes, then test

**If still not working, check Logcat for exact error code!** 🔍
