const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');
const Match = require('../models/Match');
const User = require('../models/User');
const { logAction } = require('../utils/audit');
const { validate, validateQuery } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const {
  createRatingSchema,
  getRatingsSchema,
} = require('../validators/rating.validators');

/**
 * POST /ratings
 * Create a rating for another user
 */
router.post('/', authenticate, validate(createRatingSchema), async (req, res, next) => {
  try {
    const { toUserId, matchId, stars, comment } = req.body;

    // Verify match exists
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Verify match is completed
    if (match.status !== 'completed') {
      return res.status(400).json({ error: 'Can only rate completed matches' });
    }

    // Verify user was participant in match
    if (!match.requesterId.equals(req.user.userId) && !match.helperId.equals(req.user.userId)) {
      return res.status(403).json({ error: 'Not authorized to rate this match' });
    }

    // Verify toUserId is the other participant
    const expectedOtherUser = match.requesterId.equals(req.user.userId)
      ? match.helperId
      : match.requesterId;

    if (!expectedOtherUser.equals(toUserId)) {
      return res.status(400).json({ error: 'Can only rate the other participant in the match' });
    }

    // Check if rating already exists
    const existingRating = await Rating.findOne({
      fromUserId: req.user.userId,
      matchId,
    });

    if (existingRating) {
      return res.status(409).json({ error: 'You have already rated this match' });
    }

    // Create rating
    const rating = await Rating.create({
      fromUserId: req.user.userId,
      toUserId,
      matchId,
      stars,
      comment: comment || '',
    });

    // Log action
    await logAction(req.user.userId, 'rating.create', req, { ratingId: rating._id });

    res.status(201).json({
      id: rating._id,
      fromUserId: rating.fromUserId,
      toUserId: rating.toUserId,
      matchId: rating.matchId,
      stars: rating.stars,
      comment: rating.comment,
      createdAt: rating.createdAt,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /users/:userId/ratings
 * Get ratings for a user
 */
router.get('/users/:userId', authenticate, validateQuery(getRatingsSchema), async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { summary, page, limit } = req.query;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user || user.isDeleted) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If summary only
    if (summary) {
      const stats = await Rating.getAverageRating(userId);
      return res.json({
        averageRating: stats.averageRating,
        totalRatings: stats.totalRatings,
      });
    }

    // Get ratings with pagination
    const skip = (page - 1) * limit;
    const ratings = await Rating.find({ toUserId: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('fromUserId', 'displayName avatarUrl');

    const total = await Rating.countDocuments({ toUserId: userId });

    // Calculate average
    const stats = await Rating.getAverageRating(userId);

    res.json({
      summary: {
        averageRating: stats.averageRating,
        totalRatings: stats.totalRatings,
      },
      ratings: ratings.map(r => ({
        id: r._id,
        from: {
          id: r.fromUserId._id,
          displayName: r.fromUserId.displayName,
          avatarUrl: r.fromUserId.avatarUrl,
        },
        stars: r.stars,
        comment: r.comment,
        createdAt: r.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + limit < total,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
