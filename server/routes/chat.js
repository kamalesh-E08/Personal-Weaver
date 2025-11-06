const express = require("express");
const ChatHistory = require("../models/ChatHistory");
const Plan = require("../models/Plan");
const Task = require("../models/Task");
const User = require("../models/User");
const auth = require("../middleware/auth");
const { handleChat } = require("../services/geminiApi");

const router = express.Router();
const activeSessions = new Map();

function parseTimeString(timeStr) {
  try {
    const [time, meridian] = timeStr.trim().split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (meridian?.toLowerCase() === "pm" && hours < 12) hours += 12;
    if (meridian?.toLowerCase() === "am" && hours === 12) hours = 0;
    return { hours, minutes: minutes || 0 };
  } catch {
    return { hours: 0, minutes: 0 };
  }
}

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
    const result = await handleChat(message, geminiChat);
    geminiChat = result.chat;
    activeSessions.set(chatSession._id?.toString(), geminiChat);

    chatSession.messages.push({
      role: "user",
      content: message,
      timestamp: new Date(),
    });

    // Add AI response to history
    const responseContent =
      result.type === "plan" || result.type === "tasks"
        ? JSON.stringify(result.data)
        : result.message;

    chatSession.messages.push({
      role: "assistant",
      content: responseContent,
      timestamp: new Date(),
      type: result.type,
    });
    // --- Tag category for History filters ---
    if (result.type === "plan") chatSession.category = "plan";
    else if (result.type === "tasks") chatSession.category = "tasks";
    else chatSession.category = "chat";

    // --- Auto-title chat session ---
    if (result.type === "plan" && result.data?.title) {
      chatSession.sessionTitle = result.data.title;
    }
    await chatSession.save();

    if (result.type === "plan" && result.data?.title) {
      const aiPlan = result.data;
      console.log("Detected AI Plan:", aiPlan.title);

      let duration = "1hour";
      if (aiPlan.schedule?.length >= 2) {
        const start = parseTimeString(aiPlan.schedule[0].time);
        const end = parseTimeString(
          aiPlan.schedule[aiPlan.schedule.length - 1].time
        );
        const diffHours =
          end.hours - start.hours + (end.minutes - start.minutes) / 60;
        if (diffHours > 0) duration = `${diffHours.toFixed(1)}hours`;
      }

      // Infer dueDate from first time in schedule
      let dueDate = new Date();
      if (aiPlan.schedule?.[0]?.time) {
        const { hours, minutes } = parseTimeString(aiPlan.schedule[0].time);
        dueDate.setHours(hours, minutes, 0, 0);
        // If time already passed today, set to tomorrow
        if (dueDate < new Date()) dueDate.setDate(dueDate.getDate() + 1);
      }

      // Auto-detect category from title
      let category = "general";
      const titleLower = aiPlan.title.toLowerCase();
      if (titleLower.includes("workout") || titleLower.includes("gym"))
        category = "fitness";
      else if (titleLower.includes("study") || titleLower.includes("exam"))
        category = "education";
      else if (titleLower.includes("trip") || titleLower.includes("travel"))
        category = "travel";
      else if (titleLower.includes("project")) category = "work";

      // --- Save the Plan ---
      const newPlan = new Plan({
        userId: req.userId,
        title: aiPlan.title,
        description: JSON.stringify(aiPlan),
        status: "active",
        aiGenerated: true,
        progress: 0,
        duration,
        category,
        dueDate,
      });
      await newPlan.save();

      if (Array.isArray(aiPlan.schedule)) {
        for (const item of aiPlan.schedule) {
          const newTask = new Task({
            userId: req.userId,
            plan: newPlan._id,
            title: item.activity || "AI Task",
            description: item.details || "",
            priority: "medium",
            aiGenerated: true,
            dueDate,
            category,
          });
          await newTask.save();
        }
      }

      // --- Update user stats ---
      await User.findByIdAndUpdate(req.userId, {
        $inc: { "stats.plansCreated": 1 },
      });
    }

    // Handle pure AI task list responses
    if (result.type === "tasks" && Array.isArray(result.data?.tasks)) {
      console.log("Detected AI Task list, saving...");
      for (const t of result.data.tasks) {
        const newTask = new Task({
          userId: req.userId,
          title: t.title || "AI Task",
          description: t.description || "",
          priority: "medium",
          aiGenerated: true,
          dueDate: new Date(),
        });
        await newTask.save();
      }

      await User.findByIdAndUpdate(req.userId, {
        $inc: { "stats.tasksCreated": 1 },
      });
    }

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

// --- GET: Latest or Time-Based Active Plan ---
router.get("/latest-plan", auth, async (req, res) => {
  try {
    const latestPlan = await Plan.findOne({
      userId: req.userId,
      status: "active",
    })
      .sort({
        dueDate: 1,
        createdAt: -1,
      })
      .limit(1);

    if (!latestPlan) {
      return res.status(404).json({ message: "No active plan found" });
    }

    res.json(latestPlan);
  } catch (error) {
    console.error("Error fetching latest plan:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


module.exports = router;
