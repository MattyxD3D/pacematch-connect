# 🚀 Build and Test in Android Studio

## Step 1: Open Android Studio

### Option A: Using Terminal (Easiest)
```bash
cd /Applications/q/pacematch-connect
npx cap open android
```

This will automatically open Android Studio with your Android project.

### Option B: Manually Open
1. Open **Android Studio**
2. Click **"Open"** or **"File" → "Open"**
3. Navigate to: `/Applications/q/pacematch-connect/android`
4. Click **"OK"**

---

## Step 2: Wait for Gradle Sync

Android Studio will automatically sync Gradle (download dependencies, etc.)

**Look for:**
- Bottom status bar showing "Gradle sync..." or "Indexing..."
- Wait until it says "Gradle sync finished" or "Project indexed"

**Time:** 1-5 minutes (first time), 10-30 seconds (subsequent times)

---

## Step 3: Select Your Device

### For USB Device:
1. Connect your Android phone via USB
2. Enable **USB Debugging** on your phone:
   - Settings → About Phone → Tap "Build Number" 7 times
   - Settings → Developer Options → Enable "USB Debugging"
3. In Android Studio, click the device dropdown (top toolbar)
4. Select your connected device

### For Emulator:
1. Click the device dropdown (top toolbar)
2. Select an emulator (or create one: Tools → Device Manager → Create Device)

---

## Step 4: Rebuild Project

**Important:** Always rebuild after `npx cap sync`:

1. Click **"Build"** menu → **"Rebuild Project"**
   - Or press: `Cmd + Shift + F9` (Mac) or `Ctrl + Shift + F9` (Windows/Linux)

**Wait for build to finish:**
- Check bottom status bar: "Build completed successfully"

---

## Step 5: Run the App

1. Click the **green ▶️ Run** button (top toolbar)
   - Or press: `Shift + F10` (Windows/Linux) or `Ctrl + R` (Mac)

2. **Wait for installation:**
   - Android Studio will install the app on your device/emulator
   - The app will launch automatically

---

## Step 6: Test Google Sign-In

1. When the app opens, click **"Sign in with Google"**
2. You should see the native Google Sign-In UI
3. Select your Google account
4. It should sign in successfully! ✅

---

## Quick Command Reference

```bash
# Sync Capacitor
npm run build
npx cap sync android

# Open Android Studio
npx cap open android

# Then in Android Studio:
# 1. Build → Rebuild Project
# 2. Click Run ▶️
```

---

## Troubleshooting

### "Gradle sync failed"
- Check internet connection
- Try: File → Invalidate Caches → Restart

### "Device not found"
- Check USB connection
- Enable USB Debugging on phone
- Try: Run → Run → Select device

### "Build failed"
- Check error messages in bottom panel
- Try: Build → Clean Project, then Rebuild

---

**After rebuild, test Google Sign-In!** 🎉

