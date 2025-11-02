const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  threadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Thread',
    required: true,
    index: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  body: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  attachments: [{
    url: String,
    type: String,
    publicId: String,
  }],
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    readAt: {
      type: Date,
      default: Date.now,
    },
  }],
}, {
  timestamps: true,
});

// Indexes
messageSchema.index({ threadId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1 });

module.exports = mongoose.model('Message', messageSchema);
