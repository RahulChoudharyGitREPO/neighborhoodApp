const express = require('express');
const router = express.Router();
const User = require('../models/User');
const UserContact = require('../models/UserContact');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { generateVerificationToken } = require('../utils/crypto');
const { logAction } = require('../utils/audit');
const mailer = require('../utils/mailer');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  requestPasswordResetSchema,
  confirmPasswordResetSchema,
} = require('../validators/auth.validators');
const config = require('../config/env');

/**
 * POST /auth/register
 * Register new user
 */
router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { displayName, email, password, home } = req.body;

    // Check if email already exists
    const existing = await UserContact.findOne({ primaryEmail: email });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Create user
    const user = await User.create({
      displayName,
      home: {
        type: 'Point',
        coordinates: [home.lng, home.lat],
      },
    });

    // Create user contact with hashed password
    const userContact = await UserContact.create({
      userId: user._id,
      primaryEmail: email,
      passwordHash: password, // Will be hashed by pre-save hook
    });

    // Generate email verification token
    const { token, expiry } = generateVerificationToken();
    userContact.emailVerificationToken = token;
    userContact.emailVerificationExpiry = expiry;
    await userContact.save();

    // Send verification email
    await mailer.sendVerificationEmail(email, token);

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user._id, email });
    const refreshToken = generateRefreshToken({ userId: user._id, email });

    // Store refresh token
    await userContact.addRefreshToken(refreshToken);

    // Log action
    await logAction(user._id, 'user.register', req);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.node_env === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      accessToken,
      user: {
        id: user._id,
        displayName: user.displayName,
        email,
        isEmailVerified: false,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/login
 * Login user
 */
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user contact
    const userContact = await UserContact.findOne({ primaryEmail: email });
    if (!userContact) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValid = await userContact.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is deleted
    const user = await User.findById(userContact.userId);
    if (!user || user.isDeleted) {
      return res.status(401).json({ error: 'Account not found' });
    }

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user._id, email });
    const refreshToken = generateRefreshToken({ userId: user._id, email });

    // Store refresh token
    await userContact.addRefreshToken(refreshToken);

    // Log action
    await logAction(user._id, 'user.login', req);

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.node_env === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      accessToken,
      user: {
        id: user._id,
        displayName: user.displayName,
        email,
        isEmailVerified: userContact.isEmailVerified,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/refresh
 * Refresh access token
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided' });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Check if token is in database
    const userContact = await UserContact.findOne({ userId: decoded.userId });
    if (!userContact || !userContact.hasRefreshToken(refreshToken)) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      userId: decoded.userId,
      email: decoded.email,
    });

    res.json({ accessToken });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/logout
 * Logout user
 */
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      const userContact = await UserContact.findOne({ userId: req.user.userId });
      if (userContact) {
        await userContact.removeRefreshToken(refreshToken);
      }
    }

    // Clear cookie
    res.clearCookie('refreshToken');

    // Log action
    await logAction(req.user.userId, 'user.logout', req);

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/password
 * Change password (requires current password)
 */
router.post('/password', authenticate, validate(changePasswordSchema), async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const userContact = await UserContact.findOne({ userId: req.user.userId });

    // Verify current password
    const isValid = await userContact.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    userContact.passwordHash = newPassword;
    await userContact.save();

    // Log action
    await logAction(req.user.userId, 'user.password.change', req);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/request-password-reset
 * Request password reset token
 */
router.post('/request-password-reset', validate(requestPasswordResetSchema), async (req, res, next) => {
  try {
    const { email } = req.body;

    const userContact = await UserContact.findOne({ primaryEmail: email });

    // Always return success to prevent email enumeration
    if (!userContact) {
      return res.json({ message: 'If account exists, reset email will be sent' });
    }

    // Generate reset token
    const { token, expiry } = generateVerificationToken();
    userContact.passwordResetToken = token;
    userContact.passwordResetExpiry = expiry;
    await userContact.save();

    // Send reset email
    await mailer.sendPasswordResetEmail(email, token);

    // Log action
    await logAction(userContact.userId, 'user.password.reset.request', req);

    res.json({ message: 'If account exists, reset email will be sent' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/confirm-password-reset
 * Confirm password reset with token
 */
router.post('/confirm-password-reset', validate(confirmPasswordResetSchema), async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    const userContact = await UserContact.findOne({
      passwordResetToken: token,
      passwordResetExpiry: { $gt: new Date() },
    });

    if (!userContact) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Update password
    userContact.passwordHash = newPassword;
    userContact.passwordResetToken = undefined;
    userContact.passwordResetExpiry = undefined;
    await userContact.save();

    // Log action
    await logAction(userContact.userId, 'user.password.reset.confirm', req);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
