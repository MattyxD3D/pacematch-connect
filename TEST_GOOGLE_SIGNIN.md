# 🧪 Test Google Sign-In on Android

## ✅ Pre-Test Checklist

Before testing, make sure:
- [x] ✅ Package name: `com.pacematch.app`
- [x] ✅ Android OAuth Client ID created in Google Cloud Console
- [x] ✅ SHA-1 fingerprint added to Android OAuth Client ID
- [x] ✅ Web app built (`npm run build`)
- [x] ✅ Synced to Android (`npx cap sync android`)

---

## 🚀 Testing Steps

### Step 1: Open Android Studio

```bash
cd /Applications/q/pacematch-connect
npx cap open android
```

**Or manually:**
- Open Android Studio
- File → Open → `/Applications/q/pacematch-connect/android`

### Step 2: Wait for Gradle Sync

- Look for "Gradle sync..." in bottom status bar
- Wait until it says "Gradle sync finished"
- **Time:** 10-30 seconds (usually)

### Step 3: Select Your Device

**Option A: USB Device**
1. Connect your Android phone via USB
2. Enable USB Debugging:
   - Settings → About Phone → Tap "Build Number" 7 times
   - Settings → Developer Options → Enable "USB Debugging"
3. In Android Studio, click device dropdown (top toolbar)
4. Select your connected device

**Option B: Emulator**
1. Click device dropdown (top toolbar)
2. Select an emulator (or create one: Tools → Device Manager)

### Step 4: Rebuild Project

**Important:** Always rebuild after syncing!

1. Click **Build** → **Rebuild Project**
   - Or press: `Cmd + Shift + F9` (Mac) / `Ctrl + Shift + F9` (Windows)

2. Wait for build to finish
   - Check bottom status bar: "Build completed successfully"

### Step 5: Run the App

1. Click the **green ▶️ Run** button (top toolbar)
   - Or press: `Ctrl + R` (Mac) / `Shift + F10` (Windows)

2. Wait for installation
   - Android Studio installs the app on your device
   - App launches automatically

### Step 6: Test Google Sign-In

1. **When app opens**, you should see the login screen
2. **Click "Continue with Google"** button
3. **Expected behavior:**
   - ✅ Native Google Sign-In UI appears (AccountPickerActivity)
   - ✅ You can select your Google account
   - ✅ Sign-in completes successfully
   - ✅ You're redirected to the app

---

## ✅ Success Indicators

**If Google Sign-In works:**
- ✅ Google account picker appears
- ✅ You can select an account
- ✅ Sign-in completes without errors
- ✅ You're logged in and redirected

**If it doesn't work, you'll see:**
- ❌ Error: "Configuration error: Check that Android OAuth Client ID..."
- ❌ Error: "DEVELOPER_ERROR (Code 10)"
- ❌ Sign-in UI appears but fails after selecting account

---

## 🔍 Debugging

### Check Logcat for Errors

In Android Studio:
1. Open **Logcat** (bottom panel)
2. Filter by: `GoogleSignIn|GmsAuth|DEVELOPER_ERROR|Capacitor/Console`
3. Look for error messages

### Common Issues

**Error Code 10 (DEVELOPER_ERROR):**
- Android OAuth Client ID not configured correctly
- Check package name matches exactly: `com.pacematch.app`
- Check SHA-1 matches your keystore
- Wait 5-10 minutes after creating OAuth Client ID

**"Permission denied":**
- Function not deployed (if using Firebase Functions)
- Check Firebase Console → Functions

**Sign-in UI doesn't appear:**
- Check if Google Sign-In plugin is installed
- Rebuild the app

---

## 📝 What to Test

1. **Sign-In Flow:**
   - Click "Continue with Google"
   - Select account
   - Verify sign-in succeeds

2. **After Sign-In:**
   - Check if user is redirected correctly
   - Verify user data is saved
   - Check if profile setup appears (if new user)

3. **Sign-Out and Sign-In Again:**
   - Sign out
   - Sign in again with Google
   - Should work smoothly

---

## 🎯 Expected Results

**For Debug Build:**
- Uses debug SHA-1: `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`
- Should work if Debug Android OAuth Client ID is configured

**For Release Build:**
- Uses production SHA-1 (from your release keystore)
- Should work if Production Android OAuth Client ID is configured

---

## 🐛 If It Doesn't Work

1. **Check Google Cloud Console:**
   - Go to: https://console.cloud.google.com/apis/credentials?project=pacematch-gps
   - Verify Android OAuth Client ID exists
   - Check package name: `com.pacematch.app`
   - Check SHA-1 matches your keystore

2. **Check Logcat:**
   - Filter for errors
   - Look for specific error codes
   - Share error message for help

3. **Wait for Propagation:**
   - After creating/updating OAuth Client ID, wait 5-10 minutes
   - Google needs time to propagate changes

4. **Rebuild:**
   - Clean project: Build → Clean Project
   - Rebuild: Build → Rebuild Project
   - Run again

---

**Ready to test! Follow the steps above and let me know what happens!** 🚀

