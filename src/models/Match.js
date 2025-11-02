const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
    required: true,
    index: true,
  },
  offerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offer',
    required: true,
    index: true,
  },
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  helperId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'enroute', 'arrived', 'completed', 'cancelled'],
    default: 'pending',
    index: true,
  },
  trackingEnabled: {
    type: Boolean,
    default: false,
  },
  startedAt: Date,
  endedAt: Date,
}, {
  timestamps: true,
});

// Composite indexes
matchSchema.index({ requestId: 1, offerId: 1 }, { unique: true });
matchSchema.index({ requesterId: 1, status: 1 });
matchSchema.index({ helperId: 1, status: 1 });
matchSchema.index({ status: 1, createdAt: -1 });

// Method to enable tracking
matchSchema.methods.enableTracking = function() {
  this.trackingEnabled = true;
  return this.save();
};

// Method to update status with timestamp
matchSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;

  if (newStatus === 'active' && !this.startedAt) {
    this.startedAt = new Date();
  }

  if (['completed', 'cancelled'].includes(newStatus) && !this.endedAt) {
    this.endedAt = new Date();
    this.trackingEnabled = false;
  }

  return this.save();
};

module.exports = mongoose.model('Match', matchSchema);
