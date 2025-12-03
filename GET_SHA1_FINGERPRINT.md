# 🔑 How to Get SHA-1 Fingerprint in Android Studio

## Method 1: Using Gradle Task (Easiest) ✅

### Steps:

1. **Open Android Studio** with your project

2. **Open the Gradle panel:**
   - Click **View** → **Tool Windows** → **Gradle**
   - Or click the **Gradle** icon on the right side

3. **Navigate to the signing report:**
   ```
   android
     └── Tasks
       └── android
         └── signingReport
   ```

4. **Double-click `signingReport`**

5. **Check the Run panel at the bottom:**
   - Look for output like:
   ```
   Variant: debug
   Config: debug
   Store: ~/.android/debug.keystore
   Alias: AndroidDebugKey
   SHA1: AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12
   Valid until: ...
   ```

6. **Copy the SHA1** value (the long string of letters/numbers with colons)

---

## Method 2: Using Terminal in Android Studio

### Steps:

1. **Open Terminal in Android Studio:**
   - Click **View** → **Tool Windows** → **Terminal**
   - Or click the **Terminal** tab at the bottom

2. **Run this command:**
   ```bash
   cd android
   ./gradlew signingReport
   ```

3. **Look for the output:**
   - Find `SHA1:` in the output
   - Copy the SHA1 fingerprint

---

## Method 3: Using Keytool Command (Manual)

### For Debug Keystore (Testing):

1. **Open Terminal** (in Android Studio or your system terminal)

2. **Run this command:**
   ```bash
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```

3. **Look for SHA1** in the output:
   ```
   Certificate fingerprints:
        SHA1: AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12
        SHA256: ...
   ```

4. **Copy the SHA1** value

---

## Method 4: Using Android Studio's Built-in Task

### Steps:

1. **Open Terminal in Android Studio**

2. **Navigate to your project:**
   ```bash
   cd /Applications/q/pacematch-connect/android
   ```

3. **Run:**
   ```bash
   ./gradlew signingReport
   ```

4. **Or use the full path:**
   ```bash
   cd /Applications/q/pacematch-connect
   cd android
   ./gradlew signingReport
   ```

---

## 📋 What You'll See

The output will look something like this:

```
Variant: debug
Config: debug
Store: /Users/yourname/.android/debug.keystore
Alias: AndroidDebugKey
MD5: 12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF
SHA1: AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12
SHA-256: 12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78
Valid until: ...
```

**Copy the SHA1 value** (the one with colons between each pair of characters)

---

## 🔍 Quick Visual Guide

### In Android Studio:

1. **Gradle Panel** (Right side) →
2. **android** →
3. **Tasks** →
4. **android** →
5. **signingReport** (Double-click) →
6. **Check Run panel** for SHA1

### Or Terminal:

```bash
cd android
./gradlew signingReport
```

---

## ✅ After Getting SHA-1

1. **Copy the SHA-1 fingerprint**
2. **Go to Google Cloud Console**
3. **Edit your Android OAuth Client ID**
4. **Paste the SHA-1** in the "SHA-1 certificate fingerprint" field
5. **Save**

---

## 🎯 Pro Tip

If you're testing with multiple devices/builds, you might need:
- **Debug SHA-1** (for testing)
- **Release SHA-1** (for production builds)

The method above gets the **Debug SHA-1** which is what you need for testing!

---

## ⚠️ Common Issues

**Issue:** "Command not found: gradlew"
- **Solution:** Make sure you're in the `android` folder
- Or use the full path: `./android/gradlew signingReport`

**Issue:** "Permission denied"
- **Solution:** Make gradlew executable:
  ```bash
  chmod +x android/gradlew
  ```

---

**Method 1 (Gradle panel) is usually the easiest!** 🚀

