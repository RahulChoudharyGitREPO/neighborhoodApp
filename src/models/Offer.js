const mongoose = require('mongoose');

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

const offerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  skills: [{
    type: String,
    required: true,
    trim: true,
  }],
  radiusKm: {
    type: Number,
    required: true,
    min: 0.5,
    max: 50000,
  },
  home: {
    type: pointSchema,
    required: true,
    index: '2dsphere',
  },
  availability: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
}, {
  timestamps: true,
});

// Indexes
offerSchema.index({ home: '2dsphere' });
offerSchema.index({ userId: 1, isActive: 1 });
offerSchema.index({ skills: 1, isActive: 1 });
offerSchema.index({ isActive: 1, createdAt: -1 });

// Static method to find active offers
offerSchema.statics.findActive = function(query = {}) {
  return this.find({ ...query, isActive: true });
};

// Static method for geospatial search
offerSchema.statics.findNearby = function(lng, lat, radiusKm, additionalFilters = {}) {
  return this.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [lng, lat] },
        distanceField: 'distance',
        maxDistance: radiusKm * 1000, // Convert km to meters
        spherical: true,
        query: { isActive: true, ...additionalFilters },
      },
    },
    {
      $sort: { distance: 1, createdAt: -1 },
    },
  ]);
};

module.exports = mongoose.model('Offer', offerSchema);
