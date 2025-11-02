/**
 * Mock SMS service
 */
class MockSMS {
  async sendOTP(phone, otp) {
    console.log(`[MOCK SMS] OTP sent to ${phone}: ${otp}`);
    console.log(`[MOCK SMS] This is a development-only message. In production, integrate with Twilio/AWS SNS.`);
    return { success: true, messageId: 'mock-' + Date.now() };
  }

  async sendNotification(phone, message) {
    console.log(`[MOCK SMS] Notification sent to ${phone}: ${message}`);
    return { success: true, messageId: 'mock-' + Date.now() };
  }
}

const sms = new MockSMS();

module.exports = sms;
