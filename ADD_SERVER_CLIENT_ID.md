# 🔑 How to Add Server Client ID

## Quick Steps

1. **Get Server Client ID:**
   - Go to: https://console.cloud.google.com/apis/credentials?project=pacematch-gps
   - Find **Web client** OAuth 2.0 Client ID
   - Copy the **Client ID** (looks like: `891545961086-xxxxx.apps.googleusercontent.com`)

2. **Add to capacitor.config.ts:**
   - Open `capacitor.config.ts`
   - Find line 70: `serverClientId: ''`
   - Paste your Web Client ID between the quotes

3. **Rebuild:**
   ```bash
   npm run build
   npx cap sync android
   ```

4. **Test in Android Studio!**

## Example

**Before:**
```typescript
serverClientId: '', // Empty!
```

**After:**
```typescript
serverClientId: '891545961086-xxxxx.apps.googleusercontent.com', // Your Web Client ID
```

## ⚠️ Important

The **Server Client ID** is the **Web client** ID, NOT the Android client ID!

---

**Once you add this and rebuild, Google Sign-In should work!** 🚀

