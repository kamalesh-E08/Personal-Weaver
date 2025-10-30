import React, { useState, useEffect, useCallback } from "react";
import "./Tasks.css";
import Layout from "../Layout/Layout";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("priority");
  const [loading, setLoading] = useState(false);
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    category: "Work",
    priority: "medium",
    estimatedTime: "1 hour",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
  });
  const { user } = useAuth();

  const createTask = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/tasks", newTask);
      await fetchTasks();
      setShowAddTaskForm(false);
      setNewTask({
        title: "",
        description: "",
        category: "Work",
        priority: "medium",
        estimatedTime: "1 hour",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      });
    } catch (error) {
      console.error("Error creating task:", error);
    } finally {
      setLoading(false);
    }
  };

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

      const response = await api.get(`/tasks?${queryParams.toString()}`);
      const data = response.data;
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
      const taskToUpdate = tasks.find((task) => task._id === taskId);
      await api.put(`/tasks/${taskId}`, {
        completed: !taskToUpdate.completed,
      });
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
      const response = await api.post("/tasks/generate", {
        count: 3, // Generate 3 tasks at a time
        category: filter !== "all" ? filter : undefined,
      });
      await fetchTasks(); // Refresh the task list to include both AI and manual tasks
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
    <Layout>
      <div className="tasks-container">
        {/* Header */}
        <div className="tasks-header">
          <div className="header-content">
            <h1 className="tasks-title gradient-text">Task Management</h1>
            <p className="tasks-subtitle">
              Organize and track your AI-generated tasks
            </p>
          </div>
          <div className="header-actions">
            <button
              className="btn btn-primary"
              onClick={generateAITasks}
              disabled={loading}
            >
              <span className="btn-icon">✨</span>
              {loading ? "Generating..." : "Generate Tasks"}
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
              {Math.round((completedCount / Math.max(tasks.length, 1)) * 100)}%
              completion rate
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

          <button
            className="btn btn-outline"
            onClick={() => setShowAddTaskForm(true)}
          >
            <span className="btn-icon">+</span>
            Add Manual Task
          </button>
        </div>

        {/* Add Task Form */}
        {showAddTaskForm && (
          <div className="add-task-form card">
            <form onSubmit={createTask}>
              <h3>Create New Task</h3>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  required
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                  className="form-control"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={newTask.category}
                    onChange={(e) =>
                      setNewTask({ ...newTask, category: e.target.value })
                    }
                    className="form-control"
                  >
                    <option value="Work">Work</option>
                    <option value="Personal">Personal</option>
                    <option value="Health">Health</option>
                    <option value="Learning">Learning</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) =>
                      setNewTask({ ...newTask, priority: e.target.value })
                    }
                    className="form-control"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) =>
                      setNewTask({ ...newTask, dueDate: e.target.value })
                    }
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Estimated Time</label>
                  <input
                    type="text"
                    value={newTask.estimatedTime}
                    onChange={(e) =>
                      setNewTask({ ...newTask, estimatedTime: e.target.value })
                    }
                    placeholder="e.g. 1 hour"
                    className="form-control"
                  />
                </div>
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowAddTaskForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        )}

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
                  <span className={`badge ${getPriorityColor(task.priority)}`}>
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

        {sortedTasks.length === 0 && !loading && (
          <div className="empty-state card">
            <div className="empty-icon">✅</div>
            <h3 className="empty-title">No tasks found</h3>
            <p className="empty-description">
              {filter === "all"
                ? "You don't have any tasks yet. Let AI generate some for you!"
                : `No tasks match the current filter: ${filter}`}
            </p>
            <button
              className="btn btn-primary"
              onClick={generateAITasks}
              disabled={loading}
            >
              <span className="btn-icon">✨</span>
              {loading ? "Generating..." : "Generate AI Tasks"}
            </button>
          </div>
        )}

        {loading && (
          <div className="loading-state card">
            <div className="loading-spinner"></div>
            <p>Loading tasks...</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Tasks;
