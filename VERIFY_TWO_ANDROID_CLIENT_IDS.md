# 🔍 Verify Your Two Android OAuth Client IDs

## Your Android OAuth Client IDs

1. `891545961086-ksjs21a9p50ld02mjireesv0abenc1f5.apps.googleusercontent.com`
2. `891545961086-d7gpt4pn3cp4984hra9dko5ercjkg3d9.apps.googleusercontent.com`

---

## ✅ Step 1: Verify Each Client ID

### Go to Google Cloud Console

**URL:** https://console.cloud.google.com/apis/credentials?project=pacematch-gps

### For Each Client ID, Click on It and Check:

#### Client ID 1: `891545961086-ksjs21a9p50ld02mjireesv0abenc1f5`

- [ ] **Application type:** Must be **"Android"** (not "Web application")
- [ ] **Package name:** Must be exactly **`com.pacematch.app`** (case-sensitive, no spaces)
- [ ] **SHA-1 certificate fingerprint:** Must be **`81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`**
- [ ] **Project Number:** Must be **`891545961086`**

#### Client ID 2: `891545961086-d7gpt4pn3cp4984hra9dko5ercjkg3d9`

- [ ] **Application type:** Must be **"Android"** (not "Web application")
- [ ] **Package name:** Must be exactly **`com.pacematch.app`** (case-sensitive, no spaces)
- [ ] **SHA-1 certificate fingerprint:** Must be **`81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`**
- [ ] **Project Number:** Must be **`891545961086`**

---

## 🎯 What You're Looking For

**At least ONE of them should have:**
- ✅ Application type: **Android**
- ✅ Package name: **`com.pacematch.app`** (exact match)
- ✅ SHA-1: **`81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`**

**If BOTH have these, that's fine - you can keep both (one for debug, one for production).**

**If NEITHER has these, or if the values don't match exactly, that's the problem!**

---

## ❌ Common Issues

### Issue 1: Package Name Doesn't Match Exactly

**Check for:**
- ❌ Extra spaces: `com.pacematch.app ` (space at end)
- ❌ Wrong case: `Com.pacematch.app` or `com.PaceMatch.app`
- ❌ Missing parts: `com.pacematch` (missing `.app`)
- ✅ Correct: `com.pacematch.app` (all lowercase, no spaces)

### Issue 2: SHA-1 Doesn't Match

**Check for:**
- ❌ Wrong format: Missing colons or extra spaces
- ❌ Different SHA-1: Using production SHA-1 instead of debug
- ❌ Case mismatch: `81:55:30:46:0c:b0:fc:a5...` vs `81:55:30:46:0C:B0:FC:A5...` (both should work, but be consistent)

**Get your current SHA-1:**
```bash
cd /Applications/q/pacematch-connect/android
./gradlew signingReport
```

Look for the **SHA1** value in the output.

### Issue 3: Application Type is Wrong

**Check:**
- ❌ Application type: "Web application" → **WRONG!**
- ✅ Application type: "Android" → **CORRECT!**

---

## 🔧 Alternative Solutions

If you've verified everything and it still doesn't work, here are alternative approaches:

### Option 1: Use Web-Based Sign-In (No Android OAuth Client ID Needed)

Switch to web-based Google Sign-In instead of native. This doesn't require Android OAuth Client ID.

**Pros:**
- ✅ No Android OAuth Client ID needed
- ✅ Uses existing Web Client ID
- ✅ Simpler setup

**Cons:**
- ❌ Opens browser (worse UX)
- ❌ Redirects out of app

### Option 2: Delete and Recreate Android OAuth Client ID

Sometimes recreating fixes issues:
1. Delete the Android OAuth Client ID
2. Wait 5 minutes
3. Create a new one with exact values
4. Wait 15-30 minutes
5. Rebuild and test

### Option 3: Check if Using Different Keystore

If you're building in Android Studio, it might be using a different keystore:
- Check which keystore Android Studio is using
- Get SHA-1 from that keystore
- Add that SHA-1 to Android OAuth Client ID

---

## 📋 Verification Checklist

For each Android OAuth Client ID, verify:

- [ ] **Application type:** Android (not Web)
- [ ] **Package name:** `com.pacematch.app` (exact match, no spaces, lowercase)
- [ ] **SHA-1:** Matches your current debug keystore SHA-1
- [ ] **Project:** `pacematch-gps` (891545961086)
- [ ] **Created/Updated:** Wait 15-30 minutes after creating/updating

---

## 🔍 Debug Steps

1. **Get your current SHA-1:**
   ```bash
   cd /Applications/q/pacematch-connect/android
   ./gradlew signingReport
   ```

2. **Compare with Google Cloud Console:**
   - Go to each Android OAuth Client ID
   - Check if SHA-1 matches exactly

3. **Check package name:**
   - Verify it's exactly `com.pacematch.app` (no spaces, lowercase)

4. **Verify project:**
   - Make sure both are in project `pacematch-gps` (891545961086)

---

## ✅ Next Steps

1. **Check both Client IDs** in Google Cloud Console
2. **Verify which one (if any) has correct values**
3. **If neither is correct, fix or create a new one**
4. **Wait 15-30 minutes**
5. **Rebuild and test**

Or, if you want to avoid the hassle, **switch to web-based sign-in** (Option 1 above).

