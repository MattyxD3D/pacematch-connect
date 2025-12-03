/**
 * Simple Email Service using EmailJS (Frontend-only solution)
 * 
 * This is the EASIEST option for a research prototype - no backend needed!
 * EmailJS handles email sending from the frontend securely.
 * 
 * Setup:
 * 1. Sign up at https://www.emailjs.com/ (free tier available)
 * 2. Connect your email service (Gmail, Outlook, etc.)
 * 3. Create email template
 * 4. Add environment variables (see .env.example)
 * 
 * Alternative: See emailService.ts for SendGrid backend solution
 */

import emailjs from '@emailjs/browser';

// Initialize EmailJS (call this once in your app, e.g., in main.tsx)
export const initEmailJS = () => {
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
  if (publicKey) {
    emailjs.init(publicKey);
  } else {
    console.warn('⚠️ EmailJS public key not found. Email sending will not work.');
  }
};

interface SendOTPEmailOptions {
  email: string;
  code: string;
  userName?: string;
}

/**
 * Send OTP verification email via EmailJS
 * 
 * @param options Email options
 * @returns Promise<boolean> True if email sent successfully
 */
export const sendOTPEmailSimple = async (options: SendOTPEmailOptions): Promise<boolean> => {
  try {
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      throw new Error('EmailJS configuration missing. Please check your environment variables.');
    }

    const templateParams = {
      to_email: options.email,
      verification_code: options.code,
      user_name: options.userName || 'there',
      app_name: 'PaceMatch',
    };

    await emailjs.send(serviceId, templateId, templateParams, publicKey);

    console.log('✅ Email sent successfully via EmailJS');
    return true;
  } catch (error: any) {
    console.error('❌ Error sending email via EmailJS:', error);
    throw new Error(`Failed to send email: ${error.text || error.message || 'Unknown error'}`);
  }
};

