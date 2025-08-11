const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    weeklyReports: { type: Boolean, default: true },
    aiSuggestions: { type: Boolean, default: true },
    darkMode: { type: Boolean, default: true },
    compactView: { type: Boolean, default: false },
    autoGenerateTasks: { type: Boolean, default: true },
    smartScheduling: { type: Boolean, default: true }
  },
  stats: {
    totalSessions: { type: Number, default: 0 },
    plansCreated: { type: Number, default: 0 },
    tasksCompleted: { type: Number, default: 0 },
    productivityScore: { type: Number, default: 0 },
    streakDays: { type: Number, default: 0 }
  },
  achievements: [{
    id: String,
    title: String,
    description: String,
    icon: String,
    earned: { type: Boolean, default: false },
    earnedDate: Date
  }]
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
