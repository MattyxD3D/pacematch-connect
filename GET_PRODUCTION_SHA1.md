# 🔑 Get Production SHA-1 Fingerprint

## ✅ Your Package Name
**Confirmed:** `com.pacematch.app`

---

## Step 1: Create Release Keystore (If You Don't Have One)

You need a release keystore to sign production builds. If you already have one, skip to Step 2.

### Option A: Using Android Studio (Easiest)

1. **Open Android Studio:**
   ```bash
   cd /Applications/q/pacematch-connect
   npx cap open android
   ```

2. **Go to:** Build → Generate Signed Bundle / APK

3. **Select:** APK (not Android App Bundle)

4. **Click:** "Create new..." to create a keystore

5. **Fill in:**
   - **Key store path:** `android/app/pacematch-release-key.jks`
   - **Password:** Create a strong password (SAVE THIS!)
   - **Key alias:** `pacematch-key`
   - **Key password:** Can be same as keystore password
   - **Validity:** 25 years (recommended)
   - **Certificate info:** Your name, organization, etc.

6. **Click OK**

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

### Method 1: Using Keytool (Recommended)

```bash
keytool -list -v -keystore /Applications/q/pacematch-connect/android/app/pacematch-release-key.jks -alias pacematch-key
```

**Enter your keystore password when prompted.**

Look for:
```
Certificate fingerprints:
     SHA1: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
     SHA256: ...
```

**Copy the SHA1 value** - this is your production SHA-1!

### Method 2: Using Gradle (After Configuring Keystore)

First, configure the keystore in `build.gradle` (see Step 3), then:

```bash
cd /Applications/q/pacematch-connect/android
./gradlew signingReport
```

Look for the **release** variant SHA-1.

---

## Step 3: Configure Keystore in build.gradle (Optional)

If you want Gradle to automatically use your keystore for release builds:

1. **Create `android/key.properties`:**
   ```properties
   storePassword=YOUR_KEYSTORE_PASSWORD
   keyPassword=YOUR_KEY_PASSWORD
   keyAlias=pacematch-key
   storeFile=../app/pacematch-release-key.jks
   ```

2. **Update `android/app/build.gradle`:**
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

## Step 4: Add Production SHA-1 to Google Cloud Console

1. **Go to:** https://console.cloud.google.com/apis/credentials?project=pacematch-gps

2. **Click:** "Create Credentials" → "OAuth client ID"

3. **Select:** Application type: **Android**

4. **Enter:**
   - **Name:** `PaceMatch Android (Production)`
   - **Package name:** `com.pacematch.app`
   - **SHA-1 certificate fingerprint:** `YOUR_PRODUCTION_SHA1_HERE` (from Step 2)

5. **Click:** "Create"

6. **Wait 5-10 minutes** for Google to propagate

---

## 📋 Summary

**Package Name:** `com.pacematch.app` ✅

**To Get Production SHA-1:**
1. Create release keystore (if you don't have one)
2. Run: `keytool -list -v -keystore path/to/keystore.jks -alias your-alias`
3. Copy the SHA1 value
4. Add to Google Cloud Console

**You'll have TWO Android OAuth Client IDs:**
- Debug: SHA-1 `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`
- Production: SHA-1 (your production SHA-1 from keystore)

Both use the same package name: `com.pacematch.app`

---

## ⚠️ Important Notes

1. **Backup Your Keystore!**
   - If you lose it, you CANNOT update your app on Google Play Store
   - Save it securely (encrypted cloud storage, password manager)
   - Never commit it to Git (already in `.gitignore`)

2. **Keep Your Password Safe!**
   - You'll need it for every release build
   - Store it in a password manager

3. **Same Package Name, Different SHA-1s**
   - Both OAuth Client IDs use `com.pacematch.app`
   - Google distinguishes them by SHA-1 fingerprint

---

**Need help? Let me know if you want me to help you create the keystore or get the SHA-1!** 🚀

