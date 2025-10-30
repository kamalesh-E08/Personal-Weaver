const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

// Helper functions
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET);
};

const formatUserResponse = (user) => {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
  };
};

const handleError = (res, error) => {
  res.status(500).json({ message: "Server error", error: error.message });
};

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: "Missing required fields" });
    }


    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      achievements: [
        {
          id: "1",
          title: "Welcome Aboard",
          description: "Successfully created your Personal Weaver account",
          icon: "🎉",
          earned: true,
          earnedDate: new Date(),
        },
      ],
    });

    await user.save();

    const token = generateToken(user._id);
    res.status(201).json({
      message: "User created successfully",
      token,
      user: formatUserResponse(user),
    });
    console.log(req.body);
  } catch (error) {
    handleError(res, error);
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and validate credentials
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Update stats
    user.stats.totalSessions += 1;
    await user.save();

    const token = generateToken(user._id);
    res.json({
      message: "Login successful",
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    handleError(res, error);
  }
});

// Get current user
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    handleError(res, error);
  }
});

module.exports = router;
