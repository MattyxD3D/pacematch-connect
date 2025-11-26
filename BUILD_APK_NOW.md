# Build Your First APK - Quick Guide

## ✅ Your app is ready! Now build the APK in Android Studio

### Step 1: Wait for Android Studio to Open
- Android Studio should be opening now
- Wait for it to fully load and sync Gradle (this may take 2-5 minutes the first time)

### Step 2: Fix Java Version (if needed)
If you see a Java version error:
1. Android Studio will show a notification
2. Click "Sync Project with Gradle Files" or "Fix"
3. It will automatically configure the correct Java version

### Step 3: Build the Debug APK

**Option A: Using the Menu (Easiest)**
1. Click **Build** in the top menu
2. Select **Build Bundle(s) / APK(s)**
3. Select **Build APK(s)**
4. Wait for the build to complete (1-3 minutes)

**Option B: Using the Build Button**
1. Look for the green hammer icon (🔨) in the toolbar
2. Click it to build the project

### Step 4: Find Your APK
Once the build completes:
1. Android Studio will show a notification: "APK(s) generated successfully"
2. Click **locate** in the notification, OR
3. Navigate to: `android/app/build/outputs/apk/debug/app-debug.apk`

### Step 5: Install on Your Android Device

**Method 1: Transfer via USB**
1. Connect your Android device to your computer via USB
2. Enable "USB Debugging" in Developer Options on your phone
3. Copy `app-debug.apk` to your phone
4. On your phone, tap the APK file to install
5. Allow "Install from Unknown Sources" if prompted

**Method 2: Transfer via Cloud/Email**
1. Upload `app-debug.apk` to Google Drive, Dropbox, or email it to yourself
2. Download it on your Android device
3. Tap the APK file to install
4. Allow "Install from Unknown Sources" if prompted

**Method 3: Using ADB (if you have it set up)**
```bash
cd /Applications/PaceMatch_GPS/pacematch-connect
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## 📱 What to Expect

- **File size**: ~15-30 MB (debug APKs are larger)
- **Installation**: Takes 30-60 seconds
- **First launch**: May take a few seconds to load
- **Permissions**: Your app will ask for location permission (as expected)

## ✅ Success Checklist

- [ ] Android Studio opened successfully
- [ ] Gradle sync completed (no errors)
- [ ] APK built successfully
- [ ] APK file found at `android/app/build/outputs/apk/debug/app-debug.apk`
- [ ] APK installed on your device
- [ ] App launches and works!

## 🐛 Troubleshooting

### "Gradle sync failed"
- Wait a bit longer (first sync takes time)
- Click "Sync Project with Gradle Files" again
- Check internet connection (Gradle downloads dependencies)

### "Java version error"
- Android Studio should auto-fix this
- If not, go to: **File → Project Structure → SDK Location**
- Make sure Java/JDK is set correctly

### "Build failed"
- Check the "Build" tab at the bottom for error messages
- Most common: Missing dependencies (Gradle will download them)

### "APK not found"
- Make sure build completed successfully
- Check: `android/app/build/outputs/apk/debug/`
- Try building again: **Build → Build APK(s)**

## 🎉 You're Done!

Once the APK is installed, you can test your app on a real Android device!

**Remember**: This is a **debug APK** - perfect for testing. When you're ready to share or publish, you'll need to create a **release APK** with a keystore (see `KEYSTORE_GUIDE.md`).

