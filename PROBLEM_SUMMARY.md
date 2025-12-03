# 🔍 Problem Summary: Capacitor Google Sign-In Error

## The Problem

**Error Message:**
```
❌ Configuration error: Check that Android OAuth Client ID is created in Google Cloud Console 
   with correct package name (com.pacematch.app) and SHA-1 fingerprint.
```

**Error Code:** Code 10 (DEVELOPER_ERROR)

**When it happens:** When clicking "Sign in with Google" in a Capacitor Android app

---

## Technical Details

### App Setup
- **Framework:** Capacitor.js (Ionic/React)
- **Platform:** Android
- **Package Name:** `com.pacematch.app`
- **Google Auth Plugin:** `@codetrix-studio/capacitor-google-auth`
- **Firebase:** Used for authentication backend

### Current Configuration

**capacitor.config.ts:**
```typescript
GoogleAuth: {
  scopes: ['profile', 'email'],
  serverClientId: '891545961086-cs7aq62rgshps172c95ijdcnh2lsej5r.apps.googleusercontent.com',
  forceCodeForRefreshToken: true
}
```

**Debug SHA-1 Fingerprint:**
```
81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD
```

### What's Working
- ✅ Web Client ID configured in `capacitor.config.ts`
- ✅ Google Auth plugin installed and initialized
- ✅ Native Google Sign-In UI appears (AccountPickerActivity shows)
- ✅ App detects Capacitor native environment correctly

### What's NOT Working
- ❌ **Android OAuth Client ID is missing** in Google Cloud Console
- ❌ Google Sign-In fails after user selects account
- ❌ Error Code 10 (DEVELOPER_ERROR) is thrown

---

## Root Cause

The app is using **native Google Sign-In** via Capacitor plugin, which requires:
1. ✅ **Web/Server Client ID** - Already configured in `capacitor.config.ts`
2. ❌ **Android OAuth Client ID** - **MISSING** in Google Cloud Console

**Why both are needed:**
- **Web Client ID** (`serverClientId`): Used by Firebase to verify the Google token
- **Android OAuth Client ID**: Required by Google Sign-In SDK to authenticate on Android

**The Android OAuth Client ID must have:**
- Application type: **Android** (not Web)
- Package name: `com.pacematch.app`
- SHA-1 certificate fingerprint: `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`

---

## Error Flow

1. User clicks "Sign in with Google"
2. App detects Capacitor native environment
3. Google Auth plugin initializes successfully
4. Native Google Sign-In UI appears (AccountPickerActivity)
5. User selects Google account
6. **Error occurs:** Code 10 (DEVELOPER_ERROR)
7. Error message: "Configuration error: Check that Android OAuth Client ID is created..."

**Logcat Error:**
```
2025-12-01 23:49:44.368  Capacitor/Console  E  ❌ Configuration error: Check that Android OAuth Client ID is created in Google Cloud Console with correct package name (com.pacematch.app) and SHA-1 fingerprint.
```

---

## Solution Required

### Step 1: Create Android OAuth Client ID in Google Cloud Console

**URL:** https://console.cloud.google.com/apis/credentials?project=pacematch-gps

**Steps:**
1. Click "Create Credentials" → "OAuth client ID"
2. Select **Application type: Android** (NOT Web!)
3. Enter:
   - **Name:** `PaceMatch Android` (or any name)
   - **Package name:** `com.pacematch.app` (exact match, lowercase)
   - **SHA-1 certificate fingerprint:** `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`
4. Click "Create"
5. **Wait 5-10 minutes** for Google to propagate the change

### Step 2: Rebuild App

```bash
cd /Applications/q/pacematch-connect
npm run build
npx cap sync android
```

Then in Android Studio:
- Build → Rebuild Project
- Run the app
- Test Google Sign-In

---

## What Should Exist in Google Cloud Console

**Required OAuth Client IDs:**

1. ✅ **Web application** (for `serverClientId`)
   - Client ID: `891545961086-cs7aq62rgshps172c95ijdcnh2lsej5r.apps.googleusercontent.com`
   - Status: ✅ Already exists

2. ❌ **Android application** (for native Google Sign-In)
   - Package name: `com.pacematch.app`
   - SHA-1: `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`
   - Status: ❌ **MISSING** - This is the problem!

---

## Code Context

**File:** `src/services/authService.ts`

**Relevant Code:**
```typescript
// Detects Capacitor native environment
if (isCapacitorNative()) {
  // Initialize Google Auth plugin
  await GoogleAuth.initialize();
  
  // Sign in with native Google Auth
  result = await GoogleAuth.signIn();
  
  // Error handling
  if (error.code === 10 || error.message?.includes('DEVELOPER_ERROR')) {
    errorMessage = "Configuration error: Check that Android OAuth Client ID is created...";
  }
}
```

**Error Detection:**
- Error Code 10 = DEVELOPER_ERROR
- Means Android OAuth Client ID not found or misconfigured

---

## Key Points for Troubleshooting

1. **Two OAuth Client IDs needed:**
   - Web Client ID (for Firebase) ✅
   - Android OAuth Client ID (for native sign-in) ❌

2. **Common mistakes:**
   - Creating "Web application" instead of "Android application"
   - Wrong package name (case-sensitive, must be exact)
   - Wrong SHA-1 fingerprint
   - Testing too soon (need to wait 5-10 minutes for propagation)

3. **Verification:**
   - Check Google Cloud Console for Android OAuth Client ID
   - Verify package name matches exactly: `com.pacematch.app`
   - Verify SHA-1 matches exactly: `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`

---

## Expected Behavior After Fix

1. User clicks "Sign in with Google"
2. Native Google Sign-In UI appears
3. User selects account
4. ✅ **Sign-in succeeds** (no error)
5. User is authenticated with Firebase
6. App proceeds normally

---

## Additional Notes

- **Debug vs Production:** Can have separate Android OAuth Client IDs for debug and production builds (different SHA-1s)
- **SHA-1 Source:** Debug SHA-1 comes from `~/.android/debug.keystore` (automatic)
- **Plugin:** Using `@codetrix-studio/capacitor-google-auth` for native Google Sign-In

---

**Status:** Waiting for Android OAuth Client ID to be created in Google Cloud Console.

