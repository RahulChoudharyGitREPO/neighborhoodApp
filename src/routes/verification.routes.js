const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const UserContact = require('../models/UserContact');
const { generateVerificationToken, generateOTP, hashOTP, verifyOTP } = require('../utils/crypto');
const { logAction } = require('../utils/audit');
const mailer = require('../utils/mailer');
const sms = require('../utils/sms');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const {
  startEmailVerificationSchema,
  confirmEmailVerificationSchema,
  startPhoneVerificationSchema,
  confirmPhoneVerificationSchema,
} = require('../validators/verification.validators');
const config = require('../config/env');

// Rate limiter for OTP requests
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  message: { error: 'Too many OTP requests, please try again later' },
});

/**
 * POST /verify/email/start
 * Start email verification
 */
router.post('/email/start', authenticate, validate(startEmailVerificationSchema), async (req, res, next) => {
  try {
    const { email } = req.body;

    const userContact = await UserContact.findOne({ userId: req.user.userId });

    // Check if email matches user's email
    if (userContact.primaryEmail !== email) {
      return res.status(400).json({ error: 'Email does not match account email' });
    }

    if (userContact.isEmailVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Generate verification token
    const { token, expiry } = generateVerificationToken();
    userContact.emailVerificationToken = token;
    userContact.emailVerificationExpiry = expiry;
    await userContact.save();

    // Send verification email
    await mailer.sendVerificationEmail(email, token);

    // Log action
    await logAction(req.user.userId, 'user.verify.email.start', req);

    res.json({ message: 'Verification email sent' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /verify/email/confirm
 * Confirm email verification
 */
router.post('/email/confirm', validate(confirmEmailVerificationSchema), async (req, res, next) => {
  try {
    const { token } = req.body;

    const userContact = await UserContact.findOne({
      emailVerificationToken: token,
      emailVerificationExpiry: { $gt: new Date() },
    });

    if (!userContact) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    // Mark email as verified
    userContact.isEmailVerified = true;
    userContact.emailVerificationToken = undefined;
    userContact.emailVerificationExpiry = undefined;
    await userContact.save();

    // Log action
    await logAction(userContact.userId, 'user.verify.email.confirm', req);

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /verify/phone/start
 * Start phone verification (rate limited)
 */
router.post('/phone/start', authenticate, otpLimiter, validate(startPhoneVerificationSchema), async (req, res, next) => {
  try {
    const { phone } = req.body;

    // Check if phone is already used
    const existing = await UserContact.findOne({ phone, userId: { $ne: req.user.userId } });
    if (existing) {
      return res.status(409).json({ error: 'Phone number already in use' });
    }

    const userContact = await UserContact.findOne({ userId: req.user.userId });

    // Generate OTP
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);

    // Store hashed OTP
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + config.security.otp_expiry_minutes);

    userContact.phone = phone;
    userContact.phoneVerificationOtpHash = otpHash;
    userContact.phoneVerificationExpiry = expiry;
    await userContact.save();

    // Send OTP via SMS
    await sms.sendOTP(phone, otp);

    // Log action
    await logAction(req.user.userId, 'user.verify.phone.start', req, { phone });

    res.json({ message: 'OTP sent to phone number' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /verify/phone/confirm
 * Confirm phone verification with OTP
 */
router.post('/phone/confirm', authenticate, validate(confirmPhoneVerificationSchema), async (req, res, next) => {
  try {
    const { otp } = req.body;

    const userContact = await UserContact.findOne({ userId: req.user.userId });

    if (!userContact.phoneVerificationOtpHash || !userContact.phoneVerificationExpiry) {
      return res.status(400).json({ error: 'No pending phone verification' });
    }

    // Check expiry
    if (new Date() > userContact.phoneVerificationExpiry) {
      return res.status(400).json({ error: 'OTP expired' });
    }

    // Verify OTP
    const isValid = await verifyOTP(otp, userContact.phoneVerificationOtpHash);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Mark phone as verified
    userContact.isPhoneVerified = true;
    userContact.phoneVerificationOtpHash = undefined;
    userContact.phoneVerificationExpiry = undefined;
    await userContact.save();

    // Log action
    await logAction(req.user.userId, 'user.verify.phone.confirm', req);

    res.json({ message: 'Phone verified successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
