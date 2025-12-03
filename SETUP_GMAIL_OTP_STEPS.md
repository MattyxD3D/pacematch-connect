# 🚀 Gmail OTP Setup - Step by Step

## Step 1: Get Gmail App Password ⚠️ DO THIS FIRST

1. **Go to:** https://myaccount.google.com/apppasswords
2. **Sign in** with your Gmail account
3. Click **"Select app"** → Choose **"Mail"**
4. Click **"Select device"** → Choose **"Other (Custom name)"**
5. Enter: `PaceMatch OTP`
6. Click **"Generate"**
7. **Copy the 16-character password** (looks like: `abcd efgh ijkl mnop`)
   - ⚠️ **IMPORTANT:** You won't see this again! Copy it now!

**Note:** You'll need:
- Your Gmail address (e.g., `yourname@gmail.com`)
- The 16-character App Password you just generated

---

## Step 2: Set Firebase Config

Once you have your Gmail App Password, run this command:

```bash
cd /Applications/q/pacematch-connect
firebase functions:config:set gmail.user="YOUR_EMAIL@gmail.com" gmail.app_password="YOUR_16_CHAR_PASSWORD"
```

**Example:**
```bash
firebase functions:config:set gmail.user="myemail@gmail.com" gmail.app_password="abcd efgh ijkl mnop"
```

---

## Step 3: Deploy Functions

```bash
cd /Applications/q/pacematch-connect
firebase deploy --only functions
```

---

## Step 4: Make Function Public (Allow Unauthenticated Calls)

After deployment, you need to allow unauthenticated access:

### Option A: Firebase Console (Easier)

1. Go to: https://console.firebase.google.com/project/pacematch-gps/functions
2. Find `sendOTPEmail` function
3. Click on it
4. Go to **"Permissions"** tab
5. Click **"Add Principal"**
6. Enter: `allUsers`
7. Select role: **"Cloud Functions Invoker"**
8. Click **"Save"**

### Option B: gcloud CLI

```bash
gcloud functions add-iam-policy-binding sendOTPEmail \
  --region=us-central1 \
  --member="allUsers" \
  --role="roles/cloudfunctions.invoker" \
  --project=pacematch-gps
```

---

## Step 5: Test!

1. Go to your app
2. Try to sign up with an email
3. Click "Send Verification Code"
4. Check your email inbox for the OTP code!

---

## Troubleshooting

### "Permission denied" error?
- Make sure you completed Step 4 (making function public)

### "No email configuration found" error?
- Make sure you set the config in Step 2
- Check: `firebase functions:config:get` to verify

### Email not arriving?
- Check spam folder
- Verify Gmail App Password is correct
- Check Firebase Functions logs: `firebase functions:log`

