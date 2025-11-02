const mongoose = require('mongoose');

const liveLocationSchema = new mongoose.Schema({
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true,
    index: true,
  },
  helperId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  coordinates: {
    lng: { type: Number, required: true },
    lat: { type: Number, required: true },
  },
  speed: {
    type: Number,
    default: 0, // meters per second
  },
  heading: {
    type: Number,
    default: 0, // degrees
  },
  updatedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: false,
});

// Compound unique index - one location per match
liveLocationSchema.index({ matchId: 1, helperId: 1 }, { unique: true });

// Method to update location
liveLocationSchema.methods.updateLocation = function(lng, lat, speed = 0, heading = 0) {
  this.coordinates = { lng, lat };
  this.speed = speed;
  this.heading = heading;
  this.updatedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('LiveLocation', liveLocationSchema);
