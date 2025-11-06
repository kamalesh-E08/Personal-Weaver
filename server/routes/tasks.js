const express = require("express");
const Task = require("../models/Task");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const { filter, sortBy, planId} = req.query;
    let query = { userId: req.userId };
    if (planId) {
      query.plan = planId; // ✅ fetch only tasks belonging to this plan
    }
    const { limit } = req.query;

    // Apply filters
    if (filter === "completed") query.completed = true;
    if (filter === "pending") query.completed = false;
    if (filter === "ai-generated") query.aiGenerated = true;

    let tasksQuery = Task.find(query);

    // Apply sorting
    if (sortBy) {
      const [field, order] = sortBy.split(":");
      const sortOrder = order === "-1" ? -1 : 1;

      switch (field) {
        case "priority":
          // Use MongoDB's aggregation to sort by priority level
          tasksQuery = Task.aggregate([
            { $match: query },
            {
              $addFields: {
                priorityOrder: {
                  $switch: {
                    branches: [
                      { case: { $eq: ["$priority", "high"] }, then: 3 },
                      { case: { $eq: ["$priority", "medium"] }, then: 2 },
                      { case: { $eq: ["$priority", "low"] }, then: 1 },
                    ],
                    default: 0,
                  },
                },
              },
            },
            { $sort: { priorityOrder: sortOrder } },
          ]);
          break;
        case "dueDate":
          tasksQuery = tasksQuery.sort({ dueDate: sortOrder });
          break;
        case "createdAt":
          tasksQuery = tasksQuery.sort({ createdAt: sortOrder });
          break;
        default:
          // Default sort by creation date, newest first
          tasksQuery = tasksQuery.sort({ createdAt: -1 });
      }
    }

    // Apply limit if provided
    if (limit) {
      tasksQuery = tasksQuery.limit(parseInt(limit));
    }

    const tasks = await tasksQuery;
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create new task
router.post("/", auth, async (req, res) => {
  try {
    const { title, description, category, dueDate, priority, estimatedTime } =
      req.body;

    const task = new Task({
      title,
      description,
      category,
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week if not provided
      priority: priority || "medium",
      estimatedTime: estimatedTime || "1 hour",
      userId: req.userId,
      aiGenerated: false,
    });

    await task.save();

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update task
router.put("/:id", auth, async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Update user stats if task completed
    if (req.body.completed && !task.completed) {
      await User.findByIdAndUpdate(req.userId, {
        $inc: { "stats.tasksCompleted": 1 },
      });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete task
router.delete("/:id", auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Generate AI tasks
router.post("/generate", auth, async (req, res) => {
  try {
    const { category, count = 5 } = req.body;

    // Mock AI task generation - in real app, this would call an AI service
    const taskTemplates = [
      {
        title: "Review and organize project files",
        category: "Work",
        priority: "medium",
        estimatedTime: "1 hour",
      },
      {
        title: "Schedule team meeting for next week",
        category: "Work",
        priority: "high",
        estimatedTime: "30 minutes",
      },
      {
        title: "Update project documentation",
        category: "Work",
        priority: "medium",
        estimatedTime: "2 hours",
      },
      {
        title: "Plan weekly workout routine",
        category: "Health",
        priority: "low",
        estimatedTime: "45 minutes",
      },
      {
        title: "Read industry articles and trends",
        category: "Learning",
        priority: "low",
        estimatedTime: "1 hour",
      },
      {
        title: "Prepare monthly budget review",
        category: "Finance",
        priority: "high",
        estimatedTime: "1.5 hours",
      },
      {
        title: "Clean and organize workspace",
        category: "Personal",
        priority: "low",
        estimatedTime: "30 minutes",
      },
      {
        title: "Research new productivity tools",
        category: "Learning",
        priority: "medium",
        estimatedTime: "45 minutes",
      },
    ];

    const filteredTemplates = category
      ? taskTemplates.filter((t) => t.category === category)
      : taskTemplates;

    const selectedTasks = filteredTemplates
      .sort(() => 0.5 - Math.random())
      .slice(0, count);

    const tasks = await Promise.all(
      selectedTasks.map((template) => {
        const task = new Task({
          ...template,
          description: `AI-generated task to help improve your ${template.category.toLowerCase()} productivity`,
          dueDate: new Date(
            Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000
          ), // Random date within 7 days
          aiGenerated: true,
          userId: req.userId,
        });
        return task.save();
      })
    );

    res.status(201).json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
