const nodemailer = require('nodemailer');
const fallbackEmailService = require('./fallbackEmailService');
// Prefer IPv4 sockets for SMTP on some hosts
try { require('dns').setDefaultResultOrder && require('dns').setDefaultResultOrder('ipv4first'); } catch {}

class EmailService {
  constructor() {
    // Render-optimized configuration: start with secure port 465
    const isProduction = process.env.NODE_ENV === 'production';

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: isProduction ? 465 : 587, // Use secure port on Render
      secure: isProduction, // true for 465, false for 587
      requireTLS: !isProduction,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      },
      pool: false, // Disable pooling for better reliability
      connectionTimeout: isProduction ? 5000 : 15000, // Much shorter timeout on Render
      greetingTimeout: isProduction ? 3000 : 10000,
      socketTimeout: isProduction ? 5000 : 15000,
      logger: false,
      debug: false
    });
  }

  async sendPasswordChangeVerification(userEmail, verificationCode) {
    const mailOptions = {
      from: `"${process.env.COMPANY_NAME}" <${process.env.SMTP_FROM}>`,
      to: userEmail,
      subject: 'Password Change Verification - De\'Aion Contractors',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">De'Aion Contractors</h1>
            <p style="color: #666; margin: 5px 0;">Construction Site Management</p>
          </div>

          <h2 style="color: #333; margin-bottom: 20px;">Password Change Verification</h2>

          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            We received a request to change the password for your account (<strong>${userEmail}</strong>).
          </p>

          <div style="background: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center;">
            <p style="margin: 0 0 10px 0; color: #333; font-weight: bold;">Your verification code is:</p>
            <div style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 4px; font-family: monospace;">
              ${verificationCode}
            </div>
          </div>

          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            This code will expire in <strong>10 minutes</strong>. If you didn't request this password change, please ignore this email or contact your administrator.
          </p>

          <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #888; font-size: 12px; margin: 0;">
              This is an automated message from De'Aion Contractors Site Management System.
              <br>Please do not reply to this email.
            </p>
          </div>
        </div>
      `
    };

    // Retry logic for better reliability
    const maxRetries = 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempting to send email (attempt ${attempt}/${maxRetries}) to:`, userEmail);

        // Skip verification on Render - it often fails even when sending works
        if (process.env.NODE_ENV !== 'production') {
          try {
            await this.transporter.verify();
          } catch (verifyError) {
            console.warn('SMTP verification failed, but attempting to send anyway:', verifyError.message);
          }
        }

        const info = await this.transporter.sendMail(mailOptions);
        console.log('Password verification email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };

      } catch (error) {
        lastError = error;
        console.error(`Email send attempt ${attempt} failed:`, error.message);

        if (attempt < maxRetries) {
          const delay = process.env.NODE_ENV === 'production' ? attempt * 1000 : attempt * 2000;
          console.log(`Retrying in ${delay / 1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.error('All email send attempts failed. Last error:', lastError);

    // Try fallback email service on Render
    if (process.env.NODE_ENV === 'production') {
      console.log('🔄 Attempting fallback email service...');
      try {
        const result = await fallbackEmailService.sendPasswordChangeVerification(userEmail, verificationCode);
        console.log('✅ Fallback email service succeeded:', result.method);
        return result;
      } catch (fallbackError) {
        console.error('❌ Fallback email service also failed:', fallbackError.message);
      }
    }

    throw new Error(`Failed to send verification email after ${maxRetries} attempts: ${lastError.message}`);
  }

  async sendPasswordChangeConfirmation(userEmail, username) {
    const mailOptions = {
      from: `"${process.env.COMPANY_NAME}" <${process.env.SMTP_FROM}>`,
      to: userEmail,
      subject: 'Password Changed Successfully - De\'Aion Contractors',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">De'Aion Contractors</h1>
            <p style="color: #666; margin: 5px 0;">Construction Site Management</p>
          </div>

          <h2 style="color: #16a34a; margin-bottom: 20px;">✓ Password Changed Successfully</h2>

          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            Hello <strong>${username}</strong>,
          </p>

          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            Your password has been successfully changed for your account (<strong>${userEmail}</strong>) on ${new Date().toLocaleDateString()}.
          </p>

          <div style="background: #f0f9ff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <p style="margin: 0; color: #1e40af; font-weight: bold;">
              If you didn't make this change, please contact your administrator immediately.
            </p>
          </div>

          <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #888; font-size: 12px; margin: 0;">
              This is an automated message from De'Aion Contractors Site Management System.
              <br>Please do not reply to this email.
            </p>
          </div>
        </div>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Password confirmation email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending password confirmation email:', error);
      // Don't throw error for confirmation emails
      return { success: false, error: error.message };
    }
  }

  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('Email service connection verified successfully');
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }
}

module.exports = new EmailService();