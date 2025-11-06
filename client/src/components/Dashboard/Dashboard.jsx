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
  const [activePlans, setActivePlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const parseTimeToDate = (timeStr) => {
    try {
      const now = new Date();
      const today = now.toDateString();

      if (timeStr.includes("-")) {
        const [start] = timeStr.split("-");
        return new Date(`${today} ${start.trim()}`);
      }
      return new Date(`${today} ${timeStr}`);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // === Fetch stats ===
      const { data: userStats } = await api.get("/users/stats");

      // === Fetch all tasks ===
      const { data: tasksData } = await api.get("/tasks?sortBy=createdAt:-1");
      const allTasks = Array.isArray(tasksData) ? tasksData : [];

      const totalTasks = allTasks.length;
      const completedTasks = allTasks.filter((t) => t.completed).length;
      const pendingTasks = totalTasks - completedTasks;

      // === Fetch plans ===
      const { data: plansData } = await api.get("/plans");
      const allPlans = Array.isArray(plansData?.plans)
        ? plansData.plans
        : plansData;

      // === Detect time-based active plans ===
      const now = new Date();
      const activePlansList = allPlans
        .filter((plan) => plan.status === "active")
        .map((plan) => {
          let nextTime = Infinity;
          try {
            const parsed =
              typeof plan.description === "string"
                ? JSON.parse(plan.description)
                : plan.description;

            if (parsed?.schedule?.length > 0) {
              const times = parsed.schedule
                .map((item) => parseTimeToDate(item.time))
                .filter(Boolean)
                .sort((a, b) => a - b);
              if (times.length > 0) nextTime = times[0];
            }
          } catch {
            nextTime = Infinity;
          }
          return { ...plan, nextTime };
        })
        .sort((a, b) => new Date(a.nextTime) - new Date(b.nextTime));

      const latestPlan = activePlansList[0];

      // === Productivity ===
      const completionRate =
        totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      const productivityScore = Math.min(
        100,
        Math.round(completionRate + activePlansList.length * 5)
      );

      setStats({
        ...userStats,
        totalTasks,
        completedTasks,
        pendingTasks,
        totalPlans: allPlans.length,
        activePlans: activePlansList.length,
        completionRate: Math.round(completionRate),
        productivityScore,
      });
      setRecentTasks(allTasks.slice(0, 4));
      setActivePlans(activePlansList.slice(0, 3)); // top 3 active
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
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

  const handleNavigation = (path) => navigate(path);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container fade-in">
      {/* HEADER */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title gradient-text">
            Welcome back, {user?.name || "User"} 👋
          </h1>
          <p className="dashboard-subtitle">
            Here's your productivity summary today
          </p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={() => handleNavigation("/chat")}
          >
            💬 AI Assistant
          </button>
          <button
            className="btn btn-outline"
            onClick={() => handleNavigation("/planner")}
          >
            🧠 Plan Maker
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="stats-grid">
        {[
          {
            label: "Tasks Completed",
            icon: "✅",
            value: `${stats.completedTasks}/${stats.totalTasks}`,
          },
          {
            label: "Productivity Score",
            icon: "⚡",
            value: `${stats.productivityScore}%`,
          },
          { label: "Active Plans", icon: "🎯", value: stats.activePlans },
        ].map((item, i) => (
          <div key={i} className="stat-card card">
            <div className="stat-header">
              <span className="stat-label">{item.label}</span>
              <span className="stat-icon">{item.icon}</span>
            </div>
            <div className="stat-value">{item.value}</div>
          </div>
        ))}
      </div>

      {/* ACTIVE PLANS */}
      <div className="dashboard-section card">
        <div className="section-header">
          <h3 className="section-title">Active Plans</h3>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleNavigation("/planner")}
          >
            View All →
          </button>
        </div>
        <div className="plans-list">
          {activePlans.length === 0 ? (
            <div className="empty-state">
              <p>No active plans</p>
              <small>Create your first plan to get started!</small>
            </div>
          ) : (
            activePlans.map((plan, i) => (
              <div
                key={plan._id}
                className={`plan-item ${i === 0 ? "highlight-plan" : ""}`}
              >
                <div className="plan-header">
                  <h4 className="plan-title">
                    {i === 0 ? "🔥 Next Up: " : ""}
                    {plan.title}
                  </h4>
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
                  <div className="progress-bar small">
                    <div
                      className="progress-fill"
                      style={{ width: `${plan.progress || 0}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">
                    {plan.progress || 0}% complete
                  </span>
                </div>
                <p className="plan-meta">
                  📅 Due:{" "}
                  {plan.dueDate
                    ? new Date(plan.dueDate).toLocaleDateString()
                    : "—"}
                  {"  •  "}
                  🏷️ {plan.category || "General"}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RECENT TASKS */}
      <div className="dashboard-section card">
        <div className="section-header">
          <h3 className="section-title">Recent Tasks</h3>
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
            </div>
          ) : (
            recentTasks.map((task) => (
              <div key={task._id} className="task-item">
                <div className="task-checkbox">
                  <input type="checkbox" checked={task.completed} readOnly />
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
                  <span
                    className={`badge ${getPriorityBadgeClass(task.priority)}`}
                  >
                    {task.priority}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
