const express = require('express');
const router = express.Router();
const Offer = require('../models/Offer');
const User = require('../models/User');
const { logAction } = require('../utils/audit');
const { validate, validateQuery } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const {
  createOfferSchema,
  updateOfferSchema,
  searchOffersSchema,
} = require('../validators/offer.validators');

/**
 * POST /offers
 * Create a new offer
 */
router.post('/', authenticate, validate(createOfferSchema), async (req, res, next) => {
  try {
    const { skills, radiusKm, home, availability } = req.body;

    const offer = await Offer.create({
      userId: req.user.userId,
      skills,
      radiusKm,
      home: {
        type: 'Point',
        coordinates: [home.lng, home.lat],
      },
      availability,
    });

    // Log action
    await logAction(req.user.userId, 'offer.create', req, { offerId: offer._id });

    res.status(201).json({
      id: offer._id,
      userId: offer.userId,
      skills: offer.skills,
      radiusKm: offer.radiusKm,
      home: {
        lng: offer.home.coordinates[0],
        lat: offer.home.coordinates[1],
      },
      availability: offer.availability,
      isActive: offer.isActive,
      createdAt: offer.createdAt,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /offers
 * Search offers with geospatial filtering
 */
router.get('/', authenticate, validateQuery(searchOffersSchema), async (req, res, next) => {
  try {
    const { lng, lat, radiusKm, skill, page, limit } = req.query;

    // Build additional filters
    const additionalFilters = {};
    if (skill) {
      additionalFilters.skills = skill;
    }

    // Get current user to check blocked users
    const currentUser = await User.findById(req.user.userId);
    if (currentUser.privacy.blockedUsers.length > 0) {
      additionalFilters.userId = { $nin: currentUser.privacy.blockedUsers };
    }

    // Perform geospatial search
    const offers = await Offer.findNearby(lng, lat, radiusKm, additionalFilters);

    // Pagination
    const skip = (page - 1) * limit;
    const paginatedOffers = offers.slice(skip, skip + limit);

    // Populate user info
    const results = await Promise.all(
      paginatedOffers.map(async (offer) => {
        const user = await User.findById(offer.userId);
        return {
          id: offer._id,
          userId: offer.userId,
          user: {
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
          },
          skills: offer.skills,
          radiusKm: offer.radiusKm,
          home: {
            lng: offer.home.coordinates[0],
            lat: offer.home.coordinates[1],
          },
          availability: offer.availability,
          isActive: offer.isActive,
          distance: Math.round(offer.distance),
          createdAt: offer.createdAt,
        };
      })
    );

    res.json({
      offers: results,
      pagination: {
        page,
        limit,
        total: offers.length,
        hasMore: skip + limit < offers.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /offers/:id
 * Get single offer by ID
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    // Get user info
    const user = await User.findById(offer.userId);

    res.json({
      id: offer._id,
      userId: offer.userId,
      user: {
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
      },
      skills: offer.skills,
      radiusKm: offer.radiusKm,
      home: {
        lng: offer.home.coordinates[0],
        lat: offer.home.coordinates[1],
      },
      availability: offer.availability,
      isActive: offer.isActive,
      createdAt: offer.createdAt,
      updatedAt: offer.updatedAt,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /offers/:id
 * Update offer (only by owner)
 */
router.patch('/:id', authenticate, validate(updateOfferSchema), async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    // Check ownership
    if (!offer.userId.equals(req.user.userId)) {
      return res.status(403).json({ error: 'Not authorized to update this offer' });
    }

    // Update fields
    const updates = {};
    if (req.body.skills) updates.skills = req.body.skills;
    if (req.body.radiusKm) updates.radiusKm = req.body.radiusKm;
    if (req.body.availability !== undefined) updates.availability = req.body.availability;
    if (req.body.isActive !== undefined) updates.isActive = req.body.isActive;
    if (req.body.home) {
      updates.home = {
        type: 'Point',
        coordinates: [req.body.home.lng, req.body.home.lat],
      };
    }

    Object.assign(offer, updates);
    await offer.save();

    // Log action
    await logAction(req.user.userId, 'offer.update', req, { offerId: offer._id });

    res.json({
      id: offer._id,
      skills: offer.skills,
      radiusKm: offer.radiusKm,
      home: {
        lng: offer.home.coordinates[0],
        lat: offer.home.coordinates[1],
      },
      availability: offer.availability,
      isActive: offer.isActive,
      updatedAt: offer.updatedAt,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
