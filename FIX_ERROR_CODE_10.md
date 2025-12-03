# 🔧 Fix Error Code 10: Android OAuth Client ID Missing

## ❌ The Error

```
Error Code 10 (DEVELOPER_ERROR): Android OAuth Client ID not configured correctly
```

## ✅ The Solution

You need to create an **Android OAuth Client ID** in Google Cloud Console.

---

## Step-by-Step Fix

### Step 1: Go to Google Cloud Console

**URL:** https://console.cloud.google.com/apis/credentials?project=pacematch-gps

**Verify you're in the correct project:**
- Project ID: `pacematch-gps`
- Project Number: `891545961086`

---

### Step 2: Create Android OAuth Client ID

1. **Click:** "Create Credentials" → "OAuth client ID"

2. **If you see "Configure consent screen" prompt:**
   - Click "Configure consent screen"
   - **User Type:** External
   - **App name:** PaceMatch
   - **User support email:** Your email
   - **Developer contact:** Your email
   - Click "Save and Continue" (twice)
   - Click "Back to Dashboard"
   - Then click "Create Credentials" → "OAuth client ID" again

3. **Application type:** Select **"Android"** ⚠️ (NOT "Web application"!)

4. **Fill in the form:**
   - **Name:** `PaceMatch Android Debug`
   - **Package name:** `com.pacematch.app` (must be exact!)
   - **SHA-1 certificate fingerprint:** `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`

5. **Click:** "Create"

---

### Step 3: Wait for Propagation

⏰ **Wait 10-15 minutes** for Google's servers to recognize the new OAuth Client ID.

**Why wait?** Google's servers need time to propagate the new configuration. If you test immediately, you might still get Error Code 10.

---

### Step 4: Rebuild and Test

After waiting 10-15 minutes:

```bash
cd /Applications/q/pacematch-connect
npm run build
npx cap sync android
```

Then in Android Studio:
1. Build → Assemble Project (or press `⌘ F9`)
2. Run → Run 'app'
3. Test Google Sign-In again

---

## ✅ Verification Checklist

After creating the Android OAuth Client ID, verify:

- [ ] **Application type:** Android (not Web)
- [ ] **Package name:** `com.pacematch.app` (exact match)
- [ ] **SHA-1:** `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`
- [ ] **Project Number:** `891545961086`
- [ ] **Waited 10-15 minutes** after creating

---

## 🎯 Important Notes

### Why Two OAuth Client IDs?

You need **TWO** OAuth Client IDs:

1. **Android OAuth Client ID** (for native Google Sign-In)
   - Type: Android
   - Package: `com.pacematch.app`
   - SHA-1: `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`
   - **Status:** ❌ **MISSING** - This is what's causing Error Code 10!

2. **Web OAuth Client ID** (for Firebase - already configured ✅)
   - Type: Web application
   - Client ID: `891545961086-cs7aq62rgshps172c95ijdcnh2lsej5r.apps.googleusercontent.com`
   - Used in `capacitor.config.ts` as `serverClientId`
   - **Status:** ✅ Already exists

**Both are required!** The Android Client ID is for Google Sign-In SDK, and the Web Client ID is for Firebase authentication.

---

## ❌ Common Mistakes

### Mistake 1: Creating "Web application" instead of "Android"
- ❌ Wrong: Application type: "Web application"
- ✅ Correct: Application type: "Android"

### Mistake 2: Wrong package name
- ❌ Wrong: `com.pacematch` or `pacematch.app`
- ✅ Correct: `com.pacematch.app` (exact match, case-sensitive)

### Mistake 3: Wrong SHA-1
- ❌ Wrong: Using a different SHA-1 fingerprint
- ✅ Correct: `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`

### Mistake 4: Testing too soon
- ❌ Wrong: Testing immediately after creating
- ✅ Correct: Wait 10-15 minutes for propagation

---

## 🔍 How to Verify It's Working

After creating the Android OAuth Client ID and waiting:

1. **Rebuild the app:**
   ```bash
   cd /Applications/q/pacematch-connect
   npm run build
   npx cap sync android
   ```

2. **Build in Android Studio:**
   - Build → Assemble Project (or `⌘ F9`)

3. **Run the app:**
   - Run → Run 'app'

4. **Test Google Sign-In:**
   - Click "Sign in with Google"
   - ✅ **Expected:** Native Google Sign-In UI appears
   - ✅ **Expected:** You can select a Google account
   - ✅ **Expected:** Sign-in succeeds (no Error Code 10)

---

## 📋 Summary

**Error Code 10 = Android OAuth Client ID missing or misconfigured**

**Fix:**
1. Create Android OAuth Client ID in Google Cloud Console
2. Use package name: `com.pacematch.app`
3. Use SHA-1: `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`
4. Wait 10-15 minutes
5. Rebuild and test

**After fixing, Google Sign-In should work!** ✅
