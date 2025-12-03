# 📧 Firebase Email Verification Setup

## ✅ What's Been Done

1. ✅ **Removed Google Sign-In** - Only email/password authentication now
2. ✅ **Created Firebase Cloud Functions** - Secure email sending via Firebase
3. ✅ **Updated email service** - Now uses Firebase Cloud Functions first
4. ✅ **Email verification flow** - Already working, just needs email service setup

---

## 🚀 Quick Setup (Choose One Option)

### Option 1: Gmail (Easiest for Testing) ⭐

**Best for:** Development and testing

**Steps:**

1. **Get Gmail App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Sign in with your Gmail account
   - Click "Select app" → "Mail"
   - Click "Select device" → "Other (Custom name)"
   - Enter "Firebase Functions" → Click "Generate"
   - **Copy the 16-character password** (you'll need this)

2. **Set Environment Variables:**
   ```bash
   cd /Applications/q/pacematch-connect/functions
   firebase functions:config:set gmail.user="your-email@gmail.com" gmail.app_password="your-16-char-app-password"
   ```

3. **Deploy Functions:**
   ```bash
   cd /Applications/q/pacematch-connect
   cd functions
   npm install
   cd ..
   firebase deploy --only functions
   ```

**Done!** Emails will now be sent via Gmail.

---

### Option 2: SendGrid (Production Ready)

**Best for:** Production apps

**Steps:**

1. **Sign up for SendGrid:**
   - Go to: https://sendgrid.com/
   - Create free account (100 emails/day free)
   - Get API key from Settings → API Keys

2. **Set Environment Variable:**
   ```bash
   cd /Applications/q/pacematch-connect/functions
   firebase functions:config:set sendgrid.api_key="your-sendgrid-api-key"
   ```

3. **Deploy Functions:**
   ```bash
   cd /Applications/q/pacematch-connect
   cd functions
   npm install
   cd ..
   firebase deploy --only functions
   ```

---

### Option 3: Custom SMTP

**Best for:** Using your own email server

**Steps:**

1. **Set Environment Variables:**
   ```bash
   cd /Applications/q/pacematch-connect/functions
   firebase functions:config:set smtp.host="smtp.yourdomain.com" smtp.port="587" smtp.user="your-email@yourdomain.com" smtp.password="your-password" smtp.secure="false"
   ```

2. **Deploy Functions:**
   ```bash
   cd /Applications/q/pacematch-connect
   cd functions
   npm install
   cd ..
   firebase deploy --only functions
   ```

---

## 📋 Installation Steps

### Step 1: Install Dependencies

```bash
cd /Applications/q/pacematch-connect/functions
npm install
```

### Step 2: Configure Email Service

Choose one of the options above and set the environment variables.

### Step 3: Deploy Functions

```bash
cd /Applications/q/pacematch-connect
firebase deploy --only functions
```

### Step 4: Test

1. Run your app
2. Try to sign up with email
3. Check your email for the verification code

---

## 🔍 How It Works

1. **User enters email** → Clicks "Send Code"
2. **App generates 6-digit code** → Stores in Firebase Database
3. **App calls Cloud Function** → `sendOTPEmail({ email, code })`
4. **Cloud Function sends email** → Via Gmail/SendGrid/SMTP
5. **User enters code** → App verifies code
6. **User sets password** → Account created ✅

---

## ✅ Current Status

- ✅ **Email verification flow** - Working
- ✅ **Code generation** - Working
- ✅ **Code storage** - Working (Firebase Database)
- ✅ **Code verification** - Working
- ⚠️ **Email sending** - Needs Cloud Functions deployment

---

## 🧪 Testing

### Test Locally (Before Deploying)

```bash
cd /Applications/q/pacematch-connect/functions
npm run serve
```

Then in your app, the function will be available at:
- Local: `http://localhost:5001/pacematch-gps/us-central1/sendOTPEmail`

### Test After Deployment

1. Deploy functions: `firebase deploy --only functions`
2. Try signing up with email
3. Check email inbox for verification code

---

## 🐛 Troubleshooting

### "Function not found"
- Make sure you deployed: `firebase deploy --only functions`
- Check Firebase Console → Functions to see if it's deployed

### "Email not sending"
- Check environment variables are set correctly
- For Gmail: Make sure you're using App Password, not regular password
- Check Firebase Functions logs: `firebase functions:log`

### "Permission denied"
- Make sure you're logged in: `firebase login`
- Check you have the right project: `firebase use pacematch-gps`

---

## 📝 Environment Variables Reference

### Gmail
```bash
firebase functions:config:set gmail.user="your-email@gmail.com" gmail.app_password="your-app-password"
```

### SendGrid
```bash
firebase functions:config:set sendgrid.api_key="your-api-key"
```

### Custom SMTP
```bash
firebase functions:config:set smtp.host="smtp.example.com" smtp.port="587" smtp.user="user@example.com" smtp.password="password" smtp.secure="false"
```

### Email From Address
```bash
firebase functions:config:set email.from="noreply@pacematch.app"
```

---

## 🎯 Next Steps

1. **Choose email service** (Gmail is easiest for testing)
2. **Set environment variables**
3. **Deploy functions**
4. **Test email verification**

**After setup, email verification will work perfectly!** 🎉

