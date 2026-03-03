const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const User = require('../models/User');
const UserContact = require('../models/UserContact');
const { logAction } = require('../utils/audit');
const { generateVerificationToken, generateOTP, hashOTP, verifyOTP } = require('../utils/crypto');
const mailer = require('../utils/mailer');
const sms = require('../utils/sms');
const { validate } = require('../middleware/validate');
const { authenticate, requireRecentAuth } = require('../middleware/auth');
const {
  updateProfileSchema,
  confirmAvatarSchema,
  updateEmailStartSchema,
  updateEmailConfirmSchema,
  updatePhoneStartSchema,
  updatePhoneConfirmSchema,
  updatePrivacySchema,
} = require('../validators/profile.validators');
const config = require('../config/env');

// Configure Cloudinary
if (config.cloudinary.cloud_name) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloud_name,
    api_key: config.cloudinary.api_key,
    api_secret: config.cloudinary.api_secret,
  });
}

/**
 * GET /me
 * Get current user profile
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    const userContact = await UserContact.findOne({ userId: req.user.userId });

    if (!user || user.isDeleted) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      address: user.address,
      skills: user.skills,
      radiusKm: user.radiusKm,
      role: user.role,
      home: user.home ? {
        lng: user.home.coordinates[0],
        lat: user.home.coordinates[1],
      } : null,
      email: userContact.primaryEmail,
      isEmailVerified: userContact.isEmailVerified,
      phone: userContact.phone,
      isPhoneVerified: userContact.isPhoneVerified,
      privacy: user.privacy,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /me/profile
 * Update user profile
 */
