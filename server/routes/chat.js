const express = require("express");
const ChatHistory = require("../models/ChatHistory");
const auth = require("../middleware/auth");
const { handleChat } = require("../services/geminiApi");

const router = express.Router();
// Store active chat sessions
const activeSessions = new Map();

// Get chat history (returns all sessions grouped by session)
router.get("/history", auth, async (req, res) => {
  try {
    const { category } = req.query; // Extract category from query parameters
    let query = { userId: req.userId };

    if (category) {
      query.category = category; // Add category to the query if provided
    }

    const chatHistory = await ChatHistory.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(chatHistory);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get a single chat session by ID
router.get("/session/:sessionId", auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const chatSession = await ChatHistory.findOne({
      _id: sessionId,
      userId: req.userId,
    });

    if (!chatSession) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.json(chatSession);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Send message to AI
router.post("/message", auth, async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    console.log("message", message);
    // Get or create chat session
    let chatSession = sessionId
      ? await ChatHistory.findOne({ _id: sessionId, userId: req.userId })
      : null;

    // If sessionId was provided but session not found, or invalid user, create new
    if (sessionId && !chatSession) {
      return res
        .status(404)
        .json({ message: "Session not found or access denied" });
    }

    // Create new session if none exists
    if (!chatSession) {
      chatSession = new ChatHistory({
        userId: req.userId,
        sessionTitle: message.substring(0, 50) + "...",
        messages: [],
      });
    }

    // Get or create Gemini chat instance
    let geminiChat = activeSessions.get(chatSession._id?.toString());

    // Get response from Gemini
    const result = await handleChat(message, geminiChat);
    geminiChat = result.chat; // Store updated chat instance
    activeSessions.set(chatSession._id?.toString(), geminiChat);
    console.log("result", result);
    // Add user message to history
    chatSession.messages.push({
      role: "user",
      content: message,
      timestamp: new Date(),
    });

    // Add AI response to history
    const responseContent =
      result.type === "plan" ? JSON.stringify(result.data) : result.message;

    chatSession.messages.push({
      role: "assistant",
      content: responseContent,
      timestamp: new Date(),
      type: result.type,
    });

    await chatSession.save();

    res.json({
      sessionId: chatSession._id,
      response: result.type === "plan" ? result.data : result.message,
      type: result.type,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
