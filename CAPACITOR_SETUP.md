# Capacitor Setup Guide

## Quick Setup (Optional - for parallel testing)

### Step 1: Install Capacitor

```bash
cd pacematch-connect
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android
```

### Step 2: Initialize Capacitor

```bash
npx cap init
```

When prompted:
- **App name**: PaceMatch
- **App ID**: com.pacematch.app (or your preferred bundle ID)
- **Web dir**: dist

### Step 3: Add Platforms

```bash
# For iOS
npx cap add ios

# For Android
npx cap add android
```

### Step 4: Build and Sync

```bash
# Build your app
npm run build

# Sync with Capacitor
npx cap sync
```

### Step 5: Open in Native IDE

```bash
# iOS (requires Mac)
npx cap open ios

# Android
npx cap open android
```

## ⚠️ Important Notes

1. **Development Workflow:**
   - Make changes in your web code
   - Run `npm run build`
   - Run `npx cap sync` to copy to native projects
   - Test in native IDE or device

2. **Hot Reload:**
   - Capacitor doesn't have hot reload like web
   - You need to rebuild and sync after changes
   - Consider using `npm run dev` for web, then build when ready to test native

3. **Parallel Testing:**
   - Keep web version running: `npm run dev`
   - Build for native when needed: `npm run build && npx cap sync`
   - Test web features first, then native

## 🎯 Recommended Approach

### Phase 1: Web Development (Current)
- ✅ Develop and debug on web
- ✅ Test in mobile browser
- ✅ Fix all web issues

### Phase 2: Add Capacitor (When Ready)
- ✅ Add Capacitor when web is stable
- ✅ Test native features
- ✅ Optimize for mobile

## 📱 Testing Without Capacitor

You can test mobile features right now:

1. **Deploy to Firebase:**
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

2. **Open on Phone:**
   - Visit: `https://pacematch-gps.web.app`
   - Test all features
   - Check mobile UX

3. **Debug:**
   - Use Chrome DevTools remote debugging
   - Connect phone via USB
   - Inspect and debug on real device

## 🔄 Development Workflow

### Option A: Web-First (Recommended)
```
1. Develop on web (npm run dev)
2. Test in browser
3. Deploy to Firebase
4. Test on mobile browser
5. Add Capacitor later when needed
```

### Option B: Parallel Development
```
1. Develop on web (npm run dev)
2. Build for native (npm run build && npx cap sync)
3. Test in native app
4. Fix issues in web
5. Repeat
```

## ✅ Current Status

- ✅ Web app is ready
- ✅ Mobile browser testing works
- ✅ Auth works in mobile browsers
- ⏳ Capacitor setup is optional

**You can test everything on mobile right now without Capacitor!**

