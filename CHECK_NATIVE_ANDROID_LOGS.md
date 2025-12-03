# 🔍 Check Native Android Logs for Real Error

The JavaScript error "Something went wrong" is generic. The **real error** is probably in the **native Android logs**.

## Method 1: Filter for Google Sign-In Errors

In **Android Studio Logcat**, filter by:

```
GoogleSignIn|GmsAuth|DEVELOPER_ERROR|12500|10
```

Look for errors that mention:
- `DEVELOPER_ERROR`
- `GoogleSignInAccount`
- `Status{statusCode=`
- Error codes like `10`, `7`, `12500`

## Method 2: Check for Auth Errors

Filter by:

```
tag:AndroidRuntime OR tag:GmsAuth OR tag:GoogleSignIn
```

## Method 3: Use ADB Command

In terminal, run:

```bash
adb logcat | grep -i "google\|sign\|auth\|error\|developer"
```

---

## Most Likely Issue: Android OAuth Client ID Not Created

**The error "Something went wrong" with code appearing after sign-in UI usually means:**

**The Android OAuth Client ID is NOT configured in Google Cloud Console.**

### ✅ Verify This First:

1. **Go to:** https://console.cloud.google.com/apis/credentials?project=pacematch-gps
2. **Look for Android OAuth Client ID:**
   - Application type: **Android**
   - Package name: `com.pacematch.app`
   - SHA-1: `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`

**If it doesn't exist, CREATE IT:**
1. Click **"Create Credentials"** → **"OAuth client ID"**
2. Select **"Android"**
3. Enter:
   - Package name: `com.pacematch.app`
   - SHA-1: `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`
4. Click **Create**
5. **Wait 5-10 minutes** for propagation
6. **Rebuild and test again**

---

## What Error Codes Mean

- **Code 10 (DEVELOPER_ERROR)**: Android OAuth Client ID missing/wrong
- **Code 7 (NETWORK_ERROR)**: Internet connection issue
- **Code 12500 (SIGN_IN_CANCELLED)**: User cancelled (normal)

**Share the native Android logs after filtering!** 🔍

