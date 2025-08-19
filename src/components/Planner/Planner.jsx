import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";
import "./Planner.css";
import Sidebar from "../Sidebar/Sidebar";

const Planner = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlan, setNewPlan] = useState({
    title: "",
    description: "",
    goals: [""],
    timeline: "",
    priority: "medium",
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await api.get("/plans");
      setPlans(response.data);
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/plans", newPlan);
      setPlans([response.data, ...plans]);
      setNewPlan({
        title: "",
        description: "",
        goals: [""],
        timeline: "",
        priority: "medium",
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error("Error creating plan:", error);
    }
  };

  const handleDeletePlan = async (planId) => {
    try {
      await api.delete(`/plans/${planId}`);
      setPlans(plans.filter((plan) => plan._id !== planId));
    } catch (error) {
      console.error("Error deleting plan:", error);
    }
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
      <div className="planner-page">
        <Sidebar />
        <div className="planner-content">
          <div className="planner-container">
            <div className="loading">Loading plans...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="planner-page">
      <Sidebar />
      <div className="planner-content">
        <div className="planner-container">
          <div className="planner-header">
            <h1>AI Planner</h1>
            <p>Create and manage your strategic plans with AI assistance</p>
            <button
              className="create-plan-btn"
              onClick={() => setShowCreateForm(true)}
            >
              Create New Plan
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
                <h3>No plans yet</h3>
                <p>Create your first strategic plan to get started!</p>
              </div>
            ) : (
              plans.map((plan) => (
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

                  <p className="plan-description">{plan.description}</p>

                  <div className="plan-goals">
                    <h4>Goals:</h4>
                    <ul>
                      {plan.goals.map((goal, index) => (
                        <li key={index}>{goal}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="plan-meta">
                    <span className="timeline">Timeline: {plan.timeline}</span>
                    <span className={`priority priority-${plan.priority}`}>
                      {plan.priority.toUpperCase()}
                    </span>
                  </div>

                  <div className="plan-date">
                    Created: {new Date(plan.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Planner;
