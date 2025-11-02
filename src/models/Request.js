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

const requestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  details: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  category: {
    type: String,
    required: true,
    enum: ['errands', 'moving', 'repairs', 'gardening', 'tech', 'tutoring', 'other'],
    index: true,
  },
  whenTime: {
    type: Date,
    required: true,
  },
  location: {
    type: pointSchema,
    required: true,
    index: '2dsphere',
  },
  status: {
    type: String,
    enum: ['open', 'matched', 'completed', 'cancelled'],
    default: 'open',
    index: true,
  },
}, {
  timestamps: true,
});

// Indexes for geospatial and filtering
requestSchema.index({ location: '2dsphere' });
requestSchema.index({ userId: 1, status: 1 });
requestSchema.index({ category: 1, status: 1 });
requestSchema.index({ status: 1, createdAt: -1 });

// Static method to find open requests
requestSchema.statics.findOpen = function(query = {}) {
  return this.find({ ...query, status: 'open' });
};

// Static method for geospatial search
requestSchema.statics.findNearby = function(lng, lat, radiusKm, additionalFilters = {}) {
  return this.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [lng, lat] },
        distanceField: 'distance',
        maxDistance: radiusKm * 1000, // Convert km to meters
        spherical: true,
        query: { status: 'open', ...additionalFilters },
      },
    },
    {
      $sort: { distance: 1, createdAt: -1 },
    },
  ]);
};

module.exports = mongoose.model('Request', requestSchema);
