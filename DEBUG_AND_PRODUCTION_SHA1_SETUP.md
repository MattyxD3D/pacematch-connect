# 🔑 Debug vs Production SHA-1 Setup

## Yes! You Can Have Both! ✅

You can (and should) set up **TWO** Android OAuth Client IDs in Google Cloud Console:
1. **Debug SHA-1** - For testing during development
2. **Production SHA-1** - For release builds and production

**Both use the same package name** (`com.pacematch.app`) but **different SHA-1 fingerprints**.

---

## Current Setup

### ✅ Debug SHA-1 (Already Configured)
- **SHA-1:** `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`
- **Keystore:** `~/.android/debug.keystore` (automatic, no setup needed)
- **Used for:** Testing, development, emulator, USB debugging
- **Status:** ⚠️ Need to create Android OAuth Client ID with this SHA-1

### ⚠️ Production SHA-1 (Not Set Up Yet)
- **SHA-1:** (Will be different - you'll get it after creating release keystore)
- **Keystore:** Your custom release keystore (you need to create this)
- **Used for:** Production builds, Google Play Store, distribution
- **Status:** Need to create release keystore first

---

## Step 1: Create Release Keystore (For Production)

### Option A: Using Android Studio (Easiest)

1. Open Android Studio:
   ```bash
   cd /Applications/q/pacematch-connect
   npx cap open android
   ```

2. Go to: **Build** → **Generate Signed Bundle / APK**

3. Select **APK** (not Android App Bundle)

4. Click **"Create new..."** to create a keystore

5. Fill in:
   - **Key store path:** `android/app/pacematch-release-key.jks`
   - **Password:** Create a strong password (SAVE THIS!)
   - **Key alias:** `pacematch-key`
   - **Key password:** Can be same as keystore password
   - **Validity:** 25 years (recommended)
   - **Certificate info:** Your name, organization, etc.

6. Click **OK**

7. **IMPORTANT:** Save the keystore file and password securely!

### Option B: Using Command Line

```bash
cd /Applications/q/pacematch-connect/android/app

keytool -genkey -v -keystore pacematch-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias pacematch-key
```

You'll be prompted for:
- Password (SAVE THIS!)
- Your name, organization, etc.

---

## Step 2: Get Production SHA-1

After creating your release keystore, get its SHA-1:

### Method 1: Using Gradle (After Configuring Keystore)

```bash
cd /Applications/q/pacematch-connect/android
./gradlew signingReport
```

Look for the **release** variant SHA-1 (different from debug).

### Method 2: Using Keytool

```bash
keytool -list -v -keystore android/app/pacematch-release-key.jks -alias pacematch-key
```

Enter your keystore password when prompted, then look for **SHA1:** in the output.

**Example output:**
```
Certificate fingerprints:
     SHA1: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
     SHA256: ...
```

**Copy the SHA1 value** (this is your production SHA-1)

---

## Step 3: Configure Release Keystore in build.gradle

Add signing configuration to `android/app/build.gradle`:

1. Create `android/key.properties` file:
   ```properties
   storePassword=YOUR_KEYSTORE_PASSWORD
   keyPassword=YOUR_KEY_PASSWORD
   keyAlias=pacematch-key
   storeFile=../app/pacematch-release-key.jks
   ```

2. Update `android/app/build.gradle`:
   ```gradle
   // Add at the top, after other def statements
   def keystorePropertiesFile = rootProject.file("key.properties")
   def keystoreProperties = new Properties()
   if (keystorePropertiesFile.exists()) {
       keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
   }

   android {
       // ... existing config ...
       
       signingConfigs {
           release {
               if (keystorePropertiesFile.exists()) {
                   keyAlias keystoreProperties['keyAlias']
                   keyPassword keystoreProperties['keyPassword']
                   storeFile file(keystoreProperties['storeFile'])
                   storePassword keystoreProperties['storePassword']
               }
           }
       }
       
       buildTypes {
           release {
               if (keystorePropertiesFile.exists()) {
                   signingConfig signingConfigs.release
               }
               minifyEnabled false
               proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
           }
       }
   }
   ```

3. **Add `key.properties` to `.gitignore`** (never commit passwords!)

---

## Step 4: Create Android OAuth Client IDs in Google Cloud Console

Go to: https://console.cloud.google.com/apis/credentials?project=pacematch-gps

### Create Debug OAuth Client ID

1. Click **"Create Credentials"** → **"OAuth client ID"**
2. Select **Application type: Android**
3. Enter:
   - **Name:** `PaceMatch Android (Debug)`
   - **Package name:** `com.pacematch.app`
   - **SHA-1:** `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`
4. Click **"Create"**

### Create Production OAuth Client ID

1. Click **"Create Credentials"** → **"OAuth client ID"** (again)
2. Select **Application type: Android**
3. Enter:
   - **Name:** `PaceMatch Android (Production)`
   - **Package name:** `com.pacematch.app` (same as debug!)
   - **SHA-1:** `XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX` (your production SHA-1 from Step 2)
4. Click **"Create"**

---

## What You'll Have

After setup, you'll have **TWO** Android OAuth Client IDs:

1. ✅ **PaceMatch Android (Debug)**
   - Package: `com.pacematch.app`
   - SHA-1: `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`
   - Used for: Testing, development

2. ✅ **PaceMatch Android (Production)**
   - Package: `com.pacematch.app` (same!)
   - SHA-1: `XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX` (different!)
   - Used for: Production builds, Google Play Store

**Both work with the same package name!** Google matches based on package name + SHA-1 combination.

---

## When Each Is Used

### Debug Build (Uses Debug SHA-1)
- Running from Android Studio
- Testing on emulator
- Testing via USB debugging
- Building debug APK

### Release Build (Uses Production SHA-1)
- Building release APK
- Publishing to Google Play Store
- Distributing to users
- Production deployments

---

## Quick Reference

### Get Debug SHA-1
```bash
cd /Applications/q/pacematch-connect/android
./gradlew signingReport | grep "Variant: debug" -A 5
```

### Get Production SHA-1 (After Creating Keystore)
```bash
keytool -list -v -keystore android/app/pacematch-release-key.jks -alias pacematch-key
```

### Verify Both in Google Cloud Console
- Go to: https://console.cloud.google.com/apis/credentials?project=pacematch-gps
- You should see TWO Android OAuth Client IDs
- Both have package name: `com.pacematch.app`
- Different SHA-1 fingerprints

---

## ⚠️ Important Notes

1. **Backup Your Release Keystore!**
   - If you lose it, you CANNOT update your app on Google Play Store
   - Save it securely (encrypted cloud storage, password manager)
   - Never commit it to Git (already in `.gitignore`)

2. **Wait for Propagation**
   - After creating OAuth Client IDs, wait 5-10 minutes
   - Google needs time to propagate the changes

3. **Same Package Name**
   - Both OAuth Client IDs use the same package name
   - Google distinguishes them by SHA-1 fingerprint

---

## Summary

✅ **Yes, you can have both!**
- Debug SHA-1 for testing
- Production SHA-1 for release builds
- Both in Google Cloud Console
- Same package name, different SHA-1s

**Right now, you need to:**
1. Create the **Debug** Android OAuth Client ID (for current testing)
2. Later, create release keystore and **Production** Android OAuth Client ID (for production)

**Start with the Debug one first!** 🚀

