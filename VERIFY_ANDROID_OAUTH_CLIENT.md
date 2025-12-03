# ✅ Verify Android OAuth Client Configuration

## The "Something went wrong" error almost always means:
**The Android OAuth Client ID is NOT configured correctly in Google Cloud Console.**

---

## Step-by-Step Verification

### 1. Go to Google Cloud Console

**URL:** https://console.cloud.google.com/apis/credentials?project=pacematch-gps

### 2. Check for Android OAuth Client ID

**Look for:**
- ✅ An OAuth Client ID with **Application type: Android**
- ✅ Package name: `com.pacematch.app`
- ✅ SHA-1 certificate fingerprint: `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`

### 3. If It Doesn't Exist → CREATE IT

1. Click **"Create Credentials"** button (top of page)
2. Select **"OAuth client ID"**
3. If prompted, select **"Configure consent screen"** first (if you haven't already)
   - User Type: **External** (unless you have a Google Workspace)
   - App name: **PaceMatch**
   - User support email: **Your email**
   - Developer contact: **Your email**
   - Click **"Save and Continue"** → **"Save and Continue"** → **"Back to Dashboard"**
4. Now create the OAuth Client ID:
   - **Application type:** Select **"Android"**
   - **Name:** `PaceMatch Android` (or any name)
   - **Package name:** `com.pacematch.app` ⚠️ **MUST MATCH EXACTLY**
   - **SHA-1 certificate fingerprint:** `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD` ⚠️ **MUST MATCH EXACTLY**
5. Click **"Create"**
6. **IMPORTANT:** Wait 5-10 minutes for Google to propagate the change

### 4. Verify All OAuth Client IDs

You should have **3 OAuth Client IDs**:
1. ✅ **Web application** (for `serverClientId` in capacitor.config.ts)
   - Client ID: `891545961086-cs7aq62rgshps172c95ijdcnh2lsej5r.apps.googleusercontent.com`
2. ✅ **Android application** (for native Google Sign-In)
   - Package name: `com.pacematch.app`
   - SHA-1: `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`
3. ✅ **iOS application** (if you plan to support iOS)
   - Bundle ID: `com.pacematch.app`

---

## Common Mistakes

### ❌ Wrong Package Name
- **Wrong:** `com.pacematch` or `pacematch.app`
- **Correct:** `com.pacematch.app` (exact match)

### ❌ Wrong SHA-1 Fingerprint
- Make sure you're using the **debug keystore** SHA-1
- For Android Studio debug builds, the SHA-1 is: `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`
- If you build with a different keystore, you need that keystore's SHA-1

### ❌ Wrong Client ID Type
- Make sure you're using the **Android** OAuth Client ID for native sign-in
- The **Web** Client ID is only used in `capacitor.config.ts` as `serverClientId`

### ❌ Didn't Wait for Propagation
- After creating/updating the Android OAuth Client ID, wait 5-10 minutes
- Google needs time to propagate the configuration

---

## After Configuration

1. **Rebuild the app:**
   ```bash
   npm run build
   npx cap sync android
   ```

2. **Rebuild in Android Studio:**
   - Build → Rebuild Project
   - Or just Run again

3. **Test Google Sign-In:**
   - Click "Sign in with Google"
   - Check Logcat for detailed error messages (with the improved logging)

---

## Still Not Working?

After rebuilding, check Logcat again. The improved error logging will show:
- `❌ SignIn error code:` - This will tell us the exact error
- Common codes:
  - **Code 10:** DEVELOPER_ERROR - Android OAuth Client ID not configured correctly
  - **Code 7:** NETWORK_ERROR - Check internet connection
  - **Code 12500:** SIGN_IN_CANCELLED - User cancelled (not a real error)

**Share the error code from Logcat and I can help fix it!** 🔧

