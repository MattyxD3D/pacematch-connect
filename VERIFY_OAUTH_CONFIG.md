# ✅ Verify Android OAuth Client Configuration

## Current App Configuration (Verified ✅)

**Package Name:** `com.pacematch.app`
- ✅ `android/app/build.gradle`: `applicationId "com.pacematch.app"`
- ✅ `capacitor.config.ts`: `appId: 'com.pacematch.app'`
- ✅ `MainActivity.java`: `package com.pacematch.app;`

**SHA-1 Fingerprint:**
```
81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD
```

---

## Verify in Google Cloud Console

**Go to:** https://console.cloud.google.com/apis/credentials?project=pacematch-gps

### Find Your Android OAuth Client ID

Look for the Android OAuth Client ID:
- Client ID: `891545961086-6liagtt1h0n5op2m0iv4tsg06eashha3.apps.googleusercontent.com`

### Click on it to view/edit

### Verify These Values EXACTLY:

#### 1. Package Name ✅
**Must be EXACTLY:**
```
com.pacematch.app
```

**Common mistakes:**
- ❌ `com.pacematch` (missing `.app`)
- ❌ `Com.pacematch.app` (capital C)
- ❌ `com.PaceMatch.app` (capital letters)
- ❌ `com.pacematch.app ` (extra space at end)
- ✅ `com.pacematch.app` (correct - all lowercase, no spaces)

#### 2. SHA-1 Fingerprint ✅

**Must be EXACTLY (with uppercase letters):**
```
81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD
```

**OR lowercase (both work, but must match exactly):**
```
81:55:30:46:0c:b0:fc:a5:49:b8:96:f6:0b:ce:48:b6:b3:f9:ed:cd
```

**Common mistakes:**
- ❌ Missing a colon `:`
- ❌ Extra space
- ❌ Wrong letter case (if you entered lowercase, it must stay lowercase)
- ❌ Missing a character
- ❌ Extra character

**Character count check:**
- Should have exactly **19 colons** `:`
- Should have exactly **40 hex characters** (0-9, A-F or a-f)
- Total length: **59 characters** (including colons)

---

## If Values Don't Match

### Option 1: Edit Existing OAuth Client ID

1. Click on the Android OAuth Client ID
2. Click **"Edit"** or pencil icon
3. Fix the package name or SHA-1
4. Click **"Save"**
5. Wait 10-15 minutes

### Option 2: Delete and Recreate (Recommended)

1. Click on the Android OAuth Client ID
2. Click **"Delete"**
3. Click **"Create Credentials"** → **"OAuth client ID"**
4. Application type: **"Android"**
5. Enter:
   - **Package name:** `com.pacematch.app` (exact copy-paste)
   - **SHA-1:** `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD` (exact copy-paste)
6. Click **"Create"**
7. Wait 10-15 minutes

---

## Double-Check Checklist

Before testing again, verify:

- [ ] Package name in Google Cloud Console: `com.pacematch.app` (exact match)
- [ ] SHA-1 in Google Cloud Console matches exactly (character by character)
- [ ] Waited 10-15 minutes after creating/editing
- [ ] Rebuilt the app (`npm run build && npx cap sync android`)
- [ ] Rebuilt in Android Studio (Build → Rebuild Project)
- [ ] Ran the app again

---

## Still Getting Error Code 10?

If you've verified everything and it still fails:

1. **Take a screenshot** of the Android OAuth Client ID configuration in Google Cloud Console
2. **Verify you're using the correct project** in Google Cloud Console (should be `pacematch-gps`)
3. **Check if there are multiple Android OAuth Client IDs** - make sure you're using the right one
4. **Try deleting ALL Android OAuth Client IDs** and creating a fresh one

---

**The most common issue is a typo in package name or SHA-1!** Copy-paste them exactly! 📋

