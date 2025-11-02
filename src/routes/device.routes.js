const express = require('express');
const router = express.Router();
const Joi = require('joi');
const DeviceToken = require('../models/DeviceToken');
const { logAction } = require('../utils/audit');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

const registerDeviceSchema = Joi.object({
  token: Joi.string().required(),
  platform: Joi.string().valid('ios', 'android', 'web').required(),
});

/**
 * POST /devices
 * Register device token for push notifications
 */
router.post('/', authenticate, validate(registerDeviceSchema), async (req, res, next) => {
  try {
    const { token, platform } = req.body;

    // Check if token already exists
    let deviceToken = await DeviceToken.findOne({ token });

    if (deviceToken) {
      // Update existing token
      deviceToken.userId = req.user.userId;
      deviceToken.platform = platform;
      deviceToken.isActive = true;
      await deviceToken.save();
    } else {
      // Create new token
      deviceToken = await DeviceToken.create({
        userId: req.user.userId,
        token,
        platform,
      });
    }

    // Log action
    await logAction(req.user.userId, 'device.register', req, { platform });

    res.status(201).json({
      id: deviceToken._id,
      token: deviceToken.token,
      platform: deviceToken.platform,
      isActive: deviceToken.isActive,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /devices/:token
 * Deactivate device token
 */
router.delete('/:token', authenticate, async (req, res, next) => {
  try {
    const deviceToken = await DeviceToken.findOne({
      token: req.params.token,
      userId: req.user.userId,
    });

    if (!deviceToken) {
      return res.status(404).json({ error: 'Device token not found' });
    }

    deviceToken.isActive = false;
    await deviceToken.save();

    // Log action
    await logAction(req.user.userId, 'device.deactivate', req);

    res.json({ message: 'Device token deactivated' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
