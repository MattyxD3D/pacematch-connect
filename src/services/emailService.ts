/**
 * Email Service for sending OTP codes via SendGrid
 * 
 * IMPORTANT SECURITY NOTE:
 * For production, API keys should NEVER be in frontend code.
 * This service is designed to call a backend endpoint that handles SendGrid.
 * 
 * For a simple research prototype, see EmailJS option in SENDGRID_EMAIL_OTP_SETUP.md
 */

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Send email via SendGrid API
 * This should call a backend endpoint, not SendGrid directly from frontend
 * 
 * @param options Email options
 * @returns Promise<boolean> True if email sent successfully
 */
export const sendEmailViaSendGrid = async (options: EmailOptions): Promise<boolean> => {
  try {
    // Option 1: Call backend endpoint (recommended)
    const backendUrl = import.meta.env.VITE_EMAIL_API_URL || 'http://localhost:3001';
    
    const response = await fetch(`${backendUrl}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send email');
    }

    return true;
  } catch (error: any) {
    console.error('❌ Error sending email via SendGrid:', error);
    throw new Error(`Failed to send email: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Send OTP verification email
 * 
 * @param email User email address
 * @param code 6-digit verification code
 * @returns Promise<boolean> True if email sent successfully
 */
export const sendOTPEmail = async (email: string, code: string): Promise<boolean> => {
  const subject = 'PaceMatch - Email Verification Code';
  const text = `Your PaceMatch verification code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`;
  
  const html = `
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
  `;

  return await sendEmailViaSendGrid({
    to: email,
    subject,
    text,
    html,
  });
};

