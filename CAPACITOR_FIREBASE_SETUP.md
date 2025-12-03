# 🔧 Capacitor Firebase Auth Setup

## Issue: Browser Opens with "localhost" URL

When using Google Sign-In in Capacitor, the redirect URL needs to be configured correctly in Firebase Console.

## ✅ Solution: Configure Firebase Redirect URLs

### Step 1: Go to Firebase Console

1. Open: https://console.firebase.google.com/project/pacematch-gps/authentication/providers
2. Click on **Google** provider
3. Scroll down to **Authorized domains**

### Step 2: Add Authorized Domains

Add these domains:

**For Android:**
- `com.pacematch.app` (your app's package name)

**For iOS:**
- `com.pacematch.app` (your bundle identifier)

**For Web:**
- `pacematch-gps.web.app` (already added)
- `pacematch-gps.firebaseapp.com` (already added)

### Step 3: Configure OAuth Redirect URIs

1. Go to **Google Cloud Console**: https://console.cloud.google.com/
2. Select project: `pacematch-gps`
3. Go to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID (Web client)
5. Click **Edit**
6. Under **Authorized redirect URIs**, add:
   - `pacematch://` (for iOS)
   - `com.pacematch.app://` (for Android - if needed)
   - `https://pacematch-gps.web.app` (for web)

### Step 4: Rebuild and Test

```bash
cd /Applications/q/pacematch-connect
npm run build
npx cap sync android
# Then rebuild in Android Studio
```

## 🔄 Alternative: Use In-App Browser (Better UX)

Instead of system browser, we can use Capacitor Browser plugin for in-app OAuth.

### Current Status

The app currently uses `signInWithRedirect()` which opens the system browser. This is expected behavior for Capacitor, but it's not ideal UX.

### Better Solution: Native Google Sign-In Plugin

For the best experience, consider using the native Google Sign-In plugin:

```bash
npm install @codetrix-studio/capacitor-google-auth
npx cap sync
```

**Benefits:**
- ✅ Native Google Sign-In UI (no browser)
- ✅ Better performance
- ✅ Stays in-app (no redirect)
- ✅ Works offline

## 📝 Current Behavior (Expected)

When you click "Sign in with Google" in Capacitor:

1. **System browser opens** (this is expected with `signInWithRedirect()`)
2. **User signs in** with Google
3. **Redirects back to app** using deep link (`pacematch://`)
4. **App handles result** and logs user in

The "localhost" in the URL is likely because:
- Firebase hasn't been configured with the app's redirect URI
- Or the deep link isn't handling correctly

## 🔍 Verify Configuration

Check if these are configured:

1. **Firebase Console** → Authentication → Settings → Authorized domains
2. **Google Cloud Console** → Credentials → OAuth 2.0 → Authorized redirect URIs
3. **AndroidManifest.xml** has intent filter for deep links
4. **Info.plist** (iOS) has URL scheme configured

## ✅ Quick Test

After configuring Firebase:

1. Rebuild app: `npm run build && npx cap sync android`
2. Run in Android Studio
3. Click "Sign in with Google"
4. Should redirect to Google (not localhost)
5. After sign-in, should redirect back to app

---

**Need help?** The redirect URL configuration in Firebase/Google Cloud Console is the key to fixing the "localhost" issue.

