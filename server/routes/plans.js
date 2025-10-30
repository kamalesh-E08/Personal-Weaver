const express = require('express');
const Plan = require('../models/Plan');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all plans for user
router.get("/", auth, async (req, res) => {
  try {
    const { status, category, duration, sortBy, filter, limit } = req.query;

    let query = { userId: req.userId };

    // Apply filters
    if (status && ["active", "completed", "paused"].includes(status)) {
      query.status = status;
    }
    if (category) {
      query.category = category;
    }
    if (duration) {
      query.duration = duration;
    }
    if (filter === "ai-generated") {
      query.aiGenerated = true;
    }
    if (filter === "manual") {
      query.aiGenerated = false;
    }
    if (filter === "overdue") {
      query.dueDate = { $lt: new Date() };
      query.status = { $ne: "completed" };
    }
    if (filter === "upcoming") {
      query.dueDate = {
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
      };
    }
    if (filter === "high-priority") {
      query.category = "high";
    }

    let plansQuery = Plan.find(query).populate("tasks").select("-__v"); // Exclude version key

    // Apply sorting
    switch (sortBy) {
      case "dueDate":
        plansQuery = plansQuery.sort({ dueDate: 1 });
        break;
      case "progress":
        plansQuery = plansQuery.sort({ progress: -1 });
        break;
      case "title":
        plansQuery = plansQuery.sort({ title: 1 });
        break;
      case "category":
        plansQuery = plansQuery.sort({ category: 1 });
        break;
      default:
        plansQuery = plansQuery.sort({ createdAt: -1 }); // Default: newest first
    }

    // Apply limit if provided
    if (limit) {
      plansQuery = plansQuery.limit(parseInt(limit));
    }

    const plans = await plansQuery;

    // Add metadata about total counts
    const totalPlans = await Plan.countDocuments({ userId: req.userId });
    const activePlans = await Plan.countDocuments({
      userId: req.userId,
      status: "active",
    });
    const completedPlans = await Plan.countDocuments({
      userId: req.userId,
      status: "completed",
    });
    const aiGeneratedPlans = await Plan.countDocuments({
      userId: req.userId,
      aiGenerated: true,
    });

    res.json({
      plans,
      metadata: {
        total: totalPlans,
        active: activePlans,
        completed: completedPlans,
        aiGenerated: aiGeneratedPlans,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create new plan
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, goals, timeline, priority } = req.body;

    // Map frontend fields to backend model
    const duration = timeline?.toLowerCase().replace(" ", "") || "1month";
    const category = priority || "medium";

    // Calculate due date based on duration
    const durationMap = {
      "1week": 7,
      "1month": 30,
      "3months": 90,
      "6months": 180,
      "1year": 365,
    };

    const daysToAdd = durationMap[duration] || 30;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysToAdd);

    const plan = new Plan({
      title,
      description,
      goals: goals || [],
      category,
      duration,
      dueDate,
      userId: req.userId,
      aiGenerated: true,
    });

    await plan.save();

    // Update user stats
    await User.findByIdAndUpdate(req.userId, {
      $inc: { "stats.plansCreated": 1 },
    });

    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


// --- NEW ROUTE TO SAVE THE AI-GENERATED PLAN ---
// @route   POST api/plans/save-ai-plan
// @desc    Save a new plan and its tasks from the AI
// @access  Private
router.post('/save-ai-plan', auth, async (req, res) => {
  try {
    const { title, schedule } = req.body; // Get the AI plan from Chat.jsx

    // 1. Create and save the new "Plan"
    const newPlan = new Plan({
      userId: req.userId, // Comes from your 'auth' middleware
      title: title,
      status: 'active', // Set a default status
      progress: 0,      // Set a default progress
      aiGenerated: true // Mark as AI generated
    });
    
    await newPlan.save();

    // 2. Update user stats (like you do for other new plans)
    await User.findByIdAndUpdate(req.userId, {
      $inc: { 'stats.plansCreated': 1 }
    });

    // 3. Create and save all the "Tasks" linked to this plan
    for (const item of schedule) {
      const newTask = new Task({
        userId: req.userId, // <--- THIS IS THE FIX
        plan: newPlan._id, // Link the task to the plan we just created
        title: `${item.time} - ${item.activity}`,
        description: item.details,
        aiGenerated: true,
        priority: 'medium', // Set a default priority
      });
      
      await newTask.save();
    }

    res.status(201).json({ 
      message: 'AI plan saved successfully', 
      plan: newPlan 
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// --- END OF NEW ROUTE ---


// Update plan
router.put("/:id", auth, async (req, res) => {
  try {
    const plan = await Plan.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );

    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete plan
router.delete("/:id", auth, async (req, res) => {
  try {
    const plan = await Plan.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    res.json({ message: "Plan deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;