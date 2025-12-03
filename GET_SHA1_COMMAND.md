# 🔑 Get SHA-1 Fingerprint Command

## For Debug Build (Testing) ✅

This is what you need for testing on emulator/USB device:

```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

**What this does:**
- `~/.android/debug.keystore` - Path to debug keystore (default for all debug builds)
- `-alias androiddebugkey` - Default alias for debug keystore
- `-storepass android` - Default password (always "android" for debug)
- `-keypass android` - Default key password (always "android" for debug)

---

## What You'll See

The output will show:
```
Certificate fingerprints:
     SHA1: 81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD
     SHA256: ...
```

**Copy the SHA1 value** (the long string with colons)

---

## Run It Now

Just copy and paste this command:

```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

---

## Alternative: Using Gradle (Easier)

If the keytool command doesn't work, use Gradle:

```bash
cd /Applications/q/pacematch-connect/android
./gradlew signingReport
```

Look for `SHA1:` in the output.

---

## Expected SHA-1

Your SHA-1 should be:
```
81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD
```

If you get a different SHA-1, that's also fine - just use whatever you get from the command!

