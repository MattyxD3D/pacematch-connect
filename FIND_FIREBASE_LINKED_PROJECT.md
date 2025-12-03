# 🔍 Find the Correct Google Cloud Project Linked to Firebase

## Your Firebase Project

- **Firebase Project ID:** `pacematch-gps`
- **Firebase Project Number:** `891545961086`

**The Google Cloud project linked to Firebase MUST have:**
- ✅ Project Number: `891545961086`
- ✅ Project ID: `pacematch-gps` (usually)

---

## ✅ Method 1: Check from Firebase Console (Easiest)

### Step 1: Go to Firebase Console

**URL:** https://console.firebase.google.com/project/pacematch-gps/settings/general

### Step 2: Find Linked Google Cloud Project

1. **Scroll down to "Project resources" section**
2. **Look for:** "Google Cloud project" or "Project settings"
3. **You should see:**
   - Project ID: `pacematch-gps`
   - Project Number: `891545961086`
4. **Click:** "View in Google Cloud Console" or the link
5. **This takes you to the CORRECT project!**

---

## ✅ Method 2: Check Project Number in Google Cloud Console

### Step 1: Go to Google Cloud Console

**URL:** https://console.cloud.google.com/

### Step 2: Check Each Project

**For each project in the dropdown:**

1. **Select the project**
2. **Go to:** IAM & Admin → Settings (or Project Settings)
3. **Check Project Number:**
   - ✅ Should be: `891545961086` ← **This is the correct one!**
   - ❌ If different: Not the right project

**The project with Project Number `891545961086` is the one linked to Firebase!**

---

## ✅ Method 3: Check by Existing Client IDs

**In the CORRECT project, you should see:**

- ✅ Web Client ID: `891545961086-cs7aq62rgshps172c95ijdcnh2lsej5r`
- ✅ This matches your `capacitor.config.ts` `serverClientId`

**If you see this Client ID, you're in the correct project!**

---

## 🎯 The Correct Project

**Based on your Firebase config, the correct project is:**

- **Project ID:** `pacematch-gps`
- **Project Number:** `891545961086`
- **URL:** https://console.cloud.google.com/apis/credentials?project=pacematch-gps

---

## ✅ Step-by-Step: Create Android OAuth Client ID in CORRECT Project

### Step 1: Go to Correct Project

**URL:** https://console.cloud.google.com/apis/credentials?project=pacematch-gps

**Verify:**
- ✅ URL shows: `project=pacematch-gps`
- ✅ Project dropdown shows: `pacematch-gps`
- ✅ You see Web Client ID: `891545961086-cs7aq62rgshps172c95ijdcnh2lsej5r`

### Step 2: Create Android OAuth Client ID

1. **Click:** "Create Credentials" → "OAuth client ID"

2. **If you see "Configure consent screen" prompt:**
   - Click "Configure consent screen"
   - User Type: **External**
   - App name: **PaceMatch**
   - User support email: **Your email**
   - Developer contact: **Your email**
   - Click "Save and Continue" (twice) → "Back to Dashboard"
   - Then click "Create Credentials" → "OAuth client ID" again

3. **Application type:** Select **"Android"** ⚠️ (NOT Web!)

4. **Fill in:**
   - **Name:** `PaceMatch Android Debug`
   - **Package name:** `com.pacematch.app` ⚠️ **MUST BE EXACTLY THIS**
   - **SHA-1 certificate fingerprint:** `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD` ⚠️ **MUST BE EXACTLY THIS** (uppercase)

5. **Click:** "Create"

### Step 3: Wait for Propagation

- ⏰ **Wait 20-30 minutes** for Google to propagate
- **Don't test immediately!**

### Step 4: Rebuild and Test

**After waiting:**

```bash
cd /Applications/q/pacematch-connect

# Uninstall old app
adb uninstall com.pacematch.app

# Rebuild
npm run build
npx cap sync android
```

**In Android Studio:**
- Build → Clean Project
- Build → Rebuild Project
- Run the app
- Test Google Sign-In

---

## 🚨 Why the Other Project Doesn't Work

**Project `316473938934` is NOT linked to your Firebase project:**
- ❌ Different project number
- ❌ Not connected to Firebase `pacematch-gps`
- ❌ OAuth Client IDs there won't work with your Firebase app

**You MUST use project `pacematch-gps` (891545961086)!**

---

## ✅ Quick Verification

**To verify you're in the correct project:**

1. **URL:** `https://console.cloud.google.com/apis/credentials?project=pacematch-gps`
2. **Project Number:** `891545961086`
3. **Web Client ID exists:** `891545961086-cs7aq62rgshps172c95ijdcnh2lsej5r`

**If all three match:** ✅ You're in the correct project!

---

## 📋 Summary

**The Correct Project:**
- ✅ Project ID: `pacematch-gps`
- ✅ Project Number: `891545961086`
- ✅ URL: https://console.cloud.google.com/apis/credentials?project=pacematch-gps

**What to Do:**
1. ✅ Go to project `pacematch-gps` (891545961086)
2. ✅ Create Android OAuth Client ID there
3. ⏰ Wait 20-30 minutes
4. 🔄 Rebuild and test

**The project with number `891545961086` is the one linked to your Firebase!** 🚀
