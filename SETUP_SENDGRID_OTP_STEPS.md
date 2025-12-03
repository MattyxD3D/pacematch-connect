# 🚀 SendGrid OTP Setup - Step by Step

## Why SendGrid?

- ✅ **Professional email delivery** - Better deliverability than Gmail
- ✅ **100 emails/day free** - Perfect for development
- ✅ **No App Password needed** - Just an API key
- ✅ **Production-ready** - Used by many companies

---

## Step 1: Create SendGrid Account (2 minutes)

1. **Go to:** https://sendgrid.com/
2. Click **"Start for Free"**
3. Sign up with your email
4. Verify your email address
5. Complete account setup

**Free Tier:**
- ✅ 100 emails/day forever
- ✅ Perfect for development and testing

---

## Step 2: Create API Key (1 minute)

1. **Log in to:** https://app.sendgrid.com/
2. Go to **Settings** → **API Keys**
3. Click **"Create API Key"**
4. Name it: `PaceMatch Email OTP`
5. **Important:** Select **"Restricted Access"**
6. Under **Mail Send**, select **"Full Access"** (or just "Mail Send" permissions)
7. Click **"Create & View"**
8. **Copy the API key immediately** (you won't be able to see it again!)

**Example API Key format:**
```
SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Step 3: Verify Sender Email (2 minutes)

1. In SendGrid Dashboard, go to **Settings** → **Sender Authentication**
2. Click **"Verify a Single Sender"**
3. Fill in the form:
   - **From Email Address:** `noreply@yourdomain.com` (or your email)
   - **From Name:** `PaceMatch`
   - **Reply To:** Your email
   - **Company Address:** Your address
   - **City, State, Zip:** Your location
   - **Country:** Your country
4. Click **"Create"**
5. **Check your email** and click the verification link
6. Status should change to **"Verified"**

**Note:** For production, you'll want to set up Domain Authentication, but single sender is fine for development.

---

## Step 4: Run Setup Script

Once you have your SendGrid API Key, run:

```bash
cd /Applications/q/pacematch-connect
./setup-sendgrid-otp.sh
```

The script will:
- Ask for your SendGrid API Key (hidden input)
- Set the Firebase config
- Deploy the functions

---

## Step 5: Make Function Public (Required!)

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

## Step 6: Test! 🎉

1. Go to your app
2. Try to sign up with an email
3. Click "Send Verification Code"
4. Check your email inbox for the OTP code!

---

## Manual Setup (Alternative)

If you prefer to do it manually:

```bash
cd /Applications/q/pacematch-connect

# Set config
firebase functions:config:set sendgrid.api_key="SG.your-api-key-here"

# Deploy
firebase deploy --only functions
```

Then complete Step 5 above to make it public.

---

## Troubleshooting

### "Permission denied" error?
- Make sure you completed Step 5 (making function public)

### "No email configuration found" error?
- Make sure you set the config: `firebase functions:config:get` to verify
- Check that your API key is correct

### Email not arriving?
- Check spam folder
- Verify sender email is verified in SendGrid
- Check SendGrid Activity log: https://app.sendgrid.com/activity
- Check Firebase Functions logs: `firebase functions:log`

### "Invalid API key" error?
- Make sure you copied the full API key (starts with `SG.`)
- Verify the API key has "Mail Send" permissions
- Try creating a new API key

---

## SendGrid vs Gmail Comparison

| Feature | SendGrid | Gmail |
|---------|----------|-------|
| **Setup Time** | 5-10 minutes | 5 minutes |
| **Free Tier** | 100 emails/day | Unlimited (personal) |
| **Deliverability** | Professional | Good |
| **App Password** | Not needed | Required |
| **Best For** | Production apps | Quick testing |

---

## Next Steps

Once SendGrid is set up:
- ✅ OTP codes will be sent via SendGrid
- ✅ Better email deliverability
- ✅ Professional email service
- ✅ Ready for production use

**That's it! SendGrid is now configured!** 🎉

