# Simple Backend for SendGrid Email OTP

## Overview

This creates a simple Express.js backend server to securely send emails via SendGrid. This keeps your SendGrid API key on the server (secure) instead of exposing it in frontend code.

## Quick Setup (5 minutes)

### Step 1: Install Dependencies

```bash
cd pacematch-connect
npm install express cors dotenv @sendgrid/mail
npm install --save-dev @types/express @types/cors nodemon typescript
```

### Step 2: Create Backend Server

Create `backend/server.js`:

```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const sgMail = require('@sendgrid/mail');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Email endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, text, html } = req.body;

    if (!to || !subject || !text || !html) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@pacematch.app',
      subject,
      text,
      html,
    };

    await sgMail.send(msg);
    
    res.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ 
      error: 'Failed to send email',
      message: error.response?.body?.errors?.[0]?.message || error.message 
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`📧 Email server running on http://localhost:${PORT}`);
});
```

### Step 3: Create Backend .env

Create `backend/.env`:

```bash
SENDGRID_API_KEY=SG.your_actual_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
PORT=3001
```

### Step 4: Add Backend Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "backend": "node backend/server.js",
    "backend:dev": "nodemon backend/server.js",
    "dev:all": "concurrently \"npm run dev\" \"npm run backend:dev\""
  }
}
```

### Step 5: Update Frontend .env

Update `pacematch-connect/.env`:

```bash
VITE_EMAIL_API_URL=http://localhost:3001
```

### Step 6: Run Backend

```bash
npm run backend
```

Or run both frontend and backend:

```bash
npm install concurrently
npm run dev:all
```

---

## Deployment Options

### Option A: Deploy Backend Separately

1. Deploy to Heroku, Railway, Render, etc.
2. Update `VITE_EMAIL_API_URL` to your backend URL

### Option B: Firebase Cloud Functions (Recommended for Firebase projects)

See `FIREBASE_CLOUD_FUNCTIONS_SETUP.md` (create this if needed)

---

## Testing

1. Start backend: `npm run backend`
2. Start frontend: `npm run dev`
3. Try email signup - should send real emails!

---

## Security Notes

- ✅ API key stays on server
- ✅ Frontend never sees API key
- ✅ Add rate limiting for production
- ✅ Add authentication for production

---

**That's it! Your SendGrid backend is ready to send emails securely.**

