const config = require('../config/env');

/**
 * Mock email service
 */
class MockMailer {
  async sendVerificationEmail(email, token) {
    console.log(`[MOCK EMAIL] Verification email sent to ${email}`);
    console.log(`[MOCK EMAIL] Verification link: ${config.api_url}/verify/email/confirm?token=${token}`);
    return { success: true, messageId: 'mock-' + Date.now() };
  }

  async sendPasswordResetEmail(email, token) {
    console.log(`[MOCK EMAIL] Password reset email sent to ${email}`);
    console.log(`[MOCK EMAIL] Reset link: ${config.api_url}/auth/confirm-password-reset?token=${token}`);
    return { success: true, messageId: 'mock-' + Date.now() };
  }

  async sendWelcomeEmail(email, displayName) {
    console.log(`[MOCK EMAIL] Welcome email sent to ${email} for ${displayName}`);
    return { success: true, messageId: 'mock-' + Date.now() };
  }
}

const mailer = new MockMailer();

module.exports = mailer;
