# ✅ Google OAuth Setup Checklist for Native Sign-In

## 🔑 What You Need to Configure

### ❌ NOT Needed: Firebase Authorized Domains
- You **don't need** to add `com.pacematch.app` to Firebase authorized domains
- Authorized domains are only for **web redirects** (URL-based auth)
- Native Google Sign-In uses a different flow

### ✅ What You DO Need:

## 1. Google Cloud Console - OAuth Client IDs

Go to: https://console.cloud.google.com/apis/credentials?project=pacematch-gps

### For Android:
1. Click **"Create Credentials"** → **"OAuth client ID"** (if not exists)
2. Select **Application type: Android**
3. Enter:
   - **Package name**: `com.pacematch.app`
   - **SHA-1 certificate fingerprint**: (see below to get this)

### For iOS:
1. Click **"Create Credentials"** → **"OAuth client ID"**
2. Select **Application type: iOS**
3. Enter:
   - **Bundle ID**: `com.pacematch.app`

### For Web (Server Client ID):
1. Find or create **Web client** OAuth 2.0 Client ID
2. This is your **Server Client ID**
3. Copy this Client ID
4. Add it to `capacitor.config.ts` (see below)

## 2. Get Android SHA-1 Fingerprint

### For Debug Build (Testing):
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

Look for **SHA1** and copy it.

### For Release Build (Production):
```bash
keytool -list -v -keystore /path/to/your/keystore.jks -alias your-alias
```

## 3. Update capacitor.config.ts

Open `capacitor.config.ts` and add your **Server Client ID**:

```typescript
GoogleAuth: {
  scopes: ['profile', 'email'],
  serverClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // ← Add this
  forceCodeForRefreshToken: true
}
```

**Where to find Server Client ID:**
- Google Cloud Console → Credentials
- Find **Web client (auto created by Firebase)**
- Copy the **Client ID** (looks like: `123456789-abc...xyz.apps.googleusercontent.com`)

## 4. Firebase Console - No Changes Needed!

✅ **Firebase Authorized Domains** - No changes needed
✅ **Firebase Authentication Settings** - No changes needed
✅ **Firebase Redirect URLs** - No changes needed

**Why?** Native Google Sign-In bypasses Firebase's redirect flow. It:
1. Uses Google's native SDK
2. Gets tokens directly
3. Exchanges tokens with Firebase using `signInWithCredential()`

## 📋 Quick Checklist

- [ ] Google Cloud Console → Created Android OAuth Client ID
- [ ] Google Cloud Console → Added Android SHA-1 fingerprint
- [ ] Google Cloud Console → Created iOS OAuth Client ID
- [ ] Google Cloud Console → Found Web Client ID (Server Client ID)
- [ ] Added Server Client ID to `capacitor.config.ts`
- [ ] Rebuilt app: `npm run build && npx cap sync android`
- [ ] Tested native Google Sign-In

## ✅ Summary

**For Native Google Sign-In:**
- ✅ Need OAuth Client IDs in Google Cloud Console (Android, iOS, Web)
- ✅ Need Server Client ID in `capacitor.config.ts`
- ❌ Don't need Firebase Authorized Domains changes
- ❌ Don't need Firebase Redirect URLs changes

**For Web (already working):**
- ✅ Firebase Authorized Domains already configured
- ✅ Web redirect URLs already working

---

**Bottom line:** Configure Google Cloud Console OAuth clients, but **no changes needed in Firebase Authorized Domains** for native apps! 🎉

