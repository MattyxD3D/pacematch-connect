# ✅ Verify Google Sign-In on Android Studio

## Step-by-Step Verification Guide

Follow these steps to verify that Google Sign-In is properly configured and working on Android.

---

## Step 1: Verify SHA-1 Fingerprint

### Get Your Current SHA-1

**Option A: Using Gradle (Easiest)**

1. Open Android Studio
2. Open Terminal in Android Studio (View → Tool Windows → Terminal)
3. Run:
```bash
cd /Applications/q/pacematch-connect/android
./gradlew signingReport
```

4. Look for output like:
```
Variant: debug
Config: debug
Store: ~/.android/debug.keystore
Alias: AndroidDebugKey
SHA1: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
```

5. **Copy the SHA1 value** (the long string with colons)

**Option B: Using Keytool**

```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

Look for `SHA1:` in the output and copy it.

### Expected SHA-1 (Debug)
```
81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD
```

**Note:** If you get a different SHA-1, that's fine - just use what you get!

---

## Step 2: Verify Google Cloud Console Configuration

### Check Android OAuth Client ID

1. **Go to Google Cloud Console:**
   - URL: https://console.cloud.google.com/apis/credentials?project=pacematch-gps

2. **Look for OAuth 2.0 Client IDs:**
   - You should see at least one **Android** type client ID

3. **Click on each Android Client ID and verify:**

   ✅ **Application type:** Must be **"Android"** (NOT "Web application")
   
   ✅ **Package name:** Must be exactly **`com.pacematch.app`**
   
   ✅ **SHA-1 certificate fingerprint:** Must match the SHA-1 you got in Step 1
   
   ✅ **Project Number:** Must be **`891545961086`**

### If Android OAuth Client ID is Missing

If you don't see an Android OAuth Client ID:

1. Click **"Create Credentials"** → **"OAuth client ID"**
2. Select **Application type: Android**
3. Enter:
   - **Name:** `PaceMatch Android Debug` (or any name)
   - **Package name:** `com.pacematch.app`
   - **SHA-1 certificate fingerprint:** (paste the SHA-1 from Step 1)
4. Click **"Create"**
5. **Wait 10-15 minutes** for changes to propagate

---

## Step 3: Verify Capacitor Configuration

### Check capacitor.config.ts

1. **Open:** `/Applications/q/pacematch-connect/capacitor.config.ts`

2. **Verify GoogleAuth plugin config:**
```typescript
GoogleAuth: {
  scopes: ['profile', 'email'],
  serverClientId: '891545961086-cs7aq62rgshps172c95ijdcnh2lsej5r.apps.googleusercontent.com',
  forceCodeForRefreshToken: true
}
```

✅ **serverClientId** should be your **Web Client ID** (not Android Client ID)

✅ **Where to find Web Client ID:**
   - Google Cloud Console → Credentials
   - Look for **"Web client"** type OAuth Client ID
   - Should be: `891545961086-cs7aq62rgshps172c95ijdcnh2lsej5r.apps.googleusercontent.com`

---

## Step 4: Verify Firebase Configuration

### Check google-services.json

1. **Verify file exists:**
   - `/Applications/q/pacematch-connect/android/app/google-services.json`

2. **Verify package name:**
   - Should contain: `"package_name": "com.pacematch.app"`

3. **Verify project number:**
   - Should contain: `"project_number": "891545961086"`

---

## Step 5: Rebuild and Sync

### Sync Capacitor Changes

```bash
cd /Applications/q/pacematch-connect
npm run build
npx cap sync android
```

**What this does:**
- Builds your web app
- Syncs changes to Android project
- Updates native Android code with latest config

---

## Step 6: Build and Run in Android Studio

### Build the App

1. **Open Android Studio:**
   ```bash
   cd /Applications/q/pacematch-connect
   npx cap open android
   ```

2. **Wait for Gradle sync** to complete

3. **Build the app:**
   - Click **Build** → **Make Project** (or press `Cmd+F9` / `Ctrl+F9`)

4. **Run on device/emulator:**
   - Click **Run** → **Run 'app'** (or press `Shift+F10`)
   - Or click the green play button ▶️

---

## Step 7: Test Google Sign-In

### Test the Sign-In Flow

1. **Open the app** on your device/emulator

2. **Navigate to login screen**

3. **Click "Sign in with Google"**

4. **Expected behavior:**
   - ✅ Native Google Sign-In UI appears (account picker)
   - ✅ You can select a Google account
   - ✅ Sign-in completes successfully
   - ✅ You're redirected to the app's main screen

### If Sign-In Fails

**Check for these error messages:**

#### Error Code 10 (DEVELOPER_ERROR)
```
❌ Configuration error: Check that Android OAuth Client ID is created 
   in Google Cloud Console with correct package name (com.pacematch.app) 
   and SHA-1 fingerprint.
