import React, { useState } from "react";
import "./Profile.css";
import Sidebar from "../Sidebar/Sidebar";
import { useAuth } from "../../context/AuthContext";

const Profile = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name || "Alex Wilson",
    email: user?.email || "alex.wilson@example.com",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, CA",
    bio: "Product manager passionate about productivity and AI-powered solutions. Always looking for ways to optimize workflows and achieve better work-life balance.",
    timezone: "America/Los_Angeles",
    workingHours: "9:00 AM - 6:00 PM",
    preferredLanguage: "English",
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyReports: true,
    aiSuggestions: true,
    darkMode: true,
    compactView: false,
    autoGenerateTasks: true,
    smartScheduling: true,
  });

  const stats = {
    totalSessions: 127,
    plansCreated: 15,
    tasksCompleted: 89,
    productivityScore: 92,
    streakDays: 12,
    timesSaved: "24 hours",
  };

  const achievements = [
    {
      id: 1,
      title: "Early Adopter",
      description: "Joined Personal Weaver in the first month",
      icon: "🚀",
      earned: true,
    },
    {
      id: 2,
      title: "Productivity Master",
      description: "Maintained 90%+ productivity score for 30 days",
      icon: "⭐",
      earned: true,
    },
    {
      id: 3,
      title: "Plan Creator",
      description: "Created 10+ AI-powered plans",
      icon: "🧠",
      earned: true,
    },
    {
      id: 4,
      title: "Task Crusher",
      description: "Completed 100+ tasks",
      icon: "✅",
      earned: false,
    },
    {
      id: 5,
      title: "Streak Champion",
      description: "Maintained 30-day activity streak",
      icon: "🔥",
      earned: false,
    },
    {
      id: 6,
      title: "AI Collaborator",
      description: "Had 50+ AI chat sessions",
      icon: "🤖",
      earned: true,
    },
  ];

  const handleInputChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const handleSaveProfile = () => {
    setIsEditing(false);
    console.log("Saving profile:", profile);
  };

  const handlePreferenceChange = (key, value) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="profile-page">
      <Sidebar />
      <div className="profile-content">
        <div className="profile-container">
          {/* Header */}
          <div className="profile-header">
            <div className="header-content">
              <h1 className="profile-title gradient-text">Profile & Settings</h1>
              <p className="profile-subtitle">Manage your account and personalize your experience</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs-container">
            <div className="tabs">
              <button
                className={`tab ${activeTab === "profile" ? "active" : ""}`}
                onClick={() => setActiveTab("profile")}
              >
                <span className="tab-icon">👤</span>
                Profile
              </button>
              <button
                className={`tab ${activeTab === "preferences" ? "active" : ""}`}
                onClick={() => setActiveTab("preferences")}
              >
                <span className="tab-icon">⚙️</span>
                Preferences
              </button>
              <button
                className={`tab ${activeTab === "achievements" ? "active" : ""
                  }`}
                onClick={() => setActiveTab("achievements")}
              >
                <span className="tab-icon">🏆</span>
                Achievements
              </button>
            </div>
          </div>

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="tab-content">
              {/* Profile Header Card */}
              <div className="profile-card card">
                <div className="profile-info">
                  <div className="avatar-section">
                    <div className="user-avatar">
                      <span className="avatar-text">
                        {profile.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <button className="avatar-edit-btn">
                      <span className="btn-icon">📷</span>
                    </button>
                  </div>

                  <div className="user-details">
                    <h2 className="user-name">{profile.name}</h2>
                    <p className="user-email">{profile.email}</p>
                    <div className="user-badges">
                      <span className="badge badge-success">Pro Member</span>
                      <span className="badge badge-primary">
                        Productivity Score: {stats.productivityScore}
                      </span>
                    </div>
                  </div>

                  <button
                    className="btn btn-outline"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <span className="btn-icon">✏️</span>
                    {isEditing ? "Cancel" : "Edit Profile"}
                  </button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="stats-grid">
                <div className="stat-card card">
                  <div className="stat-value">{stats.totalSessions}</div>
                  <div className="stat-label">Total Sessions</div>
                </div>
                <div className="stat-card card">
                  <div className="stat-value">{stats.plansCreated}</div>
                  <div className="stat-label">Plans Created</div>
                </div>
                <div className="stat-card card">
                  <div className="stat-value">{stats.tasksCompleted}</div>
                  <div className="stat-label">Tasks Completed</div>
                </div>
                <div className="stat-card card">
                  <div className="stat-value">{stats.streakDays}</div>
                  <div className="stat-label">Day Streak</div>
                </div>
                <div className="stat-card card">
                  <div className="stat-value">{stats.timesSaved}</div>
                  <div className="stat-label">Time Saved</div>
                </div>
                <div className="stat-card card">
                  <div className="stat-value">{stats.productivityScore}</div>
                  <div className="stat-label">Productivity Score</div>
                </div>
              </div>

              {/* Profile Form */}
              <div className="profile-form-card card">
                <div className="card-header">
                  <h3 className="card-title">Personal Information</h3>
                  <p className="card-subtitle">
                    Update your personal details and preferences
                  </p>
                </div>

                <form className="profile-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="name" className="form-label">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={profile.name}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="input"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="email" className="form-label">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={profile.email}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="input"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="phone" className="form-label">
                        Phone
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={profile.phone}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="input"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="location" className="form-label">
                        Location
                      </label>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={profile.location}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="input"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="bio" className="form-label">
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={profile.bio}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="textarea"
                      rows="4"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="timezone" className="form-label">
                        Timezone
                      </label>
                      <select
                        id="timezone"
                        name="timezone"
                        value={profile.timezone}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="select"
                      >
                        <option value="America/Los_Angeles">
                          Pacific Time
                        </option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/New_York">Eastern Time</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="workingHours" className="form-label">
                        Working Hours
                      </label>
                      <input
                        type="text"
                        id="workingHours"
                        name="workingHours"
                        value={profile.workingHours}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="input"
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <div className="form-actions">
                      <button
                        type="button"
                        onClick={handleSaveProfile}
                        className="btn btn-primary"
                      >
                        <span className="btn-icon">💾</span>
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="btn btn-outline"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === "preferences" && (
            <div className="tab-content">
              <div className="preferences-sections">
                {/* Notifications */}
                <div className="preference-section card">
                  <div className="section-header">
                    <h3 className="section-title">
                      <span className="section-icon">🔔</span>
                      Notifications
                    </h3>
                    <p className="section-subtitle">
                      Manage how you receive notifications and updates
                    </p>
                  </div>

                  <div className="preference-items">
                    <div className="preference-item">
                      <div className="preference-info">
                        <div className="preference-label">
                          Email Notifications
                        </div>
                        <div className="preference-description">
                          Receive updates via email
                        </div>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={preferences.emailNotifications}
                          onChange={(e) =>
                            handlePreferenceChange(
                              "emailNotifications",
                              e.target.checked
                            )
                          }
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <div className="preference-item">
                      <div className="preference-info">
                        <div className="preference-label">
                          Push Notifications
                        </div>
                        <div className="preference-description">
                          Get real-time notifications in your browser
                        </div>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={preferences.pushNotifications}
                          onChange={(e) =>
                            handlePreferenceChange(
                              "pushNotifications",
                              e.target.checked
                            )
                          }
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <div className="preference-item">
                      <div className="preference-info">
                        <div className="preference-label">Weekly Reports</div>
                        <div className="preference-description">
                          Receive weekly productivity summaries
                        </div>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={preferences.weeklyReports}
                          onChange={(e) =>
                            handlePreferenceChange(
                              "weeklyReports",
                              e.target.checked
                            )
                          }
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* AI Assistant */}
                <div className="preference-section card">
                  <div className="section-header">
                    <h3 className="section-title">
                      <span className="section-icon">🧠</span>
                      AI Assistant
                    </h3>
                    <p className="section-subtitle">
                      Customize your AI assistant behavior and suggestions
                    </p>
                  </div>

                  <div className="preference-items">
                    <div className="preference-item">
                      <div className="preference-info">
                        <div className="preference-label">AI Suggestions</div>
                        <div className="preference-description">
                          Enable proactive AI recommendations
                        </div>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={preferences.aiSuggestions}
                          onChange={(e) =>
                            handlePreferenceChange(
                              "aiSuggestions",
                              e.target.checked
                            )
                          }
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <div className="preference-item">
                      <div className="preference-info">
                        <div className="preference-label">
                          Auto-Generate Tasks
                        </div>
                        <div className="preference-description">
                          Automatically create tasks from your plans
                        </div>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={preferences.autoGenerateTasks}
                          onChange={(e) =>
                            handlePreferenceChange(
                              "autoGenerateTasks",
                              e.target.checked
                            )
                          }
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <div className="preference-item">
                      <div className="preference-info">
                        <div className="preference-label">Smart Scheduling</div>
                        <div className="preference-description">
                          Let AI optimize your task scheduling
                        </div>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={preferences.smartScheduling}
                          onChange={(e) =>
                            handlePreferenceChange(
                              "smartScheduling",
                              e.target.checked
                            )
                          }
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Appearance */}
                <div className="preference-section card">
                  <div className="section-header">
                    <h3 className="section-title">
                      <span className="section-icon">🎨</span>
                      Appearance
                    </h3>
                    <p className="section-subtitle">
                      Customize the look and feel of your dashboard
                    </p>
                  </div>

                  <div className="preference-items">
                    <div className="preference-item">
                      <div className="preference-info">
                        <div className="preference-label">Dark Mode</div>
                        <div className="preference-description">
                          Use dark theme for better focus
                        </div>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={preferences.darkMode}
                          onChange={(e) =>
                            handlePreferenceChange("darkMode", e.target.checked)
                          }
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <div className="preference-item">
                      <div className="preference-info">
                        <div className="preference-label">Compact View</div>
                        <div className="preference-description">
                          Show more content in less space
                        </div>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={preferences.compactView}
                          onChange={(e) =>
                            handlePreferenceChange(
                              "compactView",
                              e.target.checked
                            )
                          }
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Achievements Tab */}
          {activeTab === "achievements" && (
            <div className="tab-content">
              <div className="achievements-card card">
                <div className="card-header">
                  <h3 className="card-title">Your Achievements</h3>
                  <p className="card-subtitle">
                    Track your progress and unlock new milestones
                  </p>
                </div>

                <div className="achievements-grid">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`achievement-item ${achievement.earned ? "earned" : "locked"
                        }`}
                    >
                      <div className="achievement-icon">{achievement.icon}</div>
                      <div className="achievement-content">
                        <h4 className="achievement-title">
                          {achievement.title}
                        </h4>
                        <p className="achievement-description">
                          {achievement.description}
                        </p>
                      </div>
                      {achievement.earned && (
                        <span className="badge badge-success">Earned</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
