/**
 * Fallback Email Service for Render deployment
 * Uses a simpler approach when Gmail SMTP fails
 */

const https = require('https');
const querystring = require('querystring');

class FallbackEmailService {
  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'production';
  }

  async sendPasswordChangeVerification(userEmail, verificationCode) {
    console.log(`📧 Fallback email service: Verification code for ${userEmail}: ${verificationCode}`);

    // In production on Render, log the verification code so it can be retrieved from logs
    if (this.isEnabled) {
      console.log('\n='.repeat(60));
      console.log('🔐 PASSWORD RESET VERIFICATION CODE');
      console.log(`📧 Email: ${userEmail}`);
      console.log(`🔢 Code: ${verificationCode}`);
      console.log(`⏰ Generated at: ${new Date().toISOString()}`);
      console.log(`⌛ Expires in: 10 minutes`);
      console.log('='.repeat(60) + '\n');
    }

    // Try to send via a webhook service (you can add services like Zapier, n8n, etc.)
    try {
      if (process.env.WEBHOOK_EMAIL_URL) {
        await this.sendViaWebhook(userEmail, verificationCode);
        return { success: true, method: 'webhook' };
      }
    } catch (error) {
      console.warn('Webhook email failed:', error.message);
    }

    // Return success with console logging method
    return {
      success: true,
      method: 'console_log',
      message: 'Verification code has been logged to server console (check Render logs)'
    };
  }

  async sendViaWebhook(userEmail, verificationCode) {
    const webhookData = {
      to: userEmail,
      subject: 'Password Reset Verification - De\'Aion Contractors',
      code: verificationCode,
      company: 'De\'Aion Contractors',
      timestamp: new Date().toISOString()
    };

    const postData = querystring.stringify(webhookData);

    const options = {
      hostname: new URL(process.env.WEBHOOK_EMAIL_URL).hostname,
      port: 443,
      path: new URL(process.env.WEBHOOK_EMAIL_URL).pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 10000
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`Webhook failed with status ${res.statusCode}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Webhook timeout')));
      req.write(postData);
      req.end();
    });
  }

  async sendPasswordChangeConfirmation(userEmail, username) {
    console.log(`📧 Password changed confirmation for ${username} (${userEmail})`);
    return { success: true, method: 'console_log' };
  }

  async testConnection() {
    console.log('📧 Fallback email service - always available');
    return true;
  }
}

module.exports = new FallbackEmailService();