```

**Fix:**
- Verify Android OAuth Client ID exists in Google Cloud Console
- Check package name matches exactly: `com.pacematch.app`
- Check SHA-1 matches your debug keystore SHA-1
- Wait 10-15 minutes after creating/updating OAuth Client ID
- Rebuild and try again

#### Error Code 7 (NETWORK_ERROR)
```
❌ NETWORK_ERROR (Code 7): Check your internet connection
```

**Fix:**
- Check device/emulator has internet connection
- Try again

#### Error Code 12500 (SIGN_IN_CANCELLED)
```
❌ SIGN_IN_CANCELLED (Code 12500): User cancelled sign-in
```

**Fix:**
- This is normal if user cancels - just try again

---

## Step 8: Check Logs (If Sign-In Fails)

### View Android Logs

1. **In Android Studio:**
   - Open **Logcat** tab (bottom panel)
   - Filter by: `GoogleAuth` or `FirebaseAuth`

2. **Look for error messages:**
   - Search for: `DEVELOPER_ERROR`, `Error Code 10`, `OAuth Client ID`

3. **Common log messages:**
   ```
   ❌ Google Sign-In failed: DEVELOPER_ERROR
   ❌ Error Code: 10
   ❌ Android OAuth Client ID not found
   ```

### View Console Logs (In App)

The app logs detailed information to console. Check for:
- `📱 Capacitor native app detected - using native Google Sign-In`
- `✅ Google Auth plugin initialized successfully`
- `✅ GoogleAuth.signIn() completed`
- `✅ Successfully signed in to Firebase`

---

## Quick Verification Checklist

Before testing, verify:

- [ ] SHA-1 fingerprint obtained (Step 1)
- [ ] Android OAuth Client ID exists in Google Cloud Console (Step 2)
- [ ] Android OAuth Client ID has correct package name: `com.pacematch.app` (Step 2)
- [ ] Android OAuth Client ID has correct SHA-1 fingerprint (Step 2)
- [ ] `capacitor.config.ts` has `serverClientId` configured (Step 3)
- [ ] `google-services.json` exists and has correct package name (Step 4)
- [ ] App rebuilt and synced with Capacitor (Step 5)
- [ ] App built successfully in Android Studio (Step 6)

---

## Common Issues and Solutions

### Issue: "DEVELOPER_ERROR (Code 10)"

**Cause:** Android OAuth Client ID missing or misconfigured

**Solution:**
1. Go to Google Cloud Console
2. Create/verify Android OAuth Client ID
3. Ensure package name is exactly `com.pacematch.app`
4. Ensure SHA-1 matches your debug keystore SHA-1
5. Wait 10-15 minutes
6. Rebuild app

### Issue: "Sign-in UI doesn't appear"

**Cause:** Google Auth plugin not initialized

**Solution:**
1. Check `capacitor.config.ts` has `GoogleAuth` config
2. Run `npx cap sync android`
3. Rebuild app

### Issue: "Sign-in works but Firebase auth fails"

**Cause:** Wrong `serverClientId` in `capacitor.config.ts`

**Solution:**
1. Verify `serverClientId` is your **Web Client ID** (not Android Client ID)
2. Web Client ID should be from Google Cloud Console → Credentials → Web client
3. Update `capacitor.config.ts`
4. Run `npx cap sync android`
5. Rebuild app

---

## Success Indicators

✅ **Google Sign-In is working if:**
- Native Google Sign-In UI appears when clicking "Sign in with Google"
- You can select a Google account
- Sign-in completes without errors
- You're authenticated in Firebase
- App proceeds to main screen

---

## Next Steps After Verification

Once Google Sign-In is working:

1. ✅ **Test on physical device** (if you tested on emulator)
2. ✅ **Test with different Google accounts**
3. ✅ **Test sign-out and sign-in again**
4. ✅ **Set up production SHA-1** (for release builds)

---

## Need Help?

If sign-in still doesn't work after following all steps:

1. **Check Android Studio Logcat** for detailed error messages
2. **Verify all configurations** match exactly (package name, SHA-1, etc.)
3. **Wait 15-30 minutes** if you just created/updated OAuth Client ID
4. **Try rebuilding** the app completely (Build → Clean Project, then rebuild)

---

## Summary

**The two critical requirements for Google Sign-In on Android:**

1. ✅ **Android OAuth Client ID** in Google Cloud Console
   - Type: Android (not Web)
   - Package name: `com.pacematch.app`
   - SHA-1: Your debug keystore SHA-1

2. ✅ **Web Client ID** in `capacitor.config.ts`
   - `serverClientId` must be your Web Client ID
   - Used by Firebase to verify the Google token

**Both are required!** The Android Client ID is for Google Sign-In SDK, and the Web Client ID is for Firebase authentication.

