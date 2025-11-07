import React, { useState, useEffect, useCallback } from "react";
import "./Tasks.css";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";

const Tasks = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("dueDate");
  const [loading, setLoading] = useState(false);
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [plans, setPlans] = useState([]);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    category: "Work",
    priority: "medium",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    planId: "",
  });

  const { user } = useAuth();

  const createTask = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...newTask,
        assignedDateTime: new Date().toISOString(),
      };
      if (!payload.planId) delete payload.planId;

      await api.post("/tasks", payload);
      await fetchTasks();
      setShowAddTaskForm(false);
      setNewTask({
        title: "",
        description: "",
        category: "Work",
        priority: "medium",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        planId: "",
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
      const queryParams = new URLSearchParams();
      if (filter !== "all") queryParams.append("filter", filter);
      if (sortBy !== "none") queryParams.append("sortBy", sortBy);

      const response = await api.get(`/tasks?${queryParams.toString()}`);
      const data = response.data;
      const tasksWithPlanTitle = data.map((task) => {
        const plan = plans.find((p) => String(p._id) === String(task.planId));
        return { ...task, planTitle: plan ? plan.title : null };
      });
      setTasks(tasksWithPlanTitle);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  }, [filter, sortBy, plans]);

  useEffect(() => {
    if (user) fetchTasks();
  }, [user, fetchTasks]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get("/plans");
        const payload = res.data;
        const plansData = Array.isArray(payload)
          ? payload
          : payload.plans || [];
        setPlans(plansData);
      } catch (err) {
        console.error("Error fetching plans:", err);
      }
    };
    if (user) fetchPlans();
  }, [user]);

  const filteredTasks = tasks.filter((task) => {
    if (filter === "completed") return task.completed;
    if (filter === "pending") return !task.completed;
    if (filter === "ai-generated") return task.aiGenerated;
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === "dueDate") {
      return new Date(a.dueDate) - new Date(b.dueDate);
    } else if (sortBy === "category") {
      return a.category.localeCompare(b.category);
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
      fetchTasks();
    } catch (error) {
      console.error("Error toggling task completion:", error);
    }
  };

  const generateAITasks = async () => {
    setLoading(true);
    try {
      await api.post("/tasks/generate", {
        count: 3,
        category: filter !== "all" ? filter : undefined,
      });
      await fetchTasks();
    } catch (error) {
      console.error("Error generating AI tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = tasks.filter((t) => !t.completed).length;
  const aiGeneratedCount = tasks.filter((t) => t.aiGenerated).length;
  const handleNavigation = (path) => navigate(path);

  // 🔧 Unassigned tasks logic (fixed)
  const unassignedTasks = tasks.filter(
    (task) =>
      !task.planId || !plans.find((p) => String(p._id) === String(task.planId))
  );

  return (
    <div className="tasks-container">
      {/* Header */}
      <div className="tasks-header">
        <div className="header-content">
          <h1 className="tasks-title gradient-text">Task Management</h1>
          <p className="tasks-subtitle">
            Organize and track your tasks efficiently
          </p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={() => handleNavigation("/chat")}
            disabled={loading}
          >
            <span className="btn-icon">✨</span>
            Generate Tasks
          </button>
        </div>
      </div>

      {/* === Unassigned Tasks Alert === */}
      {plans.length > 0 && unassignedTasks.length > 0 && (
        <div className="unassigned-tasks-alert card">
          <div className="unassigned-header">
            <h3 className="unassigned-title">
              <span className="meta-icon">📌</span> Unassigned Tasks
            </h3>
          </div>

          <p className="task-description">
            These tasks aren’t linked to any plan. Assign them below:
          </p>

          <div className="unassigned-tasks-list">
            {unassignedTasks.map((task) => (
              <div key={task._id} className="unassigned-task-item">
                <span className="unassigned-task-title">{task.title}</span>
                <div className="task-assign-form">
                  <select
                    className="form-control"
                    onChange={(e) => {
                      const selectedPlan = e.target.value;
                      if (selectedPlan) {
                        api
                          .put(`/tasks/${task._id}`, { planId: selectedPlan })
                          .then(() => fetchTasks())
                          .catch((err) =>
                            console.error("Error assigning task:", err)
                          );
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="">Assign to Plan</option>
                    {plans.map((plan) => (
                      <option key={plan._id} value={plan._id}>
                        {plan.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === Stats Cards === */}
      <div className="stats-grid">
        {[
          { label: "Total Tasks", icon: "📋", value: tasks.length },
          { label: "Completed", icon: "✅", value: completedCount },
          { label: "Pending", icon: "⏳", value: pendingCount },
          { label: "AI Generated", icon: "✨", value: aiGeneratedCount },
        ].map((stat, i) => (
          <div key={i} className="stat-card card">
            <div className="stat-header">
              <span className="stat-label">{stat.label}</span>
              <span className="stat-icon">{stat.icon}</span>
            </div>
            <div className="stat-value">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* === Controls === */}
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
            <option value="dueDate">Sort by Due Date</option>
            <option value="category">Sort by Category</option>
          </select>
        </div>

        <button
          className="btn btn-outline"
          onClick={() => setShowAddTaskForm(true)}
        >
          <span className="btn-icon">+</span> Add Manual Task
        </button>
      </div>

      {/* === Add Task Form === */}
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
                <label>Assign to Plan (optional)</label>
                <select
                  value={newTask.planId || ""}
                  onChange={(e) =>
                    setNewTask({ ...newTask, planId: e.target.value })
                  }
                  className="form-control"
                >
                  <option value="">-- No Plan --</option>
                  {plans.map((plan) => (
                    <option key={plan._id} value={plan._id}>
                      {plan.title}
                    </option>
                  ))}
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

      {/* === Tasks List === */}
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
                      <span className="meta-icon">🕒</span>
                      <span>
                        Assigned:{" "}
                        {new Date(
                          task.assignedDateTime || task.createdAt
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="task-badges">
                {task.aiGenerated && (
                  <span className="badge badge-info">✨ AI</span>
                )}
                <span className={`badge ${getPriorityColor(task.priority)}`}>
                  {getPriorityIcon(task.priority)} {task.priority}
                </span>
                <span className="badge badge-primary">{task.category}</span>
                {task.planTitle && (
                  <span className="badge badge-plain plan-badge">
                    📘 {task.planTitle}
                  </span>
                )}
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
              ? "You don't have any tasks yet."
              : `No tasks match filter: ${filter}`}
          </p>
        </div>
      )}

      {loading && (
        <div className="loading-state card">
          <div className="loading-spinner"></div>
          <p>Loading tasks...</p>
        </div>
      )}
    </div>
  );
};

export default Tasks;
