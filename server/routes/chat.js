const express = require('express');
const ChatHistory = require('../models/ChatHistory');
const auth = require('../middleware/auth');

const router = express.Router();

// Get chat history
router.get('/history', auth, async (req, res) => {
  try {
    const chatHistory = await ChatHistory.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json(chatHistory);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send message to AI
router.post('/message', auth, async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    
    // Mock AI response - in real app, this would call an AI service like OpenAI
    const aiResponses = [
      "I'd be happy to help you with that! Let me break this down into actionable steps for you.",
      "That's a great question! Based on your productivity patterns, I recommend focusing on high-priority tasks first.",
      "I can help you create a structured plan for this. Let's start by identifying your main objectives.",
      "Here are some personalized suggestions based on your goals and current progress.",
      "I understand what you're looking for. Let me provide you with some strategic recommendations.",
      "That's an excellent goal! I can help you create a step-by-step plan to achieve it effectively."
    ];
    
    const aiResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
    
    // Find or create chat session
    let chatSession = sessionId ? 
      await ChatHistory.findById(sessionId) : 
      new ChatHistory({
        userId: req.userId,
        sessionTitle: message.substring(0, 50) + '...',
        messages: []
      });
    
    // Add user message
    chatSession.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });
    
    // Add AI response
    chatSession.messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    });
    
    await chatSession.save();
    
    res.json({
      sessionId: chatSession._id,
      response: aiResponse,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
