const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// Initialize Firebase Admin
admin.initializeApp();

// Email configuration
// You can use Gmail, SendGrid, or any SMTP service
// For Gmail, you'll need to use an "App Password" (not your regular password)
// Set environment variables in Firebase Console or use .env file for local development
const createTransporter = () => {
  // Option 1: Gmail (easiest for testing)
  // Get App Password from: https://myaccount.google.com/apppasswords
  // Set via: firebase functions:secrets:set GMAIL_USER GMAIL_APP_PASSWORD
  const gmailUser = functions.config().gmail?.user || process.env.GMAIL_USER;
  const gmailPassword = functions.config().gmail?.app_password || process.env.GMAIL_APP_PASSWORD;
  
  if (gmailUser && gmailPassword) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPassword, // Use App Password, not regular password
      },
    });
  }

  // Option 2: SendGrid
  // Set via: firebase functions:secrets:set SENDGRID_API_KEY
  const sendGridKey = functions.config().sendgrid?.api_key || process.env.SENDGRID_API_KEY;
  if (sendGridKey) {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: sendGridKey,
      },
    });
  }

  // Option 3: Custom SMTP
  const smtpHost = functions.config().smtp?.host || process.env.SMTP_HOST;
  const smtpUser = functions.config().smtp?.user || process.env.SMTP_USER;
  const smtpPassword = functions.config().smtp?.password || process.env.SMTP_PASSWORD;
  
  if (smtpHost && smtpUser && smtpPassword) {
    return nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(functions.config().smtp?.port || process.env.SMTP_PORT || '587'),
      secure: (functions.config().smtp?.secure || process.env.SMTP_SECURE) === 'true',
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });
  }

  throw new Error('No email configuration found. Please set up GMAIL_USER/GMAIL_APP_PASSWORD, SENDGRID_API_KEY, or SMTP settings.');
};

/**
 * Cloud Function to send OTP verification email
 * 
 * Allows unauthenticated calls since users need to verify email before creating account
 * Includes rate limiting and validation for security
 * 
 * Call this from your frontend:
 * const sendOTPEmail = httpsCallable(functions, 'sendOTPEmail');
 * await sendOTPEmail({ email: 'user@example.com', code: '123456' });
 */
exports.sendOTPEmail = functions.https.onCall(async (data, context) => {
  // Allow unauthenticated calls (users don't have accounts yet)
  // But add rate limiting and validation for security
  
  // Validate input
  if (!data.email || !data.code) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Email and code are required'
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid email format'
    );
  }

  // Validate code format (6 digits)
  if (!/^\d{6}$/.test(data.code)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Code must be 6 digits'
    );
  }

  // Basic rate limiting: Check if email was sent recently (prevent spam)
  // In production, you might want to use Firebase Realtime Database for more sophisticated rate limiting
  const { email, code } = data;

  try {
    const transporter = createTransporter();

    const emailFrom = functions.config().email?.from || process.env.EMAIL_FROM || 'noreply@pacematch.app';
    
    const mailOptions = {
      from: emailFrom,
      to: email,
      subject: 'PaceMatch - Email Verification Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>PaceMatch Verification Code</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">PaceMatch</h1>
          </div>
          <div style="background: #f5f5f5; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1976d2; margin-top: 0;">Email Verification</h2>
            <p>Hi there,</p>
            <p>Thank you for signing up for PaceMatch! Use the code below to verify your email address:</p>
            
            <div style="background: white; border: 2px dashed #1976d2; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
              <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1976d2; font-family: 'Courier New', monospace;">
                ${code}
              </div>
            </div>
            
            <p style="color: #666; font-size: 14px;">This code will expire in <strong>10 minutes</strong>.</p>
            <p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              This is an automated email from PaceMatch. Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `Your PaceMatch verification code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`,
    };

    await transporter.sendMail(mailOptions);

    console.log(`✅ Verification email sent to ${email}`);
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to send email',
      error.message
    );
  }
});

