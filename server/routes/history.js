const express = require("express");
const ChatHistory = require("../models/ChatHistory");
const Plan = require("../models/Plan");
const Task = require("../models/Task");
const auth = require("../middleware/auth");

const router = express.Router();

// GET /api/history
// Returns a merged, sorted list of user activity (chat sessions, plans, tasks)
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.userId;

    const [chats, plans, tasks] = await Promise.all([
      ChatHistory.find({ userId }).lean(),
      Plan.find({ userId }).lean(),
      Task.find({ userId }).lean(),
    ]);

    const chatItems = (chats || []).map((c) => ({
      _id: c._id,
      type: "chat",
      title: c.sessionTitle || "Chat Session",
      description: c.messages?.slice(-1)[0]?.content || "",
      timestamp: c.updatedAt || c.createdAt,
      duration: c.duration || null,
      category: c.category || "chat",
      status: "completed",
    }));

    const planItems = (plans || []).map((p) => ({
      _id: p._id,
      type: "plan",
      title: p.title,
      description: p.description,
      timestamp: p.updatedAt || p.createdAt,
      duration: p.duration || null,
      category: p.category || "plan",
      status: p.status || "active",
    }));

    const taskItems = (tasks || []).map((t) => ({
      _id: t._id,
      type: "tasks",
      title: t.title,
      description: t.description,
      timestamp: t.updatedAt || t.createdAt,
      duration: t.estimatedTime || null,
      category: t.category || "task",
      status: t.completed ? "completed" : "active",
    }));

    const merged = [...chatItems, ...planItems, ...taskItems].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    res.json(merged);
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
