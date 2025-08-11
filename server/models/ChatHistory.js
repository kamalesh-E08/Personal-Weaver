const mongoose = require('mongoose');

const chatHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  sessionTitle: {
    type: String,
    default: 'Chat Session'
  },
  category: {
    type: String,
    default: 'General'
  },
  duration: {
    type: String,
    default: '0 minutes'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
