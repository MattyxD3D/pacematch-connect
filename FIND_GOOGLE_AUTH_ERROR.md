# 🔍 How to Find Google Sign-In Error in Logcat

## Filter Logcat to See Your App's Logs

### Method 1: Filter by Package Name

1. **Open Logcat** in Android Studio (bottom panel)
2. **In the search/filter box**, type:
   ```
   package:com.pacematch.app
   ```
3. **Or try:**
   ```
   tag:CapacitorJS OR tag:Console OR tag:JS
   ```

### Method 2: Filter by Our Log Messages

In Logcat search box, type:
```
📱 OR 🔄 OR ❌ OR 🔍 OR Capacitor
```

This will show our console.log messages.

### Method 3: Filter by Error Level

1. Click the log level dropdown (left side)
2. Select **Error** or **Warning**
3. Look for red error messages

## What to Look For

Look for these specific log messages:

```
🔍 Capacitor detection: platform="android", isNative=true
📱 Capacitor native app detected - using native Google Sign-In
🔄 Initializing Google Auth plugin...
❌ Error with native Google Sign-In:
❌ Error details:
```

## Alternative: Use Chrome DevTools

If the app is running, you can also check the JavaScript console:

1. **Connect your device via USB**
2. **Open Chrome** on your computer
3. **Go to:** `chrome://inspect`
4. **Find your app** in the list
5. **Click "inspect"**
6. **Check Console tab** for JavaScript errors

## Quick Check: Is Android OAuth Client Created?

Before debugging further, verify:

1. Go to: https://console.cloud.google.com/apis/credentials?project=pacematch-gps
2. Look for **Android** OAuth Client ID
3. Check if it has:
   - Package name: `com.pacematch.app`
   - SHA-1: `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`

**If it doesn't exist, that's the problem!** Create it first.

---

**Try filtering Logcat with those filters and share what you find!** 🔍

