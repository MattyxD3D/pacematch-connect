# ✅ Verify After Transferring SHA-1

## What You Just Did

You transferred the SHA-1 to the other project. Good! Now let's make sure everything is set up correctly.

---

## ✅ Step 1: Verify You're in the CORRECT Project

**The correct project should have:**
- **Project ID:** `pacematch-gps`
- **Project Number:** `891545961086`

**How to verify:**
1. **Check the URL:**
   ```
   https://console.cloud.google.com/apis/credentials?project=pacematch-gps
   ```
   ✅ Should show `project=pacematch-gps`

2. **Check the project dropdown:**
   - Should show Project ID: `pacematch-gps`
   - Should show Project Number: `891545961086`

---

## ✅ Step 2: Verify Android OAuth Client ID Exists

**In the CORRECT project (`pacematch-gps`), check:**

1. **Go to:** APIs & Services → Credentials
2. **Look for Android OAuth Client ID** with:
   - ✅ Application type: **Android**
   - ✅ Package name: **`com.pacematch.app`**
   - ✅ SHA-1: **`81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`**

**If you see it with all three matching:** ✅ **Perfect!**

---

## ✅ Step 3: If You Just Created/Updated It

**If you just created or updated the Android OAuth Client ID:**

1. ⏰ **Wait 10-15 minutes** for Google to propagate
   - Don't test immediately!
   - Google needs time to update their servers

2. 🔄 **After waiting, rebuild your app:**
   ```bash
   cd /Applications/q/pacematch-connect
   
   # Uninstall old app (optional but recommended)
   adb uninstall com.pacematch.app
   
   # Rebuild
   npm run build
   npx cap sync android
   ```

3. **In Android Studio:**
   - Wait for Gradle sync
   - Build → Clean Project
   - Build → Rebuild Project
   - Run the app

4. 🧪 **Test Google Sign-In** - it should work now! 🎉

---

## ❌ If Android OAuth Client ID Doesn't Exist

**If you don't see an Android OAuth Client ID in the correct project:**

1. **Make sure you're in project `pacematch-gps`**
2. **Create Android OAuth Client ID:**
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: **Android**
   - Package name: `com.pacematch.app`
   - SHA-1: `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`
3. **Click "Create"**
4. **Wait 10-15 minutes**
5. **Rebuild and test**

---

## 🎯 Quick Checklist

**Before testing, verify:**

- [ ] You're in project `pacematch-gps` (Project ID, not display name)
- [ ] Project Number is `891545961086`
- [ ] Android OAuth Client ID exists in this project
- [ ] Application type is **Android** (not Web)
- [ ] Package name is **`com.pacematch.app`** (exact match)
- [ ] SHA-1 is **`81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`** (exact match)
- [ ] Waited 10-15 minutes after creating/updating
- [ ] Rebuilt the app

**If all checked:** ✅ **You're ready to test!**

---

## 🚨 Common Issues After Transfer

### Issue 1: Created in Wrong Project
- **Symptom:** OAuth Client ID exists but Google Sign-In still fails
- **Fix:** Make sure it's in project `pacematch-gps` (check Project ID, not display name)

### Issue 2: Not Propagated Yet
- **Symptom:** Created it but still getting errors
- **Fix:** Wait 10-15 minutes, then rebuild and test

### Issue 3: Wrong Package Name or SHA-1
- **Symptom:** OAuth Client ID exists but has wrong values
- **Fix:** Edit the OAuth Client ID and fix the values

---

## ✅ Summary

**What You Did:**
- ✅ Transferred SHA-1 to the correct project

**What to Do Now:**
1. ✅ Verify you're in project `pacematch-gps`
2. ✅ Verify Android OAuth Client ID exists with correct values
3. ⏰ Wait 10-15 minutes (if just created/updated)
4. 🔄 Rebuild app
5. 🧪 Test Google Sign-In

**Once everything is verified and you've waited, Google Sign-In should work!** 🚀
