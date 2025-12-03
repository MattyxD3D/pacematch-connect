# ✅ Android Client ID Configuration

## Where Android OAuth Client ID is Configured

### Location 1: `strings.xml` (Android Native Config)

**File:** `/Applications/q/pacematch-connect/android/app/src/main/res/values/strings.xml`

**Added:**
```xml
<string name="default_web_client_id">891545961086-cs7aq62rgshps172c95ijdcnh2lsej5r.apps.googleusercontent.com</string>
<string name="server_client_id">891545961086-cs7aq62rgshps172c95ijdcnh2lsej5r.apps.googleusercontent.com</string>
```

**Purpose:** These are read by the native Android Google Sign-In SDK.

### Location 2: `capacitor.config.ts` (Capacitor Plugin Config)

**File:** `/Applications/q/pacematch-connect/capacitor.config.ts`

**Already configured:**
```typescript
GoogleAuth: {
  scopes: ['profile', 'email'],
  serverClientId: '891545961086-cs7aq62rgshps172c95ijdcnh2lsej5r.apps.googleusercontent.com',
  forceCodeForRefreshToken: true
}
```

**Purpose:** Used by the Capacitor Google Auth plugin.

### Location 3: Google Cloud Console (Required for Native SDK)

**URL:** https://console.cloud.google.com/apis/credentials?project=pacematch-gps

**What's needed:**
- Android OAuth Client ID (Application type: Android)
- Package name: `com.pacematch.app`
- SHA-1: `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`

**Purpose:** Required by the native Android Google Sign-In SDK.

---

## ✅ What I've Added

I've added the Web Client ID to `strings.xml` in two places:
1. `default_web_client_id` - Standard Android Google Sign-In key
2. `server_client_id` - Alternative key some plugins use

**Both point to your Web Client ID:** `891545961086-cs7aq62rgshps172c95ijdcnh2lsej5r.apps.googleusercontent.com`

---

## ⚠️ Important Note

**The native Android Google Sign-In SDK typically requires:**
- An **Android OAuth Client ID** in Google Cloud Console (not a Web Client ID)
- The Android OAuth Client ID must have:
  - Application type: **Android** (not Web)
  - Package name: `com.pacematch.app`
  - SHA-1: `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`

**However, I've added the Web Client ID to `strings.xml` as you requested.** This might work if the plugin can use it, but the native SDK may still require the Android OAuth Client ID in Google Cloud Console.

---

## 🔄 Next Steps

1. **Rebuild:**
   ```bash
   cd /Applications/q/pacematch-connect
   npm run build
   npx cap sync android
   ```

2. **In Android Studio:**
   - Build → Clean Project
   - Build → Rebuild Project
   - Run → Run 'app'

3. **Test Google Sign-In:**
   - If it works → Great! The Web Client ID in `strings.xml` was sufficient.
   - If Error Code 10 still occurs → You'll still need to create the Android OAuth Client ID in Google Cloud Console.

---

## 📋 Summary

**Web Client ID is now in:**
- ✅ `capacitor.config.ts` → `serverClientId`
- ✅ `strings.xml` → `default_web_client_id`
- ✅ `strings.xml` → `server_client_id`

**Try rebuilding and testing!** If Error Code 10 persists, you'll need to create the Android OAuth Client ID in Google Cloud Console. 🚀

