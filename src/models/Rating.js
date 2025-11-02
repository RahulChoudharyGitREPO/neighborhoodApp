const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true,
    index: true,
  },
  stars: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    maxlength: 500,
    default: '',
  },
}, {
  timestamps: true,
});

// Prevent duplicate ratings for same match
ratingSchema.index({ fromUserId: 1, matchId: 1 }, { unique: true });
ratingSchema.index({ toUserId: 1, createdAt: -1 });

// Static method to calculate average rating for a user
ratingSchema.statics.getAverageRating = async function(userId) {
  const result = await this.aggregate([
    { $match: { toUserId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$stars' },
        totalRatings: { $sum: 1 },
      },
    },
  ]);

  if (result.length === 0) {
    return { averageRating: 0, totalRatings: 0 };
  }

  return {
    averageRating: Math.round(result[0].averageRating * 10) / 10,
    totalRatings: result[0].totalRatings,
  };
};

module.exports = mongoose.model('Rating', ratingSchema);
