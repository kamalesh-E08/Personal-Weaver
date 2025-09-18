const express = require("express");
const Plan = require("../models/Plan");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

// Get all plans for user
router.get("/", auth, async (req, res) => {
  try {
    const { status } = req.query;
    let query = { userId: req.userId };
    const { limit } = req.query;

    if (status) query.status = status;

    let plansQuery = Plan.find(query).populate("tasks");

    // Apply limit if provided
    if (limit) {
      plansQuery = plansQuery.limit(parseInt(limit));
    }

    const plans = await plansQuery;
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create new plan
router.post("/", auth, async (req, res) => {
  try {
    const { title, description, category, duration } = req.body;

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

// Update plan
router.put("/:id", auth, async (req, res) => {
  try {
    const plan = await Plan.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
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
      return res.status(404).json({ message: "Plan not found" });
    }

    res.json({ message: "Plan deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
