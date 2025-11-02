const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/env');

const userContactSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  primaryEmail: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: String,
  emailVerificationExpiry: Date,
  phone: {
    type: String,
    sparse: true,
    unique: true,
  },
  isPhoneVerified: {
    type: Boolean,
    default: false,
  },
  phoneVerificationOtpHash: String,
  phoneVerificationExpiry: Date,
  passwordHash: {
    type: String,
    required: true,
  },
  passwordResetToken: String,
  passwordResetExpiry: Date,
  refreshTokens: [{
    token: String,
    createdAt: { type: Date, default: Date.now },
  }],
}, {
  timestamps: true,
});

// Indexes
userContactSchema.index({ primaryEmail: 1 });
userContactSchema.index({ phone: 1 });
userContactSchema.index({ userId: 1 });

// Hash password before saving
userContactSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();

  // Only hash if it's not already hashed (doesn't start with $2a$ or $2b$)
  if (!this.passwordHash.startsWith('$2')) {
    this.passwordHash = await bcrypt.hash(this.passwordHash, config.security.bcrypt_salt_rounds);
  }
  next();
});

// Method to compare password
userContactSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Method to add refresh token
userContactSchema.methods.addRefreshToken = function(token) {
  this.refreshTokens.push({ token, createdAt: new Date() });
  // Keep only last 5 tokens
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens.slice(-5);
  }
  return this.save();
};

// Method to remove refresh token
userContactSchema.methods.removeRefreshToken = function(token) {
  this.refreshTokens = this.refreshTokens.filter(rt => rt.token !== token);
  return this.save();
};

// Method to check if refresh token exists
userContactSchema.methods.hasRefreshToken = function(token) {
  return this.refreshTokens.some(rt => rt.token === token);
};

module.exports = mongoose.model('UserContact', userContactSchema);
