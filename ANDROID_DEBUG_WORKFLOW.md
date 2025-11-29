# Android Studio Debug Workflow

This guide explains the step-by-step workflow for developing and debugging your PaceMatch app with Android Studio.

## 🔄 Development Workflow

### The Basic Cycle

```
1. Make changes in Cursor (your code editor)
   ↓
2. Build the web app: npm run build
   ↓
3. Sync to Android: npx cap sync android
   ↓
4. Run/Debug in Android Studio
   ↓
5. Test and see results
   ↓
6. Repeat from step 1
```

## 📝 Step-by-Step Instructions

### Step 1: Make Your Changes

Edit your code in Cursor:
- React components (`src/pages/`, `src/components/`)
- Hooks (`src/hooks/`)
- Services (`src/services/`)
- Any TypeScript/JavaScript files

**Example:** Edit `src/pages/Index.tsx` to fix a bug or add a feature.

### Step 2: Build the Web App

```bash
cd /Applications/q/pacematch-connect
npm run build
```

**What this does:**
- Compiles your TypeScript/React code
- Bundles everything into the `dist/` folder
- Creates production-ready web assets

**Time:** Usually 5-15 seconds

### Step 3: Sync to Android

```bash
npx cap sync android
```

**What this does:**
- Copies files from `dist/` to Android project
- Updates native dependencies
- Ensures Android project has latest code

**Time:** Usually 2-5 seconds

### Step 4: Open/Run in Android Studio

**Option A: Open from terminal**
```bash
npx cap open android
```

**Option B: Open manually**
- Open Android Studio
- File > Open > Navigate to `/Applications/q/pacematch-connect/android`

### Step 5: Run or Debug

**To Run (without debugging):**
1. Click the green ▶️ Run button
2. Or press `Shift + F10`
3. Select your device/emulator

**To Debug (with breakpoints):**
1. Set breakpoints in your code (click left margin in Android Studio)
2. Click the 🐛 Debug button
3. Or press `Shift + F9`
4. Select your device/emulator

## 🐛 Debugging Setup

### Setting Breakpoints

**In Android Studio:**
- Open the file you want to debug
- Click in the left margin (gutter) to set a breakpoint
- Red dot appears = breakpoint set

**Note:** Breakpoints work in:
- Your React/TypeScript code (if source maps are enabled)
- Native Android code (Java/Kotlin)
- Capacitor plugin code

### Viewing Logs

**Method 1: Logcat (Recommended)**
1. In Android Studio, open **Logcat** tab (bottom panel)
2. Filter by your app: Select "PaceMatch" from dropdown
3. See console.log() output and errors

**Method 2: Chrome DevTools (For Web Code)**
1. Run app on device/emulator
2. In Chrome, go to `chrome://inspect`
3. Find your device and click "inspect"
4. Full browser DevTools with React DevTools!

**Method 3: Terminal (adb logcat)**
```bash
adb logcat | grep -i pacematch
```

### Debugging Tips

1. **Use console.log()** - Shows in Logcat
   ```typescript
   console.log('User location:', location);
   ```

2. **Use React DevTools** - Install Chrome extension
   - Inspect component state
   - See props and hooks

3. **Use Network Tab** - In Chrome DevTools
   - See Firebase requests
   - Check API calls

4. **Check Native Logs** - In Logcat
   - See Capacitor plugin errors
   - View permission issues

## ⚡ Faster Development (Live Reload)

For faster iteration, you can use live reload:

### Setup Live Reload

1. **Start dev server:**
   ```bash
   npm run dev
   ```
   This starts Vite dev server on `http://localhost:8080`

2. **Find your local IP:**
   ```bash
   # Mac/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Or check network settings
   # Look for something like: 192.168.1.100
   ```

3. **Update capacitor.config.ts:**
   ```typescript
   server: {
     url: 'http://192.168.1.100:8080', // Your local IP
     cleartext: true
   }
   ```

4. **Sync:**
   ```bash
   npx cap sync android
   ```

5. **Run in Android Studio** - Changes reload automatically!

**Note:** Make sure your phone/emulator is on the same WiFi network as your computer.

## 🎯 Common Workflows

### Workflow 1: Quick Fix (Fastest)

