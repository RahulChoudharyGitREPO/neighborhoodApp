const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');
const UserContact = require('../models/UserContact');

/**
 * Authenticate JWT token from Authorization header
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    // Check if user exists and is not deleted
    const user = await User.findById(decoded.userId);
    if (!user || user.isDeleted) {
      return res.status(401).json({ error: 'User not found or deleted' });
    }

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
};

/**
 * Optional authentication - doesn't fail if token is missing
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyAccessToken(token);

      const user = await User.findById(decoded.userId);
      if (user && !user.isDeleted) {
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
        };
      }
    }

    next();
  } catch (error) {
    // Silently continue without authentication
    next();
  }
};

/**
 * Require re-authentication for sensitive operations
 */
const requireRecentAuth = async (req, res, next) => {
  try {
    const { currentPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({ error: 'Current password required for this operation' });
    }

    const userContact = await UserContact.findOne({ userId: req.user.userId });
    const isValid = await userContact.comparePassword(currentPassword);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  authenticate,
  optionalAuth,
  requireRecentAuth,
};
