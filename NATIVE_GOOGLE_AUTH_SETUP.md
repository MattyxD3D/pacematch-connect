# 🔐 Native Google Sign-In Setup Guide

## ✅ What's Been Done

Native Google Sign-In has been integrated for Capacitor apps! This provides a much better user experience:

- ✅ **No browser opens** - Native Google Sign-In UI appears in-app
- ✅ **Stays in app** - No redirects or external browsers
- ✅ **Better UX** - Native iOS/Android Google Sign-In experience
- ✅ **Faster** - No page redirects or browser loading

## 🔧 Setup Required

### Step 1: Get Google OAuth Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `pacematch-gps`
3. Go to **APIs & Services** → **Credentials**
4. Find or create an **OAuth 2.0 Client ID**
5. For Android:
   - Application type: **Android**
   - Package name: `com.pacematch.app`
   - SHA-1 certificate fingerprint: (Get this from your keystore - see below)
6. For iOS:
   - Application type: **iOS**
   - Bundle ID: `com.pacematch.app`

### Step 2: Get Android SHA-1 Fingerprint

```bash
# For debug keystore (default)
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# For release keystore (production)
keytool -list -v -keystore /path/to/your/keystore.jks -alias your-alias
```

Copy the **SHA1** fingerprint and add it to your Android OAuth client.

### Step 3: Update capacitor.config.ts

1. Open `capacitor.config.ts`
2. Find the `GoogleAuth` plugin config
3. Add your **Server Client ID** (Web client ID from Google Cloud Console):

```typescript
GoogleAuth: {
  scopes: ['profile', 'email'],
  serverClientId: 'YOUR_WEB_CLIENT_ID_HERE.apps.googleusercontent.com', // ← Add this
  forceCodeForRefreshToken: true
}
```

**Where to find Server Client ID:**
- Google Cloud Console → Credentials
- Find your **Web client** OAuth 2.0 Client ID
- Copy the Client ID

### Step 4: Rebuild and Test

```bash
cd /Applications/q/pacematch-connect
npm run build
npx cap sync android
# Or for iOS:
npx cap sync ios
```

Then rebuild in Android Studio/Xcode.

## 🎯 How It Works

### Capacitor Native Apps:
1. User clicks "Sign in with Google"
2. **Native Google Sign-In UI appears** (no browser!)
3. User selects account and signs in
4. App receives Google tokens
5. Tokens are exchanged for Firebase credentials
6. User is signed in to Firebase

### Web Browsers:
- Still uses popup (desktop) or redirect (mobile browser)
- Native Google Sign-In is only for Capacitor apps

## ✅ Testing

1. **Build app** in Android Studio/Xcode
2. **Run on device or emulator**
3. **Click "Sign in with Google"**
4. **Verify:** Native Google Sign-In UI appears (not browser)
5. **Sign in** and verify you're logged in

## 🔍 Troubleshooting

### Issue: "Error initializing Google Auth"
**Solution:** Make sure you've added the OAuth Client IDs in Google Cloud Console

### Issue: "Sign-in cancelled"
**Solution:** Normal if user cancels. The app should handle this gracefully.

### Issue: "No credentials found"
**Solution:** Make sure `serverClientId` is set in `capacitor.config.ts`

### Issue: Still opens browser
**Solution:** 
- Make sure you're testing on a real device/emulator (not web browser)
- Check that `isCapacitorNative()` returns `true`
- Verify the plugin is synced: `npx cap sync`

## 📝 Notes

- **Server Client ID** is different from the Android/iOS Client IDs
- The Server Client ID should be your **Web client** ID from Google Cloud Console
- This allows Firebase to verify the Google token

## ✅ Benefits

- ✅ Native UI (no browser)
- ✅ Better UX
- ✅ Faster sign-in
- ✅ Works offline (after first sign-in)
- ✅ Automatic token refresh

---

**After setup, test the native Google Sign-In!** 🚀

