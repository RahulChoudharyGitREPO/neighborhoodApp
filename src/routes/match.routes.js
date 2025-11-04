const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const Request = require('../models/Request');
const Offer = require('../models/Offer');
const Thread = require('../models/Thread');
const Message = require('../models/Message');
const LiveLocation = require('../models/LiveLocation');
const { logAction } = require('../utils/audit');
const notificationService = require('../utils/notification');
const { generateWsToken } = require('../utils/jwt');
const { validate, validateQuery } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const {
  createMatchSchema,
  updateMatchStatusSchema,
  sendMessageSchema,
  getMessagesSchema,
} = require('../validators/match.validators');

/**
 * POST /matches
 * Create a match between request and offer
 */
router.post('/', authenticate, validate(createMatchSchema), async (req, res, next) => {
  try {
    const { requestId, offerId } = req.body;

    // Verify request exists
    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Verify request is open
    if (request.status !== 'open') {
      return res.status(400).json({ error: 'Request is not open' });
    }

    let helperId;
    let offer = null;

    if (offerId) {
      // If offerId provided, use it (traditional flow)
      offer = await Offer.findById(offerId);
      if (!offer) {
        return res.status(404).json({ error: 'Offer not found' });
      }
      helperId = offer.userId;

      // Check if match already exists
      const existingMatch = await Match.findOne({ requestId, offerId });
      if (existingMatch) {
        // Return existing thread instead of error
        const existingThread = await Thread.findOne({ matchId: existingMatch._id });
        return res.status(200).json({
          match: {
            id: existingMatch._id,
            requestId: existingMatch.requestId,
            offerId: existingMatch.offerId,
            requesterId: existingMatch.requesterId,
            helperId: existingMatch.helperId,
            status: existingMatch.status,
            createdAt: existingMatch.createdAt,
          },
          thread: {
            id: existingThread._id,
            matchId: existingThread.matchId,
          },
          chatThreadId: existingThread._id,
        });
      }
    } else {
      // Direct helper-to-request match (simplified flow)
      helperId = req.user.userId;

      // Check if this helper already has a match for this request
      const existingMatch = await Match.findOne({
        requestId,
        helperId: req.user.userId
      });

      if (existingMatch) {
        // Return existing thread instead of error
        const existingThread = await Thread.findOne({ matchId: existingMatch._id });
        return res.status(200).json({
          match: {
            id: existingMatch._id,
            requestId: existingMatch.requestId,
            offerId: existingMatch.offerId,
            requesterId: existingMatch.requesterId,
            helperId: existingMatch.helperId,
            status: existingMatch.status,
            createdAt: existingMatch.createdAt,
          },
          thread: {
            id: existingThread._id,
            matchId: existingThread.matchId,
          },
          chatThreadId: existingThread._id,
        });
      }
    }

    // Prevent requester from matching with their own request
    if (request.userId.equals(helperId)) {
      return res.status(400).json({ error: 'Cannot match with your own request' });
    }

    // Create match
    const match = await Match.create({
      requestId,
      offerId: offerId || null,
      requesterId: request.userId,
      helperId: helperId,
      status: 'pending',
    });

    // Create thread for chat
    const thread = await Thread.create({
      matchId: match._id,
      participants: [request.userId, helperId],
    });

    // Don't update request status until requester accepts
    // request.status = 'matched';
    // await request.save();

    // Send notifications
    await notificationService.sendMatchNotification(request.userId, match._id);

    // Log action
    await logAction(req.user.userId, 'match.create', req, { matchId: match._id });

    res.status(201).json({
      match: {
        id: match._id,
        requestId: match.requestId,
        offerId: match.offerId,
        requesterId: match.requesterId,
        helperId: match.helperId,
        status: match.status,
        createdAt: match.createdAt,
      },
      thread: {
        id: thread._id,
        matchId: thread.matchId,
      },
      chatThreadId: thread._id,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /matches
 * Get all matches for the current user
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Find all matches where user is either requester or helper
    const matches = await Match.find({
      $or: [
        { requesterId: userId },
        { helperId: userId }
      ]
    })
    .sort({ createdAt: -1 })
    .populate('requestId', 'title details category')
    .populate('requesterId', 'displayName avatarUrl')
    .populate('helperId', 'displayName avatarUrl');

    // Get thread IDs for each match
    const matchesWithThreads = await Promise.all(
      matches.map(async (match) => {
        const thread = await Thread.findOne({ matchId: match._id });
        return {
          id: match._id,
          _id: match._id,
          requestId: match.requestId,
          offerId: match.offerId,
          requesterId: match.requesterId,
          helperId: match.helperId,
          status: match.status,
          trackingEnabled: match.trackingEnabled,
          chatThreadId: thread ? thread._id : null,
          thread: thread ? { id: thread._id, _id: thread._id } : null,
          createdAt: match.createdAt,
          updatedAt: match.updatedAt,
        };
      })
    );

    res.json({
      matches: matchesWithThreads,
      total: matchesWithThreads.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /matches/:id
 * Get match details
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('requestId')
      .populate('offerId');

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Verify user is participant
    if (!match.requesterId.equals(req.user.userId) && !match.helperId.equals(req.user.userId)) {
      return res.status(403).json({ error: 'Not authorized to view this match' });
    }

    res.json({
      id: match._id,
      request: {
        id: match.requestId._id,
        title: match.requestId.title,
        details: match.requestId.details,
        category: match.requestId.category,
        whenTime: match.requestId.whenTime,
        location: {
          lng: match.requestId.location.coordinates[0],
          lat: match.requestId.location.coordinates[1],
        },
      },
      offer: {
        id: match.offerId._id,
        skills: match.offerId.skills,
      },
      requesterId: match.requesterId,
      helperId: match.helperId,
      status: match.status,
      trackingEnabled: match.trackingEnabled,
      startedAt: match.startedAt,
      endedAt: match.endedAt,
      createdAt: match.createdAt,
      updatedAt: match.updatedAt,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /matches/:id/status
 * Update match status
 */
router.patch('/:id/status', authenticate, validate(updateMatchStatusSchema), async (req, res, next) => {
  try {
    const { status } = req.body;

    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Verify user is participant
    if (!match.requesterId.equals(req.user.userId) && !match.helperId.equals(req.user.userId)) {
      return res.status(403).json({ error: 'Not authorized to update this match' });
    }

    // Update status
    await match.updateStatus(status);

    // If completed, update request status
    if (status === 'completed') {
      await Request.findByIdAndUpdate(match.requestId, { status: 'completed' });
    }

    // Log action
    await logAction(req.user.userId, 'match.status.update', req, { matchId: match._id, status });

    res.json({
      id: match._id,
      status: match.status,
      trackingEnabled: match.trackingEnabled,
      startedAt: match.startedAt,
      endedAt: match.endedAt,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /matches/:id/tracking/start
 * Start tracking for a match (returns WS token and room)
 */
router.post('/:id/tracking/start', authenticate, async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Verify user is participant
    if (!match.requesterId.equals(req.user.userId) && !match.helperId.equals(req.user.userId)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Enable tracking
    await match.enableTracking();

    // Generate WS token
    const wsToken = generateWsToken({
      userId: req.user.userId,
      matchId: match._id,
    });

    res.json({
      room: `track:${match._id}`,
      wsToken,
      trackingEnabled: true,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /threads/:id/messages
 * Get messages in a thread
 */
router.get('/threads/:threadId/messages', authenticate, validateQuery(getMessagesSchema), async (req, res, next) => {
  try {
    const { page, limit } = req.query;

    const thread = await Thread.findById(req.params.threadId);

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    // Verify user is participant
    if (!thread.participants.some(p => p.equals(req.user.userId))) {
      return res.status(403).json({ error: 'Not authorized to view this thread' });
    }

    // Get messages with pagination
    const skip = (page - 1) * limit;
    const messages = await Message.find({ threadId: thread._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('senderId', 'displayName avatarUrl');

    const total = await Message.countDocuments({ threadId: thread._id });

    res.json({
      messages: messages.map(msg => ({
        id: msg._id,
        threadId: msg.threadId,
        sender: {
          id: msg.senderId._id,
          displayName: msg.senderId.displayName,
          avatarUrl: msg.senderId.avatarUrl,
        },
        body: msg.body,
        attachments: msg.attachments,
        createdAt: msg.createdAt,
      })).reverse(), // Reverse to show oldest first
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

/**
 * POST /threads/:id/messages
 * Send a message in a thread
 */
router.post('/threads/:threadId/messages', authenticate, validate(sendMessageSchema), async (req, res, next) => {
  try {
    const { body, attachments } = req.body;

    const thread = await Thread.findById(req.params.threadId);

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    // Verify user is participant
    if (!thread.participants.some(p => p.equals(req.user.userId))) {
      return res.status(403).json({ error: 'Not authorized to send messages in this thread' });
    }

    // Create message
    const message = await Message.create({
      threadId: thread._id,
      senderId: req.user.userId,
      body,
      attachments: attachments || [],
    });

    // Update thread last message time
    thread.lastMessageAt = new Date();
    await thread.save();

    // Send notification to other participant
    const otherParticipant = thread.participants.find(p => !p.equals(req.user.userId));
    if (otherParticipant) {
      await notificationService.sendMessageNotification(
        otherParticipant,
        req.user.userId,
        body.substring(0, 100)
      );
    }

    // Log action
    await logAction(req.user.userId, 'message.send', req, { threadId: thread._id });

    res.status(201).json({
      id: message._id,
      threadId: message.threadId,
      senderId: message.senderId,
      body: message.body,
      attachments: message.attachments,
      createdAt: message.createdAt,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
