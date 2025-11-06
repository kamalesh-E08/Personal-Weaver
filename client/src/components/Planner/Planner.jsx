import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import "./Planner.css";
import api from "../../utils/api";

const Planner = () => {
  const auth = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [newPlan, setNewPlan] = useState({
    title: "",
    description: "",
    goals: [""],
    timeline: "",
    priority: "medium",
  });
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

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await api.get("/plans");
      // API returns an object with a `plans` array and `metadata`.
      // Normalize so we always store an array in state.
      const payload = response.data;
      const plansData = Array.isArray(payload) ? payload : payload.plans || [];

      // Fetch tasks for each plan
      const plansWithTasks = await Promise.all(
        plansData.map(async (plan) => {
          try {
            const tasksResponse = await api.get(`/tasks?planId=${plan._id}`);
            return {
              ...plan,
              tasks: tasksResponse.data || [],
            };
          } catch (error) {
            console.error(`Error fetching tasks for plan ${plan._id}:`, error);
            return {
              ...plan,
              tasks: [],
            };
          }
        })
      );

      setPlans(plansWithTasks);
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      // Transform the data to match backend expectations
      const planData = {
        title: newPlan.title,
        description: newPlan.description,
        category: newPlan.priority, // Using priority as category
        duration: newPlan.timeline?.toLowerCase().replace(" ", ""), // Convert "1 week" to "1week"
        goals: newPlan.goals,
      };

      const response = await api.post("/plans", planData);

      // Update local state with the response data
      setPlans([response.data, ...plans]);

      // Reset form
      setNewPlan({
        title: "",
        description: "",
        goals: [""],
        timeline: "",
        priority: "medium",
      });
      setShowCreateForm(false);

      // Show success message
      console.log("Plan created successfully");
    } catch (error) {
      console.error("Error creating plan:", error);
      // Show error details to help debugging
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }

      // Fallback: append locally
      const local = {
        _id: Date.now().toString(),
        ...newPlan,
        createdAt: new Date().toISOString(),
      };
      setPlans([local, ...plans]);
      setShowCreateForm(false);
    }
  };

  const handleDeletePlan = async (planId) => {
    try {
      await api.delete(`/plans/${planId}`);
      setPlans(plans.filter((plan) => plan._id !== planId));
    } catch (error) {
      console.error("Error deleting plan:", error);
      // Fallback: remove locally
      setPlans(plans.filter((plan) => plan._id !== planId));
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const taskData = {
        ...newTask,
        planId: selectedPlan._id,
      };

      const response = await api.post("/tasks", taskData);
      const createdTask = response.data;

      // Update local state with the new task
      setPlans(
        plans.map((plan) =>
          plan._id === selectedPlan._id
            ? { ...plan, tasks: [...(plan.tasks || []), createdTask] }
            : plan
        )
      );

      // Reset form and close modal
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
      setShowAddTaskForm(false);
      setSelectedPlan(null);
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  const openAddTaskForm = (plan) => {
    setSelectedPlan(plan);
    setShowAddTaskForm(true);
  };

  const addGoal = () => {
    setNewPlan({
      ...newPlan,
      goals: [...newPlan.goals, ""],
    });
  };

  const updateGoal = (index, value) => {
    const updatedGoals = [...newPlan.goals];
    updatedGoals[index] = value;
    setNewPlan({
      ...newPlan,
      goals: updatedGoals,
    });
  };

  const removeGoal = (index) => {
    const updatedGoals = newPlan.goals.filter((_, i) => i !== index);
    setNewPlan({
      ...newPlan,
      goals: updatedGoals,
    });
  };

  if (loading) {
    return (
      <div className="planner-container">
        <div className="loading">Loading plans...</div>
      </div>
    );
  }

  return (
    <div className="planner-container">
      <div className="planner-header">
        <h1>Manual Planner</h1>
        <p>Create and manage your strategic plans manually</p>
        <button
          className="create-plan-btn"
          onClick={() => setShowCreateForm(true)}
        >
          + Create New Plan
        </button>
      </div>

      {showCreateForm && (
        <div className="modal-overlay">
          <div className="create-plan-modal">
            <div className="modal-header">
              <h2>Create New Plan</h2>
              <button
                className="close-btn"
                onClick={() => setShowCreateForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreatePlan} className="create-plan-form">
              <div className="form-group">
                <label>Plan Title</label>
                <input
                  type="text"
                  value={newPlan.title}
                  onChange={(e) =>
                    setNewPlan({ ...newPlan, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newPlan.description}
                  onChange={(e) =>
                    setNewPlan({ ...newPlan, description: e.target.value })
                  }
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Goals</label>
                {newPlan.goals.map((goal, index) => (
                  <div key={index} className="goal-input">
                    <input
                      type="text"
                      value={goal}
                      onChange={(e) => updateGoal(index, e.target.value)}
                      placeholder={`Goal ${index + 1}`}
                    />
                    {newPlan.goals.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeGoal(index)}
                        className="remove-goal-btn"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addGoal}
                  className="add-goal-btn"
                >
                  + Add Goal
                </button>
              </div>

              <div className="form-group">
                <label>Timeline</label>
                <select
                  value={newPlan.timeline}
                  onChange={(e) =>
                    setNewPlan({ ...newPlan, timeline: e.target.value })
                  }
                >
                  <option value="">Select Timeline</option>
                  <option value="1 day">1 Day</option>
                  <option value="3 days">3 Days</option>
                  <option value="1 week">1 Week</option>
                  <option value="1 month">1 Month</option>
                  <option value="3 months">3 Months</option>
                  <option value="6 months">6 Months</option>
                  <option value="1 year">1 Year</option>
                </select>
              </div>

              <div className="form-group">
                <label>Priority</label>
                <select
                  value={newPlan.priority}
                  onChange={(e) =>
                    setNewPlan({ ...newPlan, priority: e.target.value })
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn">
                  Create Plan
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="plans-grid">
        {plans.length === 0 ? (
          <div className="no-plans">
            <div className="no-plans-icon">📋</div>
            <h3>No Plans Yet</h3>
            <p>
              Start organizing your work by creating your first strategic plan!
            </p>
            <button
              className="create-plan-btn"
              onClick={() => setShowCreateForm(true)}
            >
              + Create Your First Plan
            </button>
          </div>
        ) : (
          Array.isArray(plans) &&
          plans
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map((plan) => (
              <div
                key={plan._id}
                className={`plan-card priority-${plan.priority}`}
              >
                <div className="plan-header">
                  <h3>{plan.title}</h3>
                  <div className="plan-actions">
                    <button
                      className="delete-btn"
                      onClick={() => handleDeletePlan(plan._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* ✅ Handle JSON description (AI plans) */}
                <div className="plan-description">
                  {(() => {
                    try {
                      const parsed =
                        typeof plan.description === "string"
                          ? JSON.parse(plan.description)
                          : plan.description;

                      if (parsed && Array.isArray(parsed.schedule)) {
                        return (
                          <div className="ai-plan-checklist">
                            <h4>{parsed.title || "AI Generated Plan"}</h4>
                            <ul>
                              {parsed.schedule.map((item, i) => (
                                <li key={i}>
                                  <strong>🕒 {item.time}</strong> —{" "}
                                  {item.activity}
                                  {item.details && (
                                    <p className="details">{item.details}</p>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      }
                      // fallback for text
                      return <p>{plan.description}</p>;
                    } catch {
                      return <p>{plan.description}</p>;
                    }
                  })()}
                </div>

                <div className="plan-goals">
                  <h4>Goals:</h4>
                  <ul>
                    {plan.goals?.map((goal, index) => (
                      <li key={index}>{goal}</li>
                    ))}
                  </ul>
                </div>

                <div className="plan-tasks">
                  <h4>Tasks:</h4>
                  {!plan.tasks || plan.tasks.length === 0 ? (
                    <div className="no-tasks">
                      <p>No tasks added to this plan yet</p>
                      <button
                        className="add-task-btn"
                        onClick={() => openAddTaskForm(plan)}
                      >
                        + Add Your First Task
                      </button>
                    </div>
                  ) : (
                    <>
                      <ul className="tasks-list">
                        {plan.tasks.map((task) => (
                          <li
                            key={task._id}
                            className={`task-item priority-${task.priority}`}
                          >
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={async () => {
                                try {
                                  await api.put(`/tasks/${task._id}`, {
                                    completed: !task.completed,
                                  });
                                  fetchPlans();
                                } catch (error) {
                                  console.error("Error updating task:", error);
                                }
                              }}
                            />
                            <span className={task.completed ? "completed" : ""}>
                              {task.title}
                            </span>
                            <div className="task-details">
                              <span
                                className={`priority priority-${task.priority}`}
                              >
                                {task.priority}
                              </span>
                              <span className="due-date">
                                Due:{" "}
                                {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                      <button
                        className="add-task-btn"
                        onClick={() => openAddTaskForm(plan)}
                      >
                        + Add Another Task
                      </button>
                    </>
                  )}
                </div>

                <div className="plan-meta">
                  <span className="timeline">Timeline: {plan.timeline}</span>
                  <span className={`priority priority-${plan.priority}`}>
                    {plan.priority?.toUpperCase()}
                  </span>
                </div>

                <div className="plan-date">
                  Created:{" "}
                  {plan.createdAt
                    ? new Date(plan.createdAt).toLocaleDateString()
                    : "Unknown"}
                </div>
              </div>
            ))
        )}
      </div>

      {/* Add Task Modal */}
      {showAddTaskForm && selectedPlan && (
        <div className="modal-overlay">
          <div className="create-task-modal">
            <div className="modal-header">
              <h2>Add Task to Plan: {selectedPlan.title}</h2>
              <button
                className="close-btn"
                onClick={() => {
                  setShowAddTaskForm(false);
                  setSelectedPlan(null);
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="create-task-form">
              <div className="form-group">
                <label>Task Title</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Priority</label>
                <select
                  value={newTask.priority}
                  onChange={(e) =>
                    setNewTask({ ...newTask, priority: e.target.value })
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) =>
                    setNewTask({ ...newTask, dueDate: e.target.value })
                  }
                  required
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
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn">
                  Add Task
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddTaskForm(false);
                    setSelectedPlan(null);
                  }}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Planner;
