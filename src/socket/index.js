const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/jwt');
const Thread = require('../models/Thread');
const Message = require('../models/Message');
const Match = require('../models/Match');
const LiveLocation = require('../models/LiveLocation');
const config = require('../config/env');

/**
 * Initialize Socket.IO server
 */
function initializeSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: config.ws.cors_origin,
      credentials: true,
    },
    path: '/ws',
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = verifyAccessToken(token);
      socket.userId = decoded.userId;
      socket.email = decoded.email;

      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`[WS] User connected: ${socket.userId}`);

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    /**
     * Join a thread room for chat
     */
    socket.on('thread:join', async (data) => {
      try {
        const { threadId } = data;

        // Verify thread exists and user is participant
        const thread = await Thread.findById(threadId);
        if (!thread) {
          return socket.emit('error', { message: 'Thread not found' });
        }

        if (!thread.participants.some(p => p.equals(socket.userId))) {
          return socket.emit('error', { message: 'Not authorized' });
        }

        socket.join(`thread:${threadId}`);
        socket.emit('thread:joined', { threadId });
        console.log(`[WS] User ${socket.userId} joined thread ${threadId}`);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    /**
     * Leave a thread room
     */
    socket.on('thread:leave', (data) => {
      const { threadId } = data;
      socket.leave(`thread:${threadId}`);
      console.log(`[WS] User ${socket.userId} left thread ${threadId}`);
    });

    /**
     * Send a message (also broadcasts to room)
     */
    socket.on('message:new', async (data) => {
      try {
        const { threadId, body, attachments } = data;

        // Verify thread and participation
        const thread = await Thread.findById(threadId);
        if (!thread || !thread.participants.some(p => p.equals(socket.userId))) {
          return socket.emit('error', { message: 'Not authorized' });
        }

        // Create message
        const message = await Message.create({
          threadId,
          senderId: socket.userId,
          body,
          attachments: attachments || [],
        });

        // Update thread
        thread.lastMessageAt = new Date();
        await thread.save();

        // Broadcast to thread room
        io.to(`thread:${threadId}`).emit('message:new', {
          id: message._id,
          threadId: message.threadId,
          senderId: message.senderId,
          body: message.body,
          attachments: message.attachments,
          createdAt: message.createdAt,
        });

        console.log(`[WS] Message sent in thread ${threadId}`);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    /**
     * Mark message as read
     */
    socket.on('message:read', async (data) => {
      try {
        const { messageId } = data;

        const message = await Message.findById(messageId);
        if (!message) return;

        // Add to readBy if not already read
        if (!message.readBy.some(r => r.userId.equals(socket.userId))) {
          message.readBy.push({ userId: socket.userId, readAt: new Date() });
          await message.save();

          // Notify other participants
          const thread = await Thread.findById(message.threadId);
          thread.participants.forEach(participantId => {
            if (!participantId.equals(socket.userId)) {
              io.to(`user:${participantId}`).emit('message:read', {
                messageId,
                userId: socket.userId,
              });
            }
          });
        }
      } catch (error) {
        console.error('[WS] Error marking message as read:', error);
      }
    });

    /**
     * User typing indicator
     */
    socket.on('user:typing', async (data) => {
      try {
        const { threadId, isTyping } = data;

        // Verify thread participation
        const thread = await Thread.findById(threadId);
        if (thread && thread.participants.some(p => p.equals(socket.userId))) {
          // Broadcast to other participants
          socket.to(`thread:${threadId}`).emit('user:typing', {
            userId: socket.userId,
            isTyping,
          });
        }
      } catch (error) {
        console.error('[WS] Error handling typing event:', error);
      }
    });

    /**
     * Join tracking room for realtime location updates
     */
    socket.on('tracking:join', async (data) => {
      try {
        const { matchId } = data;

        // Verify match exists and user is participant
        const match = await Match.findById(matchId);
        if (!match) {
          return socket.emit('error', { message: 'Match not found' });
        }

        if (!match.requesterId.equals(socket.userId) && !match.helperId.equals(socket.userId)) {
          return socket.emit('error', { message: 'Not authorized' });
        }

        if (!match.trackingEnabled) {
          return socket.emit('error', { message: 'Tracking not enabled for this match' });
        }

        socket.join(`track:${matchId}`);
        socket.emit('tracking:joined', { matchId });
        console.log(`[WS] User ${socket.userId} joined tracking for match ${matchId}`);

        // Send current location if exists
        const currentLocation = await LiveLocation.findOne({ matchId });
        if (currentLocation) {
          socket.emit('location:update', {
            matchId,
            helperId: currentLocation.helperId,
            coordinates: currentLocation.coordinates,
            speed: currentLocation.speed,
            heading: currentLocation.heading,
            updatedAt: currentLocation.updatedAt,
          });
        }
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    /**
     * Helper sends location update
     */
    socket.on('location:update', async (data) => {
      try {
        const { matchId, lng, lat, speed, heading } = data;

        // Verify match and user is helper
        const match = await Match.findById(matchId);
        if (!match || !match.helperId.equals(socket.userId)) {
          return socket.emit('error', { message: 'Not authorized' });
        }

        if (!match.trackingEnabled) {
          return socket.emit('error', { message: 'Tracking not enabled' });
        }

        // Update or create live location using upsert to avoid race conditions
        const liveLocation = await LiveLocation.findOneAndUpdate(
          { matchId, helperId: socket.userId },
          {
            $set: {
              coordinates: { lng, lat },
              speed: speed || 0,
              heading: heading || 0,
              updatedAt: new Date(),
            }
          },
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true
          }
        );

        // Broadcast to tracking room
        io.to(`track:${matchId}`).emit('location:update', {
          matchId,
          helperId: socket.userId,
          coordinates: { lng, lat },
          speed: speed || 0,
          heading: heading || 0,
          updatedAt: liveLocation.updatedAt,
        });

        console.log(`[WS] Location updated for match ${matchId}`);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    /**
     * Leave tracking room
     */
    socket.on('tracking:leave', (data) => {
      const { matchId } = data;
      socket.leave(`track:${matchId}`);
      console.log(`[WS] User ${socket.userId} left tracking for match ${matchId}`);
    });

    /**
     * Disconnect handler
     */
    socket.on('disconnect', () => {
      console.log(`[WS] User disconnected: ${socket.userId}`);
    });
  });

  console.log('[WS] Socket.IO server initialized');

  return io;
}

module.exports = initializeSocket;
