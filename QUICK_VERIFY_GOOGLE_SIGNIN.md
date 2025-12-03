# ✅ Quick Google Sign-In Verification Checklist

## Your Current Configuration

### ✅ SHA-1 Fingerprint (Confirmed)
```
81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD
```

### ✅ Package Name
```
com.pacematch.app
```

### ✅ Server Client ID (in capacitor.config.ts)
```
891545961086-cs7aq62rgshps172c95ijdcnh2lsej5r.apps.googleusercontent.com
```

---

## 🔍 What to Verify in Google Cloud Console

**Go to:** https://console.cloud.google.com/apis/credentials?project=pacematch-gps

### Check 1: Android OAuth Client ID Exists

- [ ] **Do you see an OAuth Client ID with type "Android"?**
  - If NO → You need to create one (see below)
  - If YES → Continue to Check 2

### Check 2: Android OAuth Client ID Details

Click on the Android OAuth Client ID and verify:

- [ ] **Application type:** Must be **"Android"** (not "Web application")
- [ ] **Package name:** Must be exactly **`com.pacematch.app`**
- [ ] **SHA-1 certificate fingerprint:** Must be **`81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`**
- [ ] **Project Number:** Must be **`891545961086`**

### Check 3: Web Client ID Exists

- [ ] **Do you see an OAuth Client ID with type "Web application"?**
  - This should exist (created automatically by Firebase)
  - Client ID should be: `891545961086-cs7aq62rgshps172c95ijdcnh2lsej5r.apps.googleusercontent.com`

---

## ❌ If Android OAuth Client ID is Missing

### Create It Now:

1. **Click:** "Create Credentials" → "OAuth client ID"
2. **If prompted to configure consent screen:**
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
   - **Package name:** `com.pacematch.app`
   - **SHA-1 certificate fingerprint:** `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`

5. **Click:** "Create"

6. **Wait 10-15 minutes** for changes to propagate

---

## 🔄 Rebuild Steps

After verifying/creating the Android OAuth Client ID:

```bash
cd /Applications/q/pacematch-connect
npm run build
npx cap sync android
```

Then in Android Studio:
1. Build → Make Project
2. Run → Run 'app'

---

## 🧪 Test Google Sign-In

1. Open app on device/emulator
2. Click "Sign in with Google"
3. **Expected:** Native Google Sign-In UI appears
4. Select Google account
5. **Expected:** Sign-in succeeds, app proceeds

---

## ❌ If Sign-In Fails

### Error: "DEVELOPER_ERROR (Code 10)"

**This means:** Android OAuth Client ID is missing or misconfigured

**Fix:**
1. Verify Android OAuth Client ID exists in Google Cloud Console
2. Check package name is exactly `com.pacematch.app`
3. Check SHA-1 matches: `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`
4. Wait 10-15 minutes if you just created it
5. Rebuild app

### Error: "NETWORK_ERROR (Code 7)"

**This means:** No internet connection

**Fix:**
- Check device/emulator has internet
- Try again

### Error: "SIGN_IN_CANCELLED (Code 12500)"

**This means:** User cancelled (normal)

**Fix:**
- Just try again

---

## ✅ Success Indicators

Google Sign-In is working if:
- ✅ Native Google Sign-In UI appears
- ✅ You can select a Google account
- ✅ Sign-in completes without errors
- ✅ You're authenticated in Firebase
- ✅ App proceeds to main screen

---

## 📋 Quick Summary

**You need TWO OAuth Client IDs:**

1. **Android OAuth Client ID** (for native Google Sign-In)
   - Type: Android
   - Package: `com.pacematch.app`
   - SHA-1: `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`

2. **Web OAuth Client ID** (for Firebase - already configured)
   - Type: Web application
   - Client ID: `891545961086-cs7aq62rgshps172c95ijdcnh2lsej5r.apps.googleusercontent.com`
   - Used in `capacitor.config.ts` as `serverClientId`

**Both are required!** ✅

