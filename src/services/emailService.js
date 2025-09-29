const nodemailer = require('nodemailer');
// Prefer IPv4 sockets for SMTP on some hosts
try { require('dns').setDefaultResultOrder && require('dns').setDefaultResultOrder('ipv4first'); } catch {}

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      requireTLS: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      },
      pool: true, // use pooled connection
      maxConnections: 5,
      maxMessages: 100,
      rateLimit: 14, // 14 messages per second max
      connectionTimeout: 30000, // 30 seconds
      greetingTimeout: 20000, // 20 seconds
      socketTimeout: 30000 // 30 seconds
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

        // Verify connection before sending
        try {
          await this.transporter.verify();
        } catch (verifyError) {
          // If connection timed out on STARTTLS: try SMTPS 465 as fallback
          if (verifyError && (verifyError.code === 'ETIMEDOUT' || verifyError.code === 'ECONNRESET')) {
            console.warn('STARTTLS on 587 timed out. Retrying with SMTPS 465...');
            this.transporter = nodemailer.createTransport({
              service: 'gmail',
              host: process.env.SMTP_HOST || 'smtp.gmail.com',
              port: 465,
              secure: true,
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
              },
              tls: { rejectUnauthorized: false },
              pool: false,
              connectionTimeout: 30000,
              greetingTimeout: 20000,
              socketTimeout: 30000
            });
            await this.transporter.verify();
          } else {
            throw verifyError;
          }
        }

        const info = await this.transporter.sendMail(mailOptions);
        console.log('Password verification email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };

      } catch (error) {
        lastError = error;
        console.error(`Email send attempt ${attempt} failed:`, error.message);

        if (attempt < maxRetries) {
          console.log(`Retrying in ${attempt * 2} seconds...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 2000));
        }
      }
    }

    console.error('All email send attempts failed. Last error:', lastError);
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