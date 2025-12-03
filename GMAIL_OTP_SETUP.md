# 📧 Gmail OTP Setup Guide

## Yes! Google (Gmail) Can Send 6-Digit OTP Codes ✅

You can use your Gmail account to send OTP verification codes. Here are two easy ways:

---

## Option 1: Gmail via Firebase Cloud Functions (Recommended) ⭐

**Best for:** Secure, production-ready setup

### Step 1: Get Gmail App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Sign in with your Gmail account
3. Click **"Select app"** → Choose **"Mail"**
4. Click **"Select device"** → Choose **"Other (Custom name)"**
5. Enter: `PaceMatch OTP`
6. Click **"Generate"**
7. **Copy the 16-character password** (looks like: `abcd efgh ijkl mnop`)
   - ⚠️ **Important:** You won't see this again, so copy it now!

### Step 2: Install Functions Dependencies

```bash
cd /Applications/q/pacematch-connect/functions
npm install
```

### Step 3: Set Gmail Credentials

```bash
cd /Applications/q/pacematch-connect
firebase functions:config:set gmail.user="your-email@gmail.com" gmail.app_password="your-16-char-app-password"
```

**Example:**
```bash
firebase functions:config:set gmail.user="myemail@gmail.com" gmail.app_password="abcd efgh ijkl mnop"
```

### Step 4: Deploy Functions

```bash
firebase deploy --only functions
```

### Step 5: Make Function Public (Allow Unauthenticated Calls)

Since users need to verify email before creating accounts, the function needs to be accessible without authentication:

1. Go to [Firebase Console - Functions](https://console.firebase.google.com/project/pacematch-gps/functions)
2. Find `sendOTPEmail` function
3. Click on it → Go to **"Permissions"** tab
4. Click **"Add Principal"**
5. Enter: `allUsers`
6. Select role: **"Cloud Functions Invoker"**
7. Click **"Save"**

**OR use Firebase CLI:**
```bash
gcloud functions add-iam-policy-binding sendOTPEmail \
  --region=us-central1 \
  --member="allUsers" \
  --role="roles/cloudfunctions.invoker" \
  --project=pacematch-gps
```

### Done! ✅

Now when users request OTP codes, they'll be sent via your Gmail account!

---

## Option 2: Gmail via EmailJS (Easier Setup) 🚀

**Best for:** Quick testing, no backend deployment needed

### Step 1: Sign Up at EmailJS

1. Go to: https://www.emailjs.com/
2. Create free account (200 emails/month free)

### Step 2: Connect Gmail

1. In EmailJS dashboard → **Email Services** → **Add New Service**
2. Choose **"Gmail"**
3. Click **"Connect Account"**
4. Sign in with your Gmail account
5. Authorize EmailJS to send emails
6. **Copy your Service ID** (e.g., `service_xxxxx`)

### Step 3: Create Email Template

1. Go to **Email Templates** → **Create New Template**
2. **Template Name:** `PaceMatch OTP`
3. **Subject:** `PaceMatch - Email Verification Code`
4. **Content:**
```
Hi {{user_name}},

Your PaceMatch verification code is:

{{verification_code}}

This code expires in 10 minutes.

If you didn't request this code, please ignore this email.
```
5. Click **"Save"**
6. **Copy your Template ID** (e.g., `template_xxxxx`)

### Step 4: Get Public Key

1. Go to **Account** → **General**
2. Find **"Public Key"**
3. **Copy your Public Key**

### Step 5: Add to `.env` File

Add these lines to `/Applications/q/pacematch-connect/.env`:

```bash
VITE_EMAILJS_SERVICE_ID=your_service_id_here
VITE_EMAILJS_TEMPLATE_ID=your_template_id_here
VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
```

### Step 6: Restart Dev Server

```bash
npm run dev
```

### Done! ✅

Emails will now be sent via Gmail through EmailJS!

---

## Comparison

| Feature | Firebase Functions + Gmail | EmailJS + Gmail |
|---------|---------------------------|-----------------|
| **Setup Time** | 10-15 minutes | 5 minutes |
| **Backend Required** | Yes (Firebase Functions) | No |
| **Deployment** | Required | Not needed |
| **Free Tier** | Firebase free tier | 200 emails/month |
| **Security** | More secure (server-side) | Good (EmailJS handles it) |
| **Best For** | Production apps | Quick testing, prototypes |

---

## Recommendation

- **For quick testing:** Use **EmailJS + Gmail** (Option 2)
- **For production:** Use **Firebase Functions + Gmail** (Option 1)

Both will send 6-digit OTP codes via Gmail! 📧✅

