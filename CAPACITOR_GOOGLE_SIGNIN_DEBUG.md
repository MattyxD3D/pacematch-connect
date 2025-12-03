# 🔍 Debug Google Sign-In in Capacitor

## ✅ Good News: Your Setup is Correct!

Your app **IS** using native Google Sign-In for Capacitor:
- ✅ Plugin installed: `@codetrix-studio/capacitor-google-auth`
- ✅ Code detects Capacitor: `isCapacitorNative()` function
- ✅ Uses native plugin: `GoogleAuth.signIn()`
- ✅ Android OAuth Client ID created: `891545961086-0t0tlusq8c9bmd7no4g8ps6ssp38u0e4`

**Capacitor apps ARE native apps!** The plugin bridges to native Android/iOS code.

---

## 🔍 What Error Are You Seeing?

Please check **Logcat** in Android Studio and share:

1. **What happens when you click "Sign in with Google"?**
   - Does the native UI appear?
   - Does it fail immediately?
   - What error message shows?

2. **Check Logcat:**
   - Open Logcat in Android Studio
   - Filter by: `Capacitor/Console` or `📱|🔄|❌`
   - Look for error messages

---

## 🐛 Common Issues & Fixes

### Issue 1: Code 10 (DEVELOPER_ERROR)

**Symptoms:**
- Native UI appears
- After selecting account, error: "Configuration error..."

**Fix:**
1. **Verify Android OAuth Client ID in Google Cloud Console:**
   - Go to: https://console.cloud.google.com/apis/credentials?project=pacematch-gps
   - Find: `891545961086-0t0tlusq8c9bmd7no4g8ps6ssp38u0e4`
   - Check:
     - Package name: `com.pacematch.app` (exact match, lowercase)
     - SHA-1: `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`

2. **Wait 5-10 minutes** after creating/updating OAuth Client ID
   - Google needs time to propagate changes

3. **Rebuild app:**
   ```bash
   npm run build
   npx cap sync android
   # Then rebuild in Android Studio
   ```

### Issue 2: Plugin Not Initialized

**Symptoms:**
- Error: "Plugin not initialized" or "GoogleAuth is not defined"

**Fix:**
1. Make sure plugin is synced:
   ```bash
   npx cap sync android
   ```

2. Rebuild in Android Studio:
   - Build → Rebuild Project

3. Check plugin is in `android/capacitor.settings.gradle`

### Issue 3: Wrong SHA-1

**Symptoms:**
- Code 10 error
- Everything looks correct but still fails

**Fix:**
1. **Get your actual SHA-1:**
   ```bash
   cd /Applications/q/pacematch-connect/android
   ./gradlew signingReport
   ```

2. **Verify it matches** in Google Cloud Console

3. **If different**, update the Android OAuth Client ID with the correct SHA-1

---

## 📋 Verification Checklist

Before testing, verify:

- [ ] **Android OAuth Client ID exists** in Google Cloud Console
- [ ] **Package name matches exactly:** `com.pacematch.app`
- [ ] **SHA-1 matches exactly:** `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`
- [ ] **Waited 5-10 minutes** after creating OAuth Client ID
- [ ] **Rebuilt app** after syncing (`npx cap sync android`)
- [ ] **Running on device/emulator** (not web browser)

---

## 🔍 Debug Steps

### Step 1: Check Logcat

In Android Studio Logcat:
1. Filter by: `Capacitor/Console`
2. Click "Sign in with Google"
3. Look for these messages:

**Good signs:**
```
🔍 Capacitor detection: platform="android", isNative=true
📱 Capacitor native app detected - using native Google Sign-In
🔄 Initializing Google Auth plugin...
✅ Google Auth plugin initialized successfully
🔄 Calling GoogleAuth.signIn()...
```

**Problem signs:**
```
❌ Failed to initialize Google Auth plugin
❌ ERROR CODE FOUND: 10
❌ Configuration error: Check that Android OAuth Client ID...
```

### Step 2: Verify Configuration

**In Google Cloud Console:**
1. Go to: https://console.cloud.google.com/apis/credentials?project=pacematch-gps
2. Find your Android OAuth Client ID
3. Click on it to view details
4. Verify:
   - Application type: **Android** (not Web!)
   - Package name: `com.pacematch.app`
   - SHA-1: `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`

### Step 3: Test Again

1. **Wait 5-10 minutes** (if you just created/updated OAuth Client ID)
2. **Rebuild app:**
   ```bash
   npm run build
   npx cap sync android
   ```
3. **In Android Studio:**
   - Build → Rebuild Project
   - Run the app
   - Test Google Sign-In

---

## 💡 Important Notes

### Capacitor IS Native!

**Capacitor apps ARE native apps:**
- They compile to native Android/iOS code
- They use native plugins (like Google Sign-In)
- They run in a WebView but have full native access
- The `@codetrix-studio/capacitor-google-auth` plugin uses native Android Google Sign-In SDK

**You're not using web-based sign-in** - you're using native Google Sign-In through Capacitor!

### Why It Might Seem Like It's Not Working

1. **Configuration issue** - Android OAuth Client ID not matching
2. **Timing issue** - Need to wait for Google to propagate changes
3. **Build issue** - Need to rebuild after syncing

---

## 🎯 Next Steps

1. **Check Logcat** - Share the exact error message
2. **Verify OAuth Client ID** - Make sure package name and SHA-1 match exactly
3. **Wait and rebuild** - Wait 5-10 minutes, then rebuild
4. **Test again** - Try signing in

**Share the Logcat error message and I can help fix the specific issue!** 🔧

