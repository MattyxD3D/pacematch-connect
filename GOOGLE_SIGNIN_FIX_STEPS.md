# 🔧 Google Sign-In Fix Steps

## ✅ What I Just Did

I've updated your `capacitor.config.ts` with your OAuth Client ID:
- **New Server Client ID:** `891545961086-6liagtt1h0n5op2m0iv4tsg06eashha3.apps.googleusercontent.com`

---

## 📋 Complete Setup Checklist

For native Google Sign-In to work, you need **TWO** OAuth Client IDs:

### 1. ✅ Server Client ID (Web Client) - DONE!
- **Status:** ✅ Updated in `capacitor.config.ts`
- **Client ID:** `891545961086-6liagtt1h0n5op2m0iv4tsg06eashha3.apps.googleusercontent.com`
- **Purpose:** Allows Firebase to verify Google tokens

### 2. ⚠️ Android OAuth Client ID - Check This!

You also need an **Android** OAuth Client ID configured in Google Cloud Console.

**Check if you have it:**
1. Go to: https://console.cloud.google.com/apis/credentials?project=pacematch-gps
2. Look for an OAuth Client ID with:
   - **Application type:** Android
   - **Package name:** `com.pacematch.app`
   - **SHA-1:** Your SHA-1 fingerprint

**If you DON'T have it, create it:**
1. Click **"Create Credentials"** → **"OAuth client ID"**
2. Select **Application type: Android**
3. Enter:
   - **Package name:** `com.pacematch.app`
   - **SHA-1 certificate fingerprint:** Get this from your keystore (see below)

---

## 🔑 Get Your SHA-1 Fingerprint

### For Debug Build (Testing):

```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

Look for **SHA1:** and copy it (should look like: `81:55:30:46:0C:B0:FC:A5:...`)

### For Release Build (Production):

```bash
keytool -list -v -keystore /path/to/your/keystore.jks -alias your-alias
```

---

## 🔄 Next Steps

### Step 1: Verify Android OAuth Client ID

1. Go to: https://console.cloud.google.com/apis/credentials?project=pacematch-gps
2. Check if Android OAuth Client ID exists
3. If not, create it (see above)

### Step 2: Rebuild Your App

After updating configuration:

```bash
cd /Applications/q/pacematch-connect
npm run build
npx cap sync android
```

### Step 3: Rebuild in Android Studio

1. Open Android Studio
2. Rebuild your app
3. Run on device/emulator
4. Test Google Sign-In!

---

## 🔍 Verify Your Setup

### ✅ What Should Be Configured:

1. **Google Cloud Console:**
   - ✅ Web Client ID (Server Client ID) - Already have this!
   - ⚠️ Android OAuth Client ID - Need to verify/create

2. **capacitor.config.ts:**
   - ✅ serverClientId updated with your client ID
   - ✅ GoogleAuth plugin configured

3. **Android OAuth Client:**
   - ⚠️ Package name: `com.pacematch.app`
   - ⚠️ SHA-1 fingerprint: Your actual SHA-1

---

## 🎯 Quick Checklist

- [x] Server Client ID updated in `capacitor.config.ts`
- [ ] Android OAuth Client ID exists in Google Cloud Console
- [ ] Android OAuth Client has correct package name: `com.pacematch.app`
- [ ] Android OAuth Client has correct SHA-1 fingerprint
- [ ] Run `npm run build && npx cap sync android`
- [ ] Rebuild app in Android Studio
- [ ] Test Google Sign-In on device/emulator

---

## 🚨 Common Issues

### Issue: "DEVELOPER_ERROR (Code 10)"
**Cause:** Android OAuth Client ID not configured or wrong package name/SHA-1
**Fix:** Create/update Android OAuth Client ID in Google Cloud Console

### Issue: "INVALID_CLIENT"
**Cause:** Wrong client ID or missing configuration
**Fix:** Verify both Web Client ID and Android OAuth Client ID are correct

### Issue: Sign-in works but then fails
**Cause:** Server Client ID mismatch
**Fix:** Already fixed! We updated it to your client ID.

---

## 📝 Summary

**What I did:**
- ✅ Updated `capacitor.config.ts` with your Server Client ID

**What you need to do:**
1. ✅ Verify/create Android OAuth Client ID in Google Cloud Console
2. ✅ Make sure it has correct package name and SHA-1
3. ✅ Rebuild app (`npm run build && npx cap sync android`)
4. ✅ Test!

---

## 🎉 After Setup

Once everything is configured:
- Native Google Sign-In will work on Android/iOS
- No browser redirects
- Better user experience!

**Let me know if you need help with any step!** 🚀

