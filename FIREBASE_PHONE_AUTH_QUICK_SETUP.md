# 📱 Firebase Phone Auth - Quick Setup Checklist

## ✅ Enable in Firebase Console (5 minutes)

1. **Go to Firebase Console:**
   - https://console.firebase.google.com/
   - Select project: **pacematch-gps**

2. **Enable Phone Authentication:**
   - Navigate to: **Authentication** → **Sign-in method**
   - Click on **Phone** provider
   - Toggle **Enable** ON
   - Click **Save**

3. **Enable Billing (Required for Production SMS):**
   - Navigate to: **Project Settings** → **Usage and billing**
   - Click **Upgrade project**
   - Select **Blaze Plan** (pay-as-you-go)
   - Complete billing setup
   - ⏰ **Wait 15-30 minutes** for billing to activate

## ✅ Verify Code Implementation

The phone authentication code is **already implemented** in your app:

- ✅ `src/services/authService.ts` - Phone auth functions
- ✅ `src/pages/LoginScreen.tsx` - Phone login UI
- ✅ Firebase config already set up

**You don't need to change any code!**

## ✅ Test Setup

### Development Testing (Test Mode):

1. **Add Test Phone Number:**
   - Firebase Console → **Authentication** → **Settings** → **Phone numbers for testing**
   - Add: `+639123456789` with code: `123456`
   - SMS won't be sent - use test code

2. **Test in App:**
   - Click "Continue with Phone Number"
   - Enter test phone number
   - Use test verification code

### Production Testing:

1. **Remove Test Numbers:**
   - Firebase Console → Remove all test phone numbers
   - This enables production mode

2. **Test Real Phone:**
   - Use your real phone number (e.g., `+639123456789`)
   - SMS will be sent to your phone
   - Enter code from SMS

## ⚠️ Common Issues

| Issue | Solution |
|-------|----------|
| "Billing not enabled" | Enable Blaze Plan, wait 15-30 min |
| SMS not arriving | Check billing status, wait for propagation |
| "Invalid app credentials" | Verify Firebase config matches project |
| reCAPTCHA not loading | Enable Phone Auth in Firebase Console |

## 📋 Final Checklist

- [ ] Phone Authentication enabled in Firebase Console
- [ ] Blaze Plan (billing) enabled
- [ ] Waited 15-30 minutes after enabling billing
- [ ] Test phone numbers configured (dev) OR removed (production)
- [ ] Tested phone login in app
- [ ] Real SMS received (production mode)

## 🎯 Phone Login is Now Available!

After completing the above:
- ✅ Phone login button appears in LoginScreen
- ✅ Users can sign in with phone number + SMS code
- ✅ Works on web, iOS, and Android (Capacitor)

**That's it! Phone authentication is ready to use as a backup login method.**

---

**Need more details?** See `FIREBASE_PHONE_AUTH_SETUP.md` for complete guide.

