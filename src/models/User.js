const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/env');

const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point',
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true,
  },
}, { _id: false });

const userSchema = new mongoose.Schema({
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  bio: {
    type: String,
    maxlength: 500,
    default: '',
  },
  avatarUrl: {
    type: String,
    default: '',
  },
  avatarPublicId: {
    type: String,
    default: '',
  },
  address: {
    type: String,
    maxlength: 300,
    default: '',
  },
  skills: [{
    type: String,
    trim: true,
  }],
  home: {
    type: pointSchema,
    index: '2dsphere',
  },
  radiusKm: {
    type: Number,
    default: config.geo.default_radius_km,
    min: config.geo.min_radius_km,
    max: config.geo.max_radius_km,
  },
  role: {
    type: String,
    enum: ['helper', 'requester', 'both'],
    default: null, // Will be set during role selection
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  privacy: {
    maskExactLocation: {
      type: Boolean,
      default: false,
    },
    blockedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
}, {
  timestamps: true,
});

// Index for geospatial queries
userSchema.index({ home: '2dsphere' });
userSchema.index({ isDeleted: 1 });
userSchema.index({ skills: 1 });

// Virtual for ratings
userSchema.virtual('ratings', {
  ref: 'Rating',
  localField: '_id',
  foreignField: 'toUserId',
});

// Method to check if user has blocked another user
userSchema.methods.hasBlocked = function(userId) {
  return this.privacy.blockedUsers.some(id => id.equals(userId));
};

// Static method to find active users
userSchema.statics.findActive = function(query = {}) {
  return this.find({ ...query, isDeleted: false });
};

module.exports = mongoose.model('User', userSchema);
