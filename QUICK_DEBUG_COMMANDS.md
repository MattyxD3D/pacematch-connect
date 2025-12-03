# 🔍 Quick Debug Commands for Google Sign-In Error

## Get the Exact Error

### Method 1: ADB Logcat (Terminal)
```bash
adb logcat | grep -i "google\|sign\|auth\|error\|developer\|capacitor"
```

### Method 2: Filter Specific Error Codes
```bash
adb logcat | grep -E "DEVELOPER_ERROR|12500|10|GoogleSignIn|GmsAuth"
```

### Method 3: See All Errors
```bash
adb logcat *:E
```

---

## Verify SHA-1 (Already Done ✅)
```bash
cd /Applications/q/pacematch-connect/android
./gradlew signingReport | grep SHA1
```

**Your SHA-1:** `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`

---

## Rebuild After Any Changes
```bash
cd /Applications/q/pacematch-connect
npm run build
npx cap sync android
# Then rebuild in Android Studio: Build → Rebuild Project
```

---

## Most Common Issues

### Code 10 (DEVELOPER_ERROR)
- **Cause:** Android OAuth Client ID missing or wrong package name/SHA-1
- **Fix:** Create/update Android OAuth Client ID in Google Cloud Console

### Code 7 (NETWORK_ERROR)
- **Cause:** Internet connection issue
- **Fix:** Check internet connection

### Code 12500 (SIGN_IN_CANCELLED)
- **Cause:** User cancelled (normal)
- **Fix:** Not an error, just try again

---

**Run the ADB logcat command while clicking "Sign in with Google" and share the error!** 🔍

