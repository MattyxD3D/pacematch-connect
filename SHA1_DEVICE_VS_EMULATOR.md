# 🔑 SHA-1 Fingerprint: Device vs Emulator

## Short Answer: **YES, Same SHA-1!** ✅

The SHA-1 fingerprint is **the same** for:
- ✅ Physical Android device (USB connected)
- ✅ Android emulator
- ✅ Any device running the same build

**Why?** The SHA-1 depends on the **keystore used to sign the app**, NOT on the device.

---

## How SHA-1 Works

### Debug Builds (Testing)
When you build in **debug mode** (default for testing):
- **All devices use the same debug keystore**: `~/.android/debug.keystore`
- **Same keystore = Same SHA-1**
- Works on: emulator, USB device, any device with debug APK

**SHA-1 for debug builds:** `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`

### Release Builds (Production)
When you build in **release mode**:
- Uses **your custom release keystore**
- **Different keystore = Different SHA-1**
- You'll need to add this SHA-1 separately to Google Cloud Console

---

## Important Notes

### ✅ Same SHA-1 If:
- Both using **debug builds** (default in Android Studio)
- Built on the **same computer** (same debug keystore)
- Any device type (emulator, physical device, etc.)

### ⚠️ Different SHA-1 If:
- **Different computers**: Each computer has its own debug keystore
- **Debug vs Release**: Different keystores = different SHA-1s
- **Release build with custom keystore**: Different SHA-1

---

## How to Verify SHA-1

### Option 1: Gradle Task (Recommended)
```bash
cd /Applications/q/pacematch-connect/android
./gradlew signingReport
```

Look for:
```
Variant: debug
SHA1: 81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD
```

### Option 2: Keytool Command
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

---

## For Google OAuth Configuration

**You only need ONE Android OAuth Client ID** for testing:
- Package name: `com.pacematch.app`
- SHA-1: `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`

This works for:
- ✅ Emulator
- ✅ Physical device (USB)
- ✅ Any device with debug build

**Note:** If you switch computers, you'll get a different SHA-1 and need to add it to Google Cloud Console.

---

## Summary

| Build Type | Device Type | SHA-1 |
|------------|-------------|-------|
| Debug | Emulator | Same ✅ |
| Debug | USB Device | Same ✅ |
| Debug | Any Device | Same ✅ |
| Release | Any Device | Different (custom keystore) |

**Bottom line:** For testing, one SHA-1 works for all devices! 🎉

