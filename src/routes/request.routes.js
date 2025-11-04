const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const User = require('../models/User');
const { logAction } = require('../utils/audit');
const { validate, validateQuery } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const {
  createRequestSchema,
  updateRequestSchema,
  searchRequestsSchema,
} = require('../validators/request.validators');

/**
 * POST /requests
 * Create a new request
 */
router.post('/', authenticate, validate(createRequestSchema), async (req, res, next) => {
  try {
    const { title, details, category, whenTime, location } = req.body;

    const request = await Request.create({
      userId: req.user.userId,
      title,
      details,
      category,
      whenTime,
      location: {
        type: 'Point',
        coordinates: [location.lng, location.lat],
      },
    });

    // Log action
    await logAction(req.user.userId, 'request.create', req, { requestId: request._id });

    res.status(201).json({
      id: request._id,
      userId: request.userId,
      title: request.title,
      details: request.details,
      category: request.category,
      whenTime: request.whenTime,
      location: {
        lng: request.location.coordinates[0],
        lat: request.location.coordinates[1],
      },
      status: request.status,
      createdAt: request.createdAt,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /requests
 * Search requests with geospatial filtering
 */
router.get('/', authenticate, validateQuery(searchRequestsSchema), async (req, res, next) => {
  try {
    const { lng, lat, radiusKm, category, page, limit } = req.query;

    // Build additional filters
    const additionalFilters = {};
    if (category) {
      additionalFilters.category = category;
    }

    // Only show open requests by default (can be overridden with status query param)
    const status = req.query.status || 'open';
    if (status) {
      additionalFilters.status = status;
    }

    // Get current user to check blocked users
    const currentUser = await User.findById(req.user.userId);
    if (currentUser.privacy.blockedUsers.length > 0) {
      additionalFilters.userId = { $nin: currentUser.privacy.blockedUsers };
    }

    // Perform geospatial search
    const requests = await Request.findNearby(lng, lat, radiusKm, additionalFilters);

    // Pagination
    const skip = (page - 1) * limit;
    const paginatedRequests = requests.slice(skip, skip + limit);

    // Populate user info
    const results = await Promise.all(
      paginatedRequests.map(async (req) => {
        const user = await User.findById(req.userId);
        return {
          id: req._id,
          userId: req.userId,
          user: {
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
          },
          title: req.title,
          details: req.details,
          category: req.category,
          whenTime: req.whenTime,
          location: {
            lng: req.location.coordinates[0],
            lat: req.location.coordinates[1],
          },
          status: req.status,
          distance: Math.round(req.distance),
          createdAt: req.createdAt,
        };
      })
    );

    res.json({
      requests: results,
      pagination: {
        page,
        limit,
        total: requests.length,
        hasMore: skip + limit < requests.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /requests/:id
 * Get single request by ID
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Get user info
    const user = await User.findById(request.userId);

    res.json({
      id: request._id,
      userId: request.userId,
      user: {
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
      title: request.title,
      details: request.details,
      category: request.category,
      whenTime: request.whenTime,
      location: {
        lng: request.location.coordinates[0],
        lat: request.location.coordinates[1],
      },
      status: request.status,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /requests/:id
 * Update request (only by owner)
 */
router.patch('/:id', authenticate, validate(updateRequestSchema), async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Check ownership
    if (!request.userId.equals(req.user.userId)) {
      return res.status(403).json({ error: 'Not authorized to update this request' });
    }

    // Cannot update if already matched or in progress
    if (request.status === 'matched' || request.status === 'in-progress' || request.status === 'completed') {
      return res.status(400).json({ error: 'Cannot update request in current status' });
    }

    // Update fields
    const updates = {};
    if (req.body.title) updates.title = req.body.title;
    if (req.body.details) updates.details = req.body.details;
    if (req.body.category) updates.category = req.body.category;
    if (req.body.whenTime) updates.whenTime = req.body.whenTime;
    if (req.body.status) updates.status = req.body.status;
    if (req.body.location) {
      updates.location = {
        type: 'Point',
        coordinates: [req.body.location.lng, req.body.location.lat],
      };
    }

    Object.assign(request, updates);
    await request.save();

    // Log action
    await logAction(req.user.userId, 'request.update', req, { requestId: request._id });

    res.json({
      id: request._id,
      title: request.title,
      details: request.details,
      category: request.category,
      whenTime: request.whenTime,
      location: {
        lng: request.location.coordinates[0],
        lat: request.location.coordinates[1],
      },
      status: request.status,
      updatedAt: request.updatedAt,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /requests/:id
 * Delete request (only by owner)
 */
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Check ownership
    if (!request.userId.equals(req.user.userId)) {
      return res.status(403).json({ error: 'Not authorized to delete this request' });
    }

    // Cannot delete if already matched or completed
    if (request.status === 'matched' || request.status === 'in-progress' || request.status === 'completed') {
      return res.status(400).json({ error: 'Cannot delete request in current status' });
    }

    await request.deleteOne();

    // Log action
    await logAction(req.user.userId, 'request.delete', req, { requestId: request._id });

    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
