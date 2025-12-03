# 🔧 Google Auth Troubleshooting

## Error: "Native Google Sign in Failed"

This usually means the Android OAuth Client ID is not configured correctly.

## ✅ Check These Things:

### 1. Android OAuth Client ID Created?

Go to: https://console.cloud.google.com/apis/credentials?project=pacematch-gps

**Check:**
- [ ] Is there an **Android** OAuth Client ID created?
- [ ] Does it have Package name: `com.pacematch.app`?
- [ ] Does it have the SHA-1 fingerprint: `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`?

**If not, create it:**
1. Click **"Create Credentials"** → **"OAuth client ID"**
2. Select **Application type: Android**
3. Enter:
   - Package name: `com.pacematch.app`
   - SHA-1: `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`
4. Click **Create**

### 2. Check Logcat for Detailed Error

In Android Studio Logcat, look for:
- `❌ Error with native Google Sign-In:`
- `❌ Error details:`

**Common error codes:**
- **Code 10 (DEVELOPER_ERROR)**: Android OAuth Client ID not configured or package name/SHA-1 mismatch
- **INVALID_CLIENT**: Client ID not found or incorrect
- **SIGN_IN_REQUIRED**: Google Sign-In services not enabled

### 3. Verify Configuration

**capacitor.config.ts:**
```typescript
GoogleAuth: {
  serverClientId: '891545961086-cs7aq62rgshps172c95ijdcnh2lsej5r.apps.googleusercontent.com', // ✅ Should be set
  ...
}
```

**Android OAuth Client:**
- Package name: `com.pacematch.app` ✅
- SHA-1: `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD` ✅

### 4. Rebuild After Configuration

After creating/updating Android OAuth Client:
```bash
npm run build
npx cap sync android
# Then rebuild in Android Studio
```

## 🔍 Next Steps

1. **Check Logcat** - Share the detailed error message
2. **Verify Android OAuth Client** - Make sure it exists and has correct package name/SHA-1
3. **Rebuild app** - Sync and rebuild after any configuration changes

---

**Share the Logcat error details and I can help fix the specific issue!** 🔧

