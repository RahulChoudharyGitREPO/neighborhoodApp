const DeviceToken = require('../models/DeviceToken');

/**
 * Mock push notification service (Expo Push Notifications)
 */
class NotificationService {
  async sendPushNotification(userId, title, body, data = {}) {
    try {
      const devices = await DeviceToken.find({ userId, isActive: true });

      if (devices.length === 0) {
        console.log(`[PUSH] No active devices for user ${userId}`);
        return { success: false, reason: 'no_devices' };
      }

      console.log(`[MOCK PUSH] Sending to ${devices.length} device(s) for user ${userId}`);
      console.log(`[MOCK PUSH] Title: ${title}`);
      console.log(`[MOCK PUSH] Body: ${body}`);
      console.log(`[MOCK PUSH] Data:`, data);

      // In production, integrate with Expo Push API or FCM
      // await expo.sendPushNotificationsAsync(messages);

      return { success: true, sentCount: devices.length };
    } catch (error) {
      console.error('Push notification error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendMatchNotification(userId, matchId) {
    return this.sendPushNotification(
      userId,
      'New Match!',
      'You have been matched with a helper.',
      { type: 'match', matchId: matchId.toString() }
    );
  }

  async sendMessageNotification(userId, senderId, preview) {
    return this.sendPushNotification(
      userId,
      'New Message',
      preview,
      { type: 'message', senderId: senderId.toString() }
    );
  }
}

const notificationService = new NotificationService();

module.exports = notificationService;
