const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Generate access token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, config.jwt.access_secret, {
    expiresIn: config.jwt.access_expiry,
  });
};

/**
 * Generate refresh token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, config.jwt.refresh_secret, {
    expiresIn: config.jwt.refresh_expiry,
  });
};

/**
 * Verify access token
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.access_secret);
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

/**
 * Verify refresh token
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.refresh_secret);
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

/**
 * Generate WebSocket token (short-lived)
 */
const generateWsToken = (payload) => {
  return jwt.sign(payload, config.jwt.access_secret, {
    expiresIn: '1h',
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateWsToken,
};
