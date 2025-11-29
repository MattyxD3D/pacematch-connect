# Capacitor App Updates Guide

## Current Setup

Your Capacitor app is currently configured to use **local bundled files**, which means:
- The web app is packaged inside the APK/IPA
- Updates require rebuilding and releasing a new version
- Users must download and install the new APK/IPA

## Two Options for Updates

### Option 1: Local Files (Current Setup) ❌ Manual Updates

**How it works:**
- Web app is bundled inside the APK/IPA
- Changes require rebuilding the app
- Users must install a new version

**When to use:**
- App Store/Play Store distribution
- Offline-first apps
- Apps that need to work without internet

**To update:**
1. Make your code changes
2. Build: `npm run build`
3. Sync: `npx cap sync`
4. Rebuild APK/IPA in Android Studio/Xcode
5. Release new version to users

### Option 2: Remote Server URL ✅ Automatic Updates

**How it works:**
- App loads from Firebase Hosting URL
- Updates deploy automatically when you deploy to Firebase
- Users get updates instantly (on next app open)

**When to use:**
- Direct APK distribution (not through stores)
- Frequent updates
- Want instant updates without app store approval

**To enable:**

1. **Update `capacitor.config.ts`:**
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pacematch.app',
  appName: 'PaceMatch',
  webDir: 'dist',
  server: {
    // Point to your Firebase hosting URL
    url: 'https://pacematch-gps.web.app',
    cleartext: true // Only needed for HTTP (not HTTPS)
  },
  // ... rest of config
};
```

2. **Rebuild and sync:**
```bash
npm run build
npx cap sync
```

3. **Rebuild APK/IPA** (one time):
- Open in Android Studio/Xcode
- Build new APK/IPA
- Distribute to users

4. **Future updates:**
```bash
# Just deploy to Firebase - users get updates automatically!
npm run build
firebase deploy --only hosting
```

## Recommendation

**For your use case (direct APK distribution):**

✅ **Use Option 2 (Remote Server URL)** because:
- You can update the app instantly without rebuilding
- Users get updates automatically
- Easier maintenance
- Faster iteration

**Steps to switch:**

1. Uncomment the server URL in `capacitor.config.ts`
2. Rebuild the APK once
3. Distribute the new APK
4. Future updates: Just deploy to Firebase!

## Important Notes

### Security
- ✅ Firebase Hosting uses HTTPS (secure)
- ✅ No security concerns with remote loading

### Offline Support
- ⚠️ App requires internet connection to load
- ✅ Once loaded, Firebase services work offline (cached data)

### Performance
- ✅ First load: Downloads from server (like a website)
- ✅ Subsequent loads: Uses cache (fast)
- ✅ Similar to Progressive Web App (PWA)

### Testing
- Test with remote URL first: `npm run dev` then visit on phone
- Once working, enable in Capacitor config
- Rebuild APK and test

## Hybrid Approach (Advanced)

You can also use a **hybrid approach**:
- Development: Use remote URL for testing
- Production: Bundle locally for app stores

Just comment/uncomment the `server.url` as needed!

## Summary

**Current:** Updates require rebuilding APK ❌

**Recommended:** Enable remote URL for automatic updates ✅

**To enable:**
1. Uncomment `server.url` in `capacitor.config.ts`
2. Rebuild APK once
3. Future updates: Just deploy to Firebase!