router.patch('/profile', authenticate, validate(updateProfileSchema), async (req, res, next) => {
  try {
    const updates = {};

    if (req.body.displayName) updates.displayName = req.body.displayName;
    if (req.body.bio !== undefined) updates.bio = req.body.bio;
    if (req.body.address !== undefined) updates.address = req.body.address;
    if (req.body.skills) updates.skills = req.body.skills;
    if (req.body.radiusKm) updates.radiusKm = req.body.radiusKm;
    if (req.body.role) updates.role = req.body.role;
    if (req.body.home) {
      updates.home = {
        type: 'Point',
        coordinates: [req.body.home.lng, req.body.home.lat],
      };
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    // Update phone in UserContact if provided
    let userContact;
    if (req.body.phone !== undefined) {
      userContact = await UserContact.findOneAndUpdate(
        { userId: req.user.userId },
        { $set: { phone: req.body.phone || null } },
        { new: true }
      );
    } else {
      userContact = await UserContact.findOne({ userId: req.user.userId });
    }

    // Log action
    const allFields = [...Object.keys(updates)];
    if (req.body.phone !== undefined) allFields.push('phone');
    await logAction(req.user.userId, 'user.profile.update', req, { fields: allFields });

    res.json({
      id: user._id,
      displayName: user.displayName,
      bio: user.bio,
      address: user.address,
      skills: user.skills,
      radiusKm: user.radiusKm,
      home: user.home ? {
        lng: user.home.coordinates[0],
        lat: user.home.coordinates[1],
      } : null,
      phone: userContact?.phone || null,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /me/avatar/sign
 * Get Cloudinary signed upload parameters
 */
router.post('/avatar/sign', authenticate, async (req, res, next) => {
  try {
    if (!config.cloudinary.cloud_name) {
      return res.status(501).json({ error: 'Cloudinary not configured' });
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = 'avatars';
    const publicId = `avatar_${req.user.userId}_${timestamp}`;

    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder,
        public_id: publicId,
      },
      config.cloudinary.api_secret
    );

    res.json({
      signature,
      timestamp,
      cloudName: config.cloudinary.cloud_name,
      apiKey: config.cloudinary.api_key,
      folder,
      publicId,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /me/avatar/confirm
 * Confirm avatar upload
 */
router.post('/avatar/confirm', authenticate, validate(confirmAvatarSchema), async (req, res, next) => {
  try {
    const { publicId, secureUrl } = req.body;

    // Delete old avatar from Cloudinary if exists
    const user = await User.findById(req.user.userId);
    if (user.avatarPublicId) {
      try {
        await cloudinary.uploader.destroy(user.avatarPublicId);
      } catch (err) {
        console.error('Failed to delete old avatar:', err);
      }
    }

    // Update user avatar
    user.avatarUrl = secureUrl;
    user.avatarPublicId = publicId;
    await user.save();

    // Log action
    await logAction(req.user.userId, 'user.avatar.update', req);

    res.json({ avatarUrl: secureUrl });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /me/email/start
 * Start email change process
 */
router.post('/email/start', authenticate, validate(updateEmailStartSchema), requireRecentAuth, async (req, res, next) => {
  try {
    const { newEmail } = req.body;

    // Check if email already exists
    const existing = await UserContact.findOne({ primaryEmail: newEmail });
    if (existing) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    // Generate verification token
    const { token, expiry } = generateVerificationToken();

    const userContact = await UserContact.findOne({ userId: req.user.userId });
    userContact.emailVerificationToken = token;
    userContact.emailVerificationExpiry = expiry;
    userContact.primaryEmail = newEmail;
    userContact.isEmailVerified = false;
    await userContact.save();

    // Send verification email
    await mailer.sendVerificationEmail(newEmail, token);

    // Log action
    await logAction(req.user.userId, 'user.email.change.start', req);

    res.json({ message: 'Verification email sent to new address' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /me/email/confirm
 * Confirm email change
 */
router.post('/email/confirm', authenticate, validate(updateEmailConfirmSchema), async (req, res, next) => {
  try {
    const { token } = req.body;

    const userContact = await UserContact.findOne({
      userId: req.user.userId,
      emailVerificationToken: token,
      emailVerificationExpiry: { $gt: new Date() },
    });

    if (!userContact) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    userContact.isEmailVerified = true;
    userContact.emailVerificationToken = undefined;
    userContact.emailVerificationExpiry = undefined;
    await userContact.save();

    // Log action
    await logAction(req.user.userId, 'user.email.change.confirm', req);

    res.json({ message: 'Email updated successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /me/phone/start
 * Start phone change process
 */
router.post('/phone/start', authenticate, validate(updatePhoneStartSchema), requireRecentAuth, async (req, res, next) => {
  try {
    const { newPhone } = req.body;

    // Check if phone already exists
    const existing = await UserContact.findOne({ phone: newPhone, userId: { $ne: req.user.userId } });
    if (existing) {
      return res.status(409).json({ error: 'Phone number already in use' });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);

    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + config.security.otp_expiry_minutes);

    const userContact = await UserContact.findOne({ userId: req.user.userId });
    userContact.phone = newPhone;
    userContact.isPhoneVerified = false;
    userContact.phoneVerificationOtpHash = otpHash;
    userContact.phoneVerificationExpiry = expiry;
    await userContact.save();

    // Send OTP
    await sms.sendOTP(newPhone, otp);

    // Log action
    await logAction(req.user.userId, 'user.phone.change.start', req);

    res.json({ message: 'OTP sent to new phone number' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /me/phone/confirm
 * Confirm phone change
 */
router.post('/phone/confirm', authenticate, validate(updatePhoneConfirmSchema), async (req, res, next) => {
  try {
    const { otp } = req.body;

    const userContact = await UserContact.findOne({ userId: req.user.userId });

    if (!userContact.phoneVerificationOtpHash || !userContact.phoneVerificationExpiry) {
      return res.status(400).json({ error: 'No pending phone verification' });
    }

    if (new Date() > userContact.phoneVerificationExpiry) {
      return res.status(400).json({ error: 'OTP expired' });
    }

    const isValid = await verifyOTP(otp, userContact.phoneVerificationOtpHash);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    userContact.isPhoneVerified = true;
    userContact.phoneVerificationOtpHash = undefined;
    userContact.phoneVerificationExpiry = undefined;
    await userContact.save();

    // Log action
    await logAction(req.user.userId, 'user.phone.change.confirm', req);

    res.json({ message: 'Phone updated successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /me/privacy
 * Update privacy settings
 */
router.patch('/privacy', authenticate, validate(updatePrivacySchema), async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);

    if (req.body.maskExactLocation !== undefined) {
      user.privacy.maskExactLocation = req.body.maskExactLocation;
    }

    if (req.body.blockUserId) {
      if (!user.privacy.blockedUsers.includes(req.body.blockUserId)) {
        user.privacy.blockedUsers.push(req.body.blockUserId);
      }
    }

    if (req.body.unblockUserId) {
      user.privacy.blockedUsers = user.privacy.blockedUsers.filter(
        id => !id.equals(req.body.unblockUserId)
      );
    }

    await user.save();

    // Log action
    await logAction(req.user.userId, 'user.privacy.update', req);

    res.json({ privacy: user.privacy });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /me
 * Soft delete account
 */
router.delete('/', authenticate, requireRecentAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    const userContact = await UserContact.findOne({ userId: req.user.userId });

    // Soft delete
    user.isDeleted = true;
    user.displayName = '[Deleted User]';
    user.bio = '';
    user.avatarUrl = '';
    user.skills = [];
    await user.save();

    // Anonymize contact info
    userContact.primaryEmail = `deleted_${Date.now()}@deleted.local`;
    userContact.phone = null;
    userContact.refreshTokens = [];
    await userContact.save();

    // Log action
    await logAction(req.user.userId, 'user.delete', req);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
