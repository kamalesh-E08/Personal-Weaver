const mongoose = require('mongoose');

const chatHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    messages: [
      {
        role: {
          type: String,
          enum: ["user", "assistant"],
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        type: {
          type: String,
          enum: ["plan", "tasks", "chat", null],
          default: null,
        },
      },
    ],
    sessionTitle: {
      type: String,
      default: "Chat Session",
    },
    category: {
      type: String,
      enum: ["plan", "tasks", "chat"],
      default: "chat",
    },
    duration: {
      type: String,
      default: "0 minutes",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ChatHistory', chatHistorySchema);