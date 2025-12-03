# 🔧 Fix: Android OAuth Client ID Configuration Error

## The Error You're Seeing

```
❌ Configuration error: Check that Android OAuth Client ID is created in Google Cloud Console 
   with correct package name (com.pacematch.app) and SHA-1 fingerprint.
```

**This means:** The Android OAuth Client ID is **NOT configured** in Google Cloud Console.

---

## ✅ Step-by-Step Fix

### Step 1: Go to Google Cloud Console

**URL:** https://console.cloud.google.com/apis/credentials?project=pacematch-gps

### Step 2: Check if Android OAuth Client ID Exists

Look for an OAuth Client ID with:
- **Application type:** Android
- **Package name:** `com.pacematch.app`
- **SHA-1:** `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`

**If you DON'T see it, continue to Step 3.**

### Step 3: Create Android OAuth Client ID

1. Click **"Create Credentials"** button (top of page)
2. Select **"OAuth client ID"**
3. If you see a prompt about "Configure consent screen":
   - Click **"Configure consent screen"**
   - Select **"External"** (unless you have Google Workspace)
   - Fill in:
     - **App name:** `PaceMatch`
     - **User support email:** Your email
     - **Developer contact:** Your email
   - Click **"Save and Continue"** → **"Save and Continue"** → **"Back to Dashboard"**
   - Now go back to **"Create Credentials"** → **"OAuth client ID"**

4. Select **Application type:** **Android** ⚠️ (NOT Web!)

5. Fill in:
   - **Name:** `PaceMatch Android` (or any name you want)
   - **Package name:** `com.pacematch.app` ⚠️ **MUST BE EXACTLY THIS**
   - **SHA-1 certificate fingerprint:** `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD` ⚠️ **MUST BE EXACTLY THIS**

6. Click **"Create"**

### Step 4: Wait for Propagation ⏰

**IMPORTANT:** Google needs 5-10 minutes to propagate the new OAuth Client ID.

**Don't test immediately!** Wait at least 5-10 minutes.

### Step 5: Rebuild Your App

After waiting, rebuild your app:

```bash
cd /Applications/q/pacematch-connect
npm run build
npx cap sync android
```

Then in Android Studio:
1. **Build** → **Rebuild Project**
2. Run the app again
3. Test Google Sign-In

---

## ✅ Verification Checklist

After creating the Android OAuth Client ID, verify:

- [ ] Android OAuth Client ID exists in Google Cloud Console
- [ ] Application type is **"Android"** (NOT "Web")
- [ ] Package name is exactly: `com.pacematch.app` (lowercase, no spaces)
- [ ] SHA-1 is exactly: `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`
- [ ] Waited 5-10 minutes after creating
- [ ] Ran `npm run build && npx cap sync android`
- [ ] Rebuilt in Android Studio
- [ ] Tested Google Sign-In

---

## 🎯 What You Should Have

You need **TWO** OAuth Client IDs:

1. ✅ **Web application** (for `serverClientId` in capacitor.config.ts)
   - Client ID: `891545961086-cs7aq62rgshps172c95ijdcnh2lsej5r.apps.googleusercontent.com`

2. ⚠️ **Android application** (for native Google Sign-In) ← **THIS IS WHAT'S MISSING**
   - Package name: `com.pacematch.app`
   - SHA-1: `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`

---

## 🚨 Common Mistakes

### ❌ Wrong Application Type
- **Wrong:** Creating a "Web application" OAuth Client ID
- **Correct:** Must be "Android application"

### ❌ Package Name Typo
- **Wrong:** `com.pacematch` (missing `.app`)
- **Wrong:** `Com.pacematch.app` (capital C)
- **Wrong:** `com.pacematch.app ` (extra space)
- **Correct:** `com.pacematch.app` (exact match)

### ❌ SHA-1 Typo
- **Wrong:** Missing a colon `:`
- **Wrong:** Extra space
- **Wrong:** Wrong letter case (if you entered lowercase, it must stay lowercase)
- **Correct:** `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`

### ❌ Testing Too Soon
- **Wrong:** Testing immediately after creating
- **Correct:** Wait 5-10 minutes for Google to propagate

---

## 📝 Summary

**The Problem:**
- Android OAuth Client ID is not configured in Google Cloud Console

**The Solution:**
1. Create Android OAuth Client ID in Google Cloud Console
2. Use exact package name: `com.pacematch.app`
3. Use exact SHA-1: `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`
4. Wait 5-10 minutes
5. Rebuild app
6. Test!

**After this, Google Sign-In should work!** 🎉

