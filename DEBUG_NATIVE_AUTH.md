# 🔍 Debug Native Google Sign-In

## When Testing in Android Studio

### Check Console Logs (Logcat)

1. **Open Logcat in Android Studio:**
   - Bottom panel → **Logcat** tab
   - Or: **View** → **Tool Windows** → **Logcat**

2. **Filter by your app:**
   - Select your app package: `com.pacematch.app`
   - Or search for: `pacematch`

3. **Look for these log messages:**

### ✅ Good Signs:
```
🔍 Capacitor platform check: android, isNative: true
📱 Capacitor native app detected - using native Google Sign-In
```

### ❌ Problem Signs:

**If you see:**
```
🔍 Capacitor not detected - running in web browser
```
**Problem:** Capacitor not detected - it's treating it as web

**If you see:**
```
📱 Capacitor native app detected - using native Google Sign-In
❌ Error with native Google Sign-In: [error message]
```
**Problem:** Native auth is being attempted but failing

## Common Errors & Fixes

### Error 1: "Plugin not initialized"
**Fix:** Make sure you rebuilt the app after `npx cap sync`

### Error 2: "No credentials found"
**Fix:** 
- Check `serverClientId` in `capacitor.config.ts`
- Verify it's the Web Client ID (not Android Client ID)

### Error 3: "Sign-in cancelled"
**Fix:** This is normal if user cancels, but if it happens immediately:
- Check Android OAuth Client ID configuration
- Verify package name matches: `com.pacematch.app`
- Verify SHA-1 fingerprint is correct

### Error 4: "INVALID_CLIENT"
**Fix:**
- Android OAuth Client ID not configured correctly
- Package name mismatch
- SHA-1 fingerprint not added

## Quick Test Checklist

- [ ] Rebuilt app in Android Studio (after sync)
- [ ] Running on device/emulator (not web browser)
- [ ] Check Logcat for console messages
- [ ] Verify `isCapacitorNative()` returns `true`
- [ ] Check for error messages in logs

## What to Share if Still Not Working

1. **Logcat output** (filter by your app)
2. **Any error messages** you see
3. **What happens** when you click "Sign in with Google"

---

**Next step:** Rebuild in Android Studio and check Logcat console! 🔍

