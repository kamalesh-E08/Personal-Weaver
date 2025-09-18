import React, { useState, useEffect, useCallback } from "react";
import "./Tasks.css";
import Sidebar from "../Sidebar/Sidebar";
import { useAuth } from "../../context/AuthContext";

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("priority");
  const [loading, setLoading] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { user } = useAuth();

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams();
      if (filter !== "all") {
        queryParams.append("filter", filter);
      }
      if (sortBy !== "none") {
        queryParams.append("sortBy", sortBy);
      }

      const response = await fetch(`/api/tasks?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  }, [filter, sortBy]);

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user, fetchTasks]);

  const filteredTasks = tasks.filter((task) => {
    if (filter === "completed") return task.completed;
    if (filter === "pending") return !task.completed;
    if (filter === "ai-generated") return task.aiGenerated;
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === "priority") {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    } else if (sortBy === "dueDate") {
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    return 0;
  });

  const getPriorityColor = (priority) => {
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

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "high":
        return "🔴";
      case "medium":
        return "🟡";
      case "low":
        return "🟢";
      default:
        return "⚪";
    }
  };

  const toggleTaskCompletion = async (taskId) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task._id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
    try {
      const token = localStorage.getItem("token");
      const taskToUpdate = tasks.find((task) => task._id === taskId);
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ completed: !taskToUpdate.completed }),
      });
      if (!response.ok) {
        throw new Error("Failed to update task completion");
      }
      // If the update was successful, refetch tasks to ensure state is synchronized with backend
      fetchTasks();
    } catch (error) {
      console.error("Error toggling task completion:", error);
      // Revert local state if API call fails
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task._id === taskId ? { ...task, completed: !task.completed } : task
        )
      );
    }
  };

  const generateAITasks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/tasks/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ count: 2 }), // Generate 2 tasks as an example
      });
      if (!response.ok) {
        throw new Error("Failed to generate AI tasks");
      }
      const newTasks = await response.json();
      setTasks((prevTasks) => [...prevTasks, ...newTasks]);
    } catch (error) {
      console.error("Error generating AI tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const completedCount = tasks.filter((task) => task.completed).length;
  const pendingCount = tasks.filter((task) => !task.completed).length;
  const aiGeneratedCount = tasks.filter((task) => task.aiGenerated).length;

  return (
    <div className="tasks-page">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={setIsSidebarCollapsed}
      />
      <div
        className={`tasks-content ${
          isSidebarCollapsed ? "sidebar-collapsed" : ""
        }`}
      >
        <div className="tasks-container">
          {/* Header */}
          <div className="tasks-header">
            <div className="header-content">
              <h1 className="tasks-title gradient-text">Task Management</h1>
              <p className="tasks-subtitle">Organize and track your AI-generated tasks</p>
            </div>
            <div className="header-actions">
              <button className="btn btn-primary">
                <span className="btn-icon">+</span>
                Generate Tasks
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card card">
              <div className="stat-header">
                <span className="stat-label">Total Tasks</span>
                <span className="stat-icon">✅</span>
              </div>
              <div className="stat-value">{tasks.length}</div>
              <div className="stat-change">All tasks</div>
            </div>

            <div className="stat-card card">
              <div className="stat-header">
                <span className="stat-label">Completed</span>
                <span className="stat-icon">✅</span>
              </div>
              <div className="stat-value">{completedCount}</div>
              <div className="stat-change">
                {Math.round((completedCount / Math.max(tasks.length, 1)) * 100)}
                % completion rate
              </div>
            </div>

            <div className="stat-card card">
              <div className="stat-header">
                <span className="stat-label">Pending</span>
                <span className="stat-icon">⏳</span>
              </div>
              <div className="stat-value">{pendingCount}</div>
              <div className="stat-change">Remaining tasks</div>
            </div>

            <div className="stat-card card">
              <div className="stat-header">
                <span className="stat-label">AI Generated</span>
                <span className="stat-icon">✨</span>
              </div>
              <div className="stat-value">{aiGeneratedCount}</div>
              <div className="stat-change">Smart suggestions</div>
            </div>
          </div>

          {/* Filters and Controls */}
          <div className="controls-section">
            <div className="filters">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="select"
              >
                <option value="all">All Tasks</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="ai-generated">AI Generated</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="select"
              >
                <option value="priority">Sort by Priority</option>
                <option value="dueDate">Sort by Due Date</option>
                <option value="category">Sort by Category</option>
              </select>
            </div>

            <button className="btn btn-outline">
              <span className="btn-icon">+</span>
              Add Manual Task
            </button>
          </div>

          {/* Tasks List */}
          <div className="tasks-list">
            {sortedTasks.map((task) => (
              <div key={task._id} className="task-card card">
                <div className="task-content">
                  <div className="task-main">
                    <div className="task-checkbox">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTaskCompletion(task._id)}
                        className="checkbox"
                      />
                    </div>

                    <div className="task-info">
                      <h3
                        className={`task-title ${
                          task.completed ? "completed" : ""
                        }`}
                      >
                        {task.title}
                      </h3>
                      <p className="task-description">{task.description}</p>

                      <div className="task-meta">
                        <div className="meta-item">
                          <span className="meta-icon">📅</span>
                          <span>
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-icon">⏱️</span>
                          <span>Est: {task.estimatedTime}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="task-badges">
                    {task.aiGenerated && (
                      <span className="badge badge-info">
                        <span className="badge-icon">✨</span>
                        AI
                      </span>
                    )}
                    <span
                      className={`badge ${getPriorityColor(task.priority)}`}
                    >
                      <span className="badge-icon">
                        {getPriorityIcon(task.priority)}
                      </span>
                      {task.priority}
                    </span>
                    <span className="badge badge-primary">{task.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {sortedTasks.length === 0 && (
            <div className="empty-state card">
              <div className="empty-icon">✅</div>
              <h3 className="empty-title">No tasks found</h3>
              <p className="empty-description">
                {filter === 'all'
                  ? "You don't have any tasks yet. Let AI generate some for you!"
                  : `No tasks match the current filter: ${filter}`}
              </p>
              <button
                className="btn btn-primary"
                onClick={generateAITasks}
              >
                <span className="btn-icon">✨</span>
                Generate AI Tasks
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tasks;
