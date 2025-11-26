# Android Keystore Guide

## What is a Keystore?

A **keystore** is a secure file that contains a private key used to digitally sign your Android app. Think of it like a signature that proves the app is yours.

### Why You Need It

1. **Security**: Android uses the signature to verify your app hasn't been tampered with
2. **Updates**: Android only allows updates from apps with the same signature
3. **Distribution**: Required for Google Play Store or sharing your app with others

## Debug vs Release APKs

### Debug APK (No Keystore Needed) ✅
- **For**: Testing on your own device
- **Signed by**: Android automatically (debug key)
- **File size**: Larger (includes debug info)
- **Location**: `android/app/build/outputs/apk/debug/app-debug.apk`
- **When to use**: During development and testing

### Release APK (Keystore Required) 🔐
- **For**: Distribution, production, Google Play Store
- **Signed by**: Your own keystore
- **File size**: Smaller, optimized
- **Location**: `android/app/build/outputs/apk/release/app-release.apk`
- **When to use**: When sharing with others or publishing

## Can You Use Keystore for Testing?

**Yes, but you don't need to!** 

- **For testing**: Use debug APKs (no keystore needed) ✅
- **For production**: Use release APKs (keystore required) 🔐

## Creating a Keystore

### Option 1: Using Android Studio (Easiest)

1. Open your project in Android Studio:
   ```bash
   npm run open:android
   ```

2. Go to: **Build → Generate Signed Bundle / APK**

3. Select **APK** (not Android App Bundle)

4. Click **Create new...** to create a keystore

5. Fill in the form:
   - **Key store path**: Choose where to save it (e.g., `android/app/pacematch-release-key.jks`)
   - **Password**: Create a strong password (SAVE THIS!)
   - **Key alias**: Something like `pacematch-key`
   - **Key password**: Can be same as keystore password
   - **Validity**: 25 years (recommended)
   - **Certificate info**: Fill in your details

6. Click **OK**

7. Select your keystore and enter passwords

8. Click **Next**

9. Select **release** build variant

10. Click **Finish**

11. Your signed APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

### Option 2: Using Command Line

```bash
cd pacematch-connect/android/app

keytool -genkey -v -keystore pacematch-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias pacematch-key
```

You'll be prompted for:
- Password (SAVE THIS!)
- Your name, organization, etc.

## ⚠️ IMPORTANT: Backup Your Keystore!

**If you lose your keystore, you CANNOT update your app!**

1. **Save the keystore file** (`pacematch-release-key.jks`) in a safe place
2. **Save the password** in a password manager
3. **Backup both** to cloud storage (encrypted)
4. **Never commit** the keystore to Git (it's already in `.gitignore`)

## Using Keystore for Future Builds

Once you have a keystore, you can configure Android Studio to use it automatically:

1. Create `android/key.properties` file:
   ```properties
   storePassword=YOUR_KEYSTORE_PASSWORD
   keyPassword=YOUR_KEY_PASSWORD
   keyAlias=pacematch-key
   storeFile=../app/pacematch-release-key.jks
   ```

2. Add to `android/app/build.gradle`:
   ```gradle
   def keystorePropertiesFile = rootProject.file("key.properties")
   def keystoreProperties = new Properties()
   if (keystorePropertiesFile.exists()) {
       keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
   }

   android {
       // ... existing config ...
       signingConfigs {
           release {
               keyAlias keystoreProperties['keyAlias']
               keyPassword keystoreProperties['keyPassword']
               storeFile file(keystoreProperties['storeFile'])
               storePassword keystoreProperties['storePassword']
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
               // ... existing config ...
           }
       }
   }
   ```

3. **Add `key.properties` to `.gitignore`** (never commit passwords!)

## Quick Reference

### For Testing (No Keystore)
```bash
npm run build:android
npm run open:android
# In Android Studio: Build → Build APK(s)
# Result: app-debug.apk (no signing needed)
```

### For Production (With Keystore)
```bash
npm run build:android
npm run open:android
# In Android Studio: Build → Generate Signed Bundle / APK
# Select your keystore
# Result: app-release.apk (signed with your keystore)
```

## Summary

- **Testing**: Use debug APKs (no keystore) ✅
- **Production**: Use release APKs (keystore required) 🔐
- **Keystore**: Create once, use forever, BACKUP IT! 💾
- **Password**: Save it securely, you'll need it for every release build

