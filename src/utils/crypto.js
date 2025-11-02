const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const config = require('../config/env');

/**
 * Generate random token
 */
const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate OTP (6 digits)
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Hash OTP
 */
const hashOTP = async (otp) => {
  return await bcrypt.hash(otp, config.security.bcrypt_salt_rounds);
};

/**
 * Verify OTP
 */
const verifyOTP = async (otp, hash) => {
  return await bcrypt.compare(otp, hash);
};

/**
 * Generate verification token with expiry
 */
const generateVerificationToken = () => {
  const token = generateToken();
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + config.security.verification_token_expiry_hours);
  return { token, expiry };
};

module.exports = {
  generateToken,
  generateOTP,
  hashOTP,
  verifyOTP,
  generateVerificationToken,
};
