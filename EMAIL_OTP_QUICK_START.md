# 📧 Email OTP Quick Start Guide

## Choose Your Solution

You have **2 options** for email OTP authentication:

### Option 1: EmailJS (Easiest - Recommended for Prototype) ⭐

**Best for:** Quick setup, research prototypes, development

- ✅ **No backend needed** - works directly from frontend
- ✅ **5-minute setup**
- ✅ **Free tier:** 200 emails/month
- ✅ **Secure** - EmailJS handles API keys securely
- ⚠️ Uses your personal email (Gmail, Outlook, etc.)

**Setup time:** 5 minutes

---

### Option 2: SendGrid (Professional - Better for Production)

**Best for:** Production apps, professional email delivery

- ✅ **Professional email delivery**
- ✅ **Better deliverability**
- ✅ **Free tier:** 100 emails/day forever
- ✅ **Custom domain** support
- ⚠️ Requires backend server (5-minute setup)
- ⚠️ API key must be kept secure

**Setup time:** 10-15 minutes (includes backend)

---

## 🚀 Quick Start: EmailJS (Recommended)

### Step 1: Sign Up (2 minutes)

1. Go to [EmailJS](https://www.emailjs.com/)
2. Click **"Sign Up"** (free account)
3. Verify your email

### Step 2: Connect Email Service (1 minute)

1. Go to **Email Services** in EmailJS dashboard
2. Click **"Add New Service"**
3. Choose your email:
   - **Gmail** (easiest)
   - **Outlook** 
   - **Yahoo**
   - Or custom SMTP
4. Follow instructions to connect
5. **Copy your Service ID**

### Step 3: Create Email Template (1 minute)

1. Go to **Email Templates** in EmailJS dashboard
2. Click **"Create New Template"**
3. Use this template:

**Template Name:** `PaceMatch OTP`

**Subject:** `PaceMatch - Email Verification Code`

**Content:**
```
Hi {{user_name}},

Your PaceMatch verification code is:

{{verification_code}}

This code expires in 10 minutes.

If you didn't request this code, please ignore this email.
```

4. Click **"Save"**
5. **Copy your Template ID**

### Step 4: Get Public Key (30 seconds)

1. Go to **Account** → **General** in EmailJS dashboard
2. Find **"Public Key"**
3. **Copy your Public Key**

### Step 5: Add to Your App (30 seconds)

1. Create/update `.env` file in `pacematch-connect/`:

```bash
VITE_EMAILJS_SERVICE_ID=your_service_id_here
VITE_EMAILJS_TEMPLATE_ID=your_template_id_here
VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
```

2. Install EmailJS package:

```bash
npm install @emailjs/browser
```

3. **Restart dev server:**

```bash
npm run dev
```

### Step 6: Test! 🎉

1. Go to login page
2. Click "Create Account"
3. Enter email
4. Click "Send Verification Code"
5. **Check your email inbox!**

---

## 🏗️ Quick Start: SendGrid (Alternative)

See `SENDGRID_EMAIL_OTP_SETUP.md` for full SendGrid setup guide.

**Quick version:**

1. Sign up at [SendGrid](https://sendgrid.com/) (free)
2. Create API key
3. Set up simple backend (see `SENDGRID_SIMPLE_BACKEND.md`)
4. Add environment variables
5. Done!

---

## Which Should You Choose?

### Choose EmailJS if:
- ✅ You want the easiest setup
- ✅ You're building a research prototype
- ✅ You need it working in 5 minutes
- ✅ 200 emails/month is enough

### Choose SendGrid if:
- ✅ You want professional email delivery
- ✅ You need custom domain email
- ✅ You're preparing for production
- ✅ You want better deliverability

---

## Troubleshooting

### EmailJS: Email Not Arriving?

1. Check spam folder
2. Verify email service is connected
3. Check EmailJS Activity log
4. Verify environment variables are loaded (restart dev server)

### SendGrid: Errors?

1. Check API key is correct
2. Verify sender email is verified
3. Check backend server is running
4. Check backend logs for errors

---

## Next Steps

1. ✅ Choose your email service
2. ✅ Complete setup
3. ✅ Test email sending
4. ✅ Test complete signup flow

**That's it! Email OTP is ready to use!** 🎉