```bash
# Make change in Cursor
npm run build && npx cap sync android
# Then click Run in Android Studio (no need to close it)
```

**Time:** ~10-15 seconds

### Workflow 2: With Live Reload (Best for UI Changes)

```bash
# Start dev server once
npm run dev

# Make changes in Cursor
# Changes appear automatically in app!
# (No rebuild needed)
```

**Time:** Instant (after initial setup)

### Workflow 3: Full Debug Session

```bash
# Make changes
npm run build
npx cap sync android

# In Android Studio:
# 1. Set breakpoints
# 2. Click Debug button
# 3. Step through code
# 4. Inspect variables
```

## 📱 Testing on Device vs Emulator

### Using Emulator (Recommended for Development)

**Pros:**
- Fast iteration
- Easy to reset
- Multiple screen sizes
- No physical device needed

**Setup:**
1. Android Studio > Tools > Device Manager
2. Create Virtual Device
3. Select device (e.g., Pixel 6)
4. Download system image
5. Start emulator

### Using Real Device (Recommended for Final Testing)

**Pros:**
- Real GPS (important for your app!)
- Real performance
- Real user experience
- Test actual permissions

**Setup:**
1. Enable Developer Options on phone
   - Settings > About Phone > Tap "Build Number" 7 times
2. Enable USB Debugging
   - Settings > Developer Options > USB Debugging
3. Connect via USB
4. Allow debugging on phone popup
5. Select device in Android Studio

## 🔍 What to Debug

### Location Issues
- Check Logcat for permission errors
- Verify location is updating in Firebase
- Test with real device (emulator GPS is limited)

### Firebase Connection
- Check network tab in Chrome DevTools
- Look for CORS errors
- Verify Firebase config

### UI Issues
- Use React DevTools
- Check component state
- Inspect CSS/styles

### Native Plugin Issues
- Check Logcat for Capacitor errors
- Verify permissions in AndroidManifest.xml
- Test permissions in device settings

## 🛠️ Troubleshooting

### "App not updating after sync"

**Solution:**
1. Close Android Studio completely
2. Run `npx cap sync android` again
3. Reopen Android Studio
4. Clean build: Build > Clean Project
5. Rebuild: Build > Rebuild Project

### "Breakpoints not working"

**Solution:**
1. Make sure you're in Debug mode (🐛), not Run mode (▶️)
2. Check source maps are enabled (they should be by default)
3. Try setting breakpoint in native code first to test

### "Changes not appearing"

**Solution:**
1. Make sure you ran `npm run build`
2. Make sure you ran `npx cap sync android`
3. Try uninstalling app from device and reinstalling
4. Or use live reload (see above)

### "Can't connect to device"

**Solution:**
```bash
# Check if device is connected
adb devices

# If device shows as "unauthorized"
# - Check phone for "Allow USB debugging" popup
# - Click "Always allow from this computer"
```

## 📋 Quick Command Reference

```bash
# Build web app
npm run build

# Sync to Android
npx cap sync android

# Open Android Studio
npx cap open android

# Start dev server (for live reload)
npm run dev

# Check connected devices
adb devices

# View logs
adb logcat | grep -i pacematch

# Uninstall app from device
adb uninstall com.pacematch.app

# Install APK directly
adb install path/to/app.apk
```

## ✅ Checklist for Each Debug Session

- [ ] Made changes in Cursor
- [ ] Ran `npm run build`
- [ ] Ran `npx cap sync android`
- [ ] Opened Android Studio (or it's already open)
- [ ] Selected device/emulator
- [ ] Set breakpoints (if debugging)
- [ ] Clicked Run/Debug
- [ ] Checked Logcat for errors
- [ ] Tested the feature
- [ ] Fixed any issues
- [ ] Repeat!

## 🎓 Pro Tips

1. **Keep Android Studio open** - No need to close/reopen each time
2. **Use multiple monitors** - Cursor on one, Android Studio on other
3. **Use emulator for quick tests** - Real device for final testing
4. **Check Logcat first** - Most errors show up there
5. **Use Chrome DevTools** - Better for React debugging than Android Studio
6. **Save time with live reload** - For UI changes, use dev server

---

**Remember:** The workflow is: **Edit → Build → Sync → Run → Test → Repeat**

Happy debugging! 🐛

