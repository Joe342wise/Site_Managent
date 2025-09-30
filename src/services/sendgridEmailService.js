/**
 * SendGrid Email Service for reliable email delivery on Render
 * Install: npm install @sendgrid/mail
 */

class SendGridEmailService {
  constructor() {
    this.isEnabled = !!process.env.SENDGRID_API_KEY;

    if (this.isEnabled) {
      try {
        this.sgMail = require('@sendgrid/mail');
        this.sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        console.log('📧 SendGrid email service initialized');
      } catch (error) {
        console.warn('⚠️ SendGrid not available:', error.message);
        this.isEnabled = false;
      }
    }
  }

  async sendPasswordChangeVerification(userEmail, verificationCode) {
    if (!this.isEnabled) {
      throw new Error('SendGrid not configured');
    }

    const msg = {
      to: userEmail,
      from: process.env.SMTP_FROM || 'noreply@deaioncontractors.com',
      subject: 'Password Reset Verification - De\'Aion Contractors',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">De'Aion Contractors</h1>
            <p style="color: #666; margin: 5px 0;">Construction Site Management</p>
          </div>

          <h2 style="color: #333; margin-bottom: 20px;">Password Reset Verification</h2>

          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            We received a request to reset the password for your account (<strong>${userEmail}</strong>).
          </p>

          <div style="background: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center;">
            <p style="margin: 0 0 10px 0; color: #333; font-weight: bold;">Your verification code is:</p>
            <div style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 4px; font-family: monospace;">
              ${verificationCode}
            </div>
          </div>

          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            This code will expire in <strong>10 minutes</strong>. If you didn't request this password reset, please ignore this email.
          </p>

          <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #888; font-size: 12px; margin: 0;">
              This is an automated message from De'Aion Contractors Site Management System.
            </p>
          </div>
        </div>
      `,
      text: `De'Aion Contractors - Password Reset\n\nYour verification code is: ${verificationCode}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore this email.`
    };

    try {
      const result = await this.sgMail.send(msg);
      console.log('📧 SendGrid email sent successfully:', result[0].statusCode);
      return {
        success: true,
        messageId: result[0].headers['x-message-id'],
        method: 'sendgrid'
      };
    } catch (error) {
      console.error('❌ SendGrid send failed:', error.message);
      throw error;
    }
  }

  async sendPasswordChangeConfirmation(userEmail, username) {
    if (!this.isEnabled) {
      return { success: false, error: 'SendGrid not configured' };
    }

    const msg = {
      to: userEmail,
      from: process.env.SMTP_FROM || 'noreply@deaioncontractors.com',
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
        </div>
      `,
      text: `De'Aion Contractors - Password Changed\n\nHello ${username},\n\nYour password has been successfully changed on ${new Date().toLocaleDateString()}.\n\nIf you didn't make this change, please contact your administrator.`
    };

    try {
      await this.sgMail.send(msg);
      console.log('📧 SendGrid confirmation email sent');
      return { success: true, method: 'sendgrid' };
    } catch (error) {
      console.error('❌ SendGrid confirmation failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async testConnection() {
    if (!this.isEnabled) {
      return false;
    }

    try {
      // SendGrid doesn't have a test connection, so we check if API key is set
      return !!process.env.SENDGRID_API_KEY;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new SendGridEmailService();