# 🔧 Fix: Duplicate Google Cloud Projects

## The Problem

You have **duplicate Google Cloud projects**, and the Android OAuth Client ID might be in the **wrong project**.

---

## ✅ Identify the Correct Project

### The Correct Project (Your Firebase Project)

**Project ID:** `pacematch-gps`  
**Project Number:** `891545961086`

**This is the one your code is using!**

---

## 🔍 Step 1: List All Your Projects

1. **Go to Google Cloud Console:**
   - https://console.cloud.google.com/

2. **Click the project dropdown** at the top (shows current project name)

3. **You'll see a list of all projects**

4. **Look for:**
   - Project with ID: `pacematch-gps`
   - Project with Number: `891545961086`

**This is your CORRECT project!** ✅

---

## 🔍 Step 2: Check Each Project for Android OAuth Client ID

### For Each Project:

1. **Select the project** from the dropdown
2. **Go to:** APIs & Services → Credentials
   - Or: https://console.cloud.google.com/apis/credentials?project=PROJECT_ID
3. **Look for OAuth 2.0 Client IDs**
4. **Check if any have Application type: Android**

### What to Look For:

**Android OAuth Client ID should have:**
- ✅ Application type: **Android** (not "Web application")
- ✅ Package name: **`com.pacematch.app`**
- ✅ SHA-1: **`81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`**
- ✅ Project Number: **`891545961086`** (if in correct project)

---

## 🎯 Step 3: Use the Correct Project

### Option A: Android OAuth Client ID is in CORRECT Project (`pacematch-gps`)

**If you found Android OAuth Client ID in project `pacematch-gps` (891545961086):**

1. ✅ **You're good!** Just verify the details:
   - Package name: `com.pacematch.app`
   - SHA-1: `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`
2. ⏰ **Wait 15-30 minutes** if you just created/updated it
3. 🔄 **Rebuild app** and test

### Option B: Android OAuth Client ID is in WRONG Project

**If you found Android OAuth Client ID in a DIFFERENT project:**

1. ❌ **This won't work!** The Android OAuth Client ID must be in `pacematch-gps` (891545961086)
2. ✅ **Create a new Android OAuth Client ID in the CORRECT project:**
   - Go to: https://console.cloud.google.com/apis/credentials?project=pacematch-gps
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: **Android**
   - Package name: `com.pacematch.app`
   - SHA-1: `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`
   - Click "Create"
3. ⏰ **Wait 15-30 minutes**
4. 🔄 **Rebuild app** and test

### Option C: Android OAuth Client ID Doesn't Exist

**If you don't see Android OAuth Client ID in ANY project:**

1. ✅ **Create it in the CORRECT project:**
   - Go to: https://console.cloud.google.com/apis/credentials?project=pacematch-gps
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: **Android**
   - Package name: `com.pacematch.app`
   - SHA-1: `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`
   - Click "Create"
2. ⏰ **Wait 15-30 minutes**
3. 🔄 **Rebuild app** and test

---

## 📋 Quick Checklist

- [ ] **Identified correct project:** `pacematch-gps` (891545961086)
- [ ] **Checked correct project** for Android OAuth Client ID
- [ ] **If found in wrong project:** Created new one in `pacematch-gps`
- [ ] **If not found:** Created new one in `pacematch-gps`
- [ ] **Verified Android OAuth Client ID has:**
  - [ ] Application type: **Android**
  - [ ] Package name: **`com.pacematch.app`**
  - [ ] SHA-1: **`81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`**
- [ ] **Waited 15-30 minutes** after creating/updating
- [ ] **Rebuilt app:**
  ```bash
  cd /Applications/q/pacematch-connect
  npm run build
  npx cap sync android
  ```

---

## 🎯 How to Always Use Correct Project

### Method 1: Use Direct URL

**Always use this URL to go directly to the correct project:**
```
https://console.cloud.google.com/apis/credentials?project=pacematch-gps
```

This ensures you're always in the correct project!

### Method 2: Check Project Selector

**Before creating/checking OAuth Client IDs:**
1. Look at the **project dropdown** at the top
2. Verify it shows: **`pacematch-gps`**
3. Verify Project Number: **`891545961086`**
4. If not, click dropdown and select `pacematch-gps`

### Method 3: Check URL

**The URL should always show:**
```
project=pacematch-gps
```

If it shows a different project ID, you're in the wrong project!

---

## ⚠️ Important Notes

### Why Project Matters

**Google Sign-In requires:**
- ✅ Android OAuth Client ID must be in the **SAME project** as your Firebase project
- ✅ Your Firebase project is: `pacematch-gps` (891545961086)
- ✅ Therefore, Android OAuth Client ID must be in: `pacematch-gps` (891545961086)

**If Android OAuth Client ID is in a different project:**
- ❌ Google Sign-In SDK won't find it
- ❌ You'll get Error Code 10 (DEVELOPER_ERROR)
- ❌ Sign-in will fail

### You Can Have Multiple Projects

**It's OK to have multiple Google Cloud projects**, but:
- ✅ **Android OAuth Client ID must be in `pacematch-gps`** (your Firebase project)
- ✅ Other projects won't work for this app

---

## 🔄 After Fixing

1. **Verify Android OAuth Client ID is in `pacematch-gps`** (891545961086)
2. **Wait 15-30 minutes** for propagation
3. **Rebuild:**
   ```bash
   cd /Applications/q/pacematch-connect
   npm run build
   npx cap sync android
   ```
4. **In Android Studio:**
   - Build → Assemble Project (or `⌘ F9`)
   - Run → Run 'app'
5. **Test Google Sign-In**

---

## ✅ Summary

**The issue:** Android OAuth Client ID is in the wrong Google Cloud project

**The fix:**
1. Identify correct project: `pacematch-gps` (891545961086)
2. Check if Android OAuth Client ID exists in correct project
3. If not, create it in `pacematch-gps`
4. Wait 15-30 minutes
5. Rebuild and test

**Always use this URL to ensure correct project:**
```
https://console.cloud.google.com/apis/credentials?project=pacematch-gps
```

After fixing, Google Sign-In should work! 🚀

