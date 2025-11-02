const mongoose = require('mongoose');

const threadSchema = new mongoose.Schema({
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true,
    unique: true,
    index: true,
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  lastMessageAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index for finding threads by participants
threadSchema.index({ participants: 1 });
threadSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model('Thread', threadSchema);
