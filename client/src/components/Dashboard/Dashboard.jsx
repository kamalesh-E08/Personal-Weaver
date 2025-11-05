import React, { useState, useEffect } from "react";
import "./Dashboard.css";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    totalPlans: 0,
    activePlans: 0,
    totalChats: 0,
    completionRate: 0,
    productivityScore: 0,
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [recentPlans, setRecentPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("User auth state changed:", { user });
    const token = localStorage.getItem("token");
    console.log("Current auth token:", token ? "Found" : "Not found");

    if (user) {
      if (!token) {
        console.warn("User exists but no token found!");
      }
      console.log("User is authenticated, fetching dashboard data...");
      fetchDashboardData();
    } else {
      console.log("No user found, skipping data fetch");
    }
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      console.log("Starting to fetch dashboard data...");

      // Get stats - using correct endpoint and axios response handling
      console.log("Fetching user stats...");
      const { data: userStats } = await api.get("/users/stats");
      console.log("Stats received:", userStats);
      setStats((prevStats) => {
        console.log("Updating stats from:", prevStats, "to:", userStats);
        return userStats;
      });

      // Get tasks
      console.log("Fetching tasks...");
      const { data: tasksData } = await api.get(
        "/tasks?limit=4&filter=pending&sortBy=priority:-1"
      );
      console.log("Tasks received:", tasksData);
      setRecentTasks((...prevTasks) => {
        console.log("Updating tasks from:", prevTasks, "to:", tasksData);
        return Array.isArray(tasksData) ? tasksData : [];
      });

      // Get plans
      console.log("Fetching plans...");
      const { data: plansData } = await api.get("/plans?limit=3&status=active");
      console.log("Plans received:", plansData);
      setRecentPlans((prevPlans) => {
        console.log(
          "Updating plans from:",
          ...prevPlans,
          "to:",
          plansData?.plans || []
        );
        return plansData?.plans || [];
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      if (error.response) {
        console.error("Server responded with error:", {
          status: error.response.status,
          data: error.response.data,
        });
      }
    } finally {
      console.log("Finished fetching dashboard data, setting loading to false");
      setLoading(false);
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case "high":
        return "badge-danger";
      case "medium":
        return "badge-warning";
      case "low":
        return "badge-success";
      default:
        return "badge-primary";
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title gradient-text">
            Welcome back, {user?.name || "User"}
          </h1>
          <p className="dashboard-subtitle">
            Here's what's happening with your productivity today
          </p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={() => handleNavigation("/chat")}
          >
            <span className="btn-icon">💬</span>
            AI Assistant
          </button>
          <button
            className="btn btn-outline"
            onClick={() => handleNavigation("/planner")}
          >
            <span className="btn-icon">🧠</span>
            Plan Maker
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card card">
          <div className="stat-header">
            <span className="stat-label">Tasks Completed</span>
            <span className="stat-icon">✅</span>
          </div>
          {stats.totalTasks === 0 ? (
            <div className="empty-stat">
              <div className="stat-value">No tasks yet</div>
              <p className="stat-message">
                Create your first task to get started!
              </p>
            </div>
          ) : (
            <>
              <div className="stat-value">
                {stats.completedTasks}/{stats.totalTasks}
              </div>
              <div className="stat-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${
                        (stats.completedTasks / Math.max(stats.totalTasks, 1)) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="stat-card card">
          <div className="stat-header">
            <span className="stat-label">Productivity Score</span>
            <span className="stat-icon">📊</span>
          </div>
          {stats.productivityScore === 0 ? (
            <div className="empty-stat">
              <div className="stat-value">Let's begin!</div>
              <p className="stat-message">Complete tasks to build your score</p>
            </div>
          ) : (
            <div className="stat-value">{stats.productivityScore}%</div>
          )}
        </div>

        <div className="stat-card card">
          <div className="stat-header">
            <span className="stat-label">Active Plans</span>
            <span className="stat-icon">🎯</span>
          </div>
          {stats.activePlans === 0 ? (
            <div className="empty-stat">
              <div className="stat-value">Start planning</div>
              <p className="stat-message">
                Create a plan with our AI assistant
              </p>
            </div>
          ) : (
            <div className="stat-value">{stats.activePlans}</div>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Recent Tasks */}
        <div className="dashboard-section card">
          <div className="section-header">
            <div>
              <h3 className="section-title">Recent Tasks</h3>
              <p className="section-subtitle">Your latest AI-generated tasks</p>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleNavigation("/tasks")}
            >
              View All →
            </button>
          </div>
          <div className="tasks-list">
            {recentTasks.length === 0 ? (
              <div className="empty-state">
                <p>No tasks found</p>
                <small>Create some tasks to get started!</small>
              </div>
            ) : (
              recentTasks.map((task) => (
                <div key={task._id} className="task-item">
                  <div className="task-checkbox">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => {}}
                    />
                  </div>
                  <div className="task-content">
                    <h4
                      className={`task-title ${
                        task.completed ? "completed" : ""
                      }`}
                    >
                      {task.title}
                    </h4>
                    <p className="task-description">{task.description}</p>
                  </div>
                  <div className="task-badges">
                    {task.aiGenerated && (
                      <span className="badge badge-info">
                        <span className="badge-icon">✨</span>
                        AI
                      </span>
                    )}
                    <span
                      className={`badge ${getPriorityBadgeClass(
                        task.priority
                      )}`}
                    >
                      {task.priority}
                    </span>
                  </div>
                </div>
              ))
            )}
            <button
              className="btn btn-outline add-task-btn"
              onClick={() => handleNavigation("/tasks")}
            >
              <span className="btn-icon">+</span>
              Generate New Tasks
            </button>
          </div>
        </div>

        {/* Active Plans */}
        <div className="dashboard-section card">
          <div className="section-header">
            <div>
              <h3 className="section-title">Active Plans</h3>
              <p className="section-subtitle">Your ongoing strategic plans</p>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleNavigation("/planner")}
            >
              View All →
            </button>
          </div>
          <div className="plans-list">
            {recentPlans.length === 0 ? (
              <div className="empty-state">
                <p>No active plans found</p>
                <small>Create a new plan to get started!</small>
              </div>
            ) : (
              recentPlans.map((plan) => (
                <div key={plan._id} className="plan-item">
                  <div className="plan-header">
                    <h4 className="plan-title">{plan.title}</h4>
                    <span
                      className={`badge ${
                        plan.status === "completed"
                          ? "badge-success"
                          : "badge-primary"
                      }`}
                    >
                      {plan.status}
                    </span>
                  </div>
                  <div className="plan-progress">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${plan.progress}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">
                      {plan.progress}% complete
                    </span>
                  </div>
                </div>
              ))
            )}
            <button
              className="btn btn-outline add-plan-btn"
              onClick={() => handleNavigation("/planner")}
            >
              <span className="btn-icon">+</span>
              Create New Plan
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2 className="quick-actions-title">Quick Actions</h2>
        <div className="quick-actions-grid">
          <div
            className="quick-action-card card"
            onClick={() => handleNavigation("/chat")}
          >
            <div className="quick-action-icon">💬</div>
            <h3 className="quick-action-title">Chat with AI</h3>
            <p className="quick-action-description">
              Get instant help and advice
            </p>
          </div>
          <div
            className="quick-action-card card"
            onClick={() => handleNavigation("/planner")}
          >
            <div className="quick-action-icon">🧠</div>
            <h3 className="quick-action-title">Create Plan</h3>
            <p className="quick-action-description">Generate strategic plans</p>
          </div>
          <div
            className="quick-action-card card"
            onClick={() => handleNavigation("/profile")}
          >
            <div className="quick-action-icon">⚡</div>
            <h3 className="quick-action-title">Optimize Settings</h3>
            <p className="quick-action-description">
              Personalize your experience
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
