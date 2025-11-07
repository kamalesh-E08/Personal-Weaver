import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import "./Planner.css";
import api from "../../utils/api";

const Planner = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditPlanForm, setShowEditPlanForm] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState(null);

  const [planForm, setPlanForm] = useState({
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
    setLoading(true);
    try {
      const res = await api.get("/plans");
      const data = Array.isArray(res.data) ? res.data : res.data.plans || [];

      // Attach tasks (if any)
      const withTasks = await Promise.all(
        data.map(async (plan) => {
          try {
            const t = await api.get(`/tasks?planId=${plan._id}`);
            return { ...plan, tasks: t.data || [] };
          } catch {
            return { ...plan, tasks: [] };
          }
        })
      );

      withTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setPlans(withTasks);
    } catch (e) {
      console.error("Error fetching plans:", e);
    } finally {
      setLoading(false);
    }
  };

  const safeParse = (str) => {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  };

  const handleEditPlan = (plan) => {
    setSelectedPlan(plan);
    const parsed = safeParse(plan.description);
    const desc = parsed ? JSON.stringify(parsed, null, 2) : plan.description;
    setPlanForm({
      title: plan.title,
      description: desc,
      goals: plan.goals || [""],
      timeline: plan.duration || plan.timeline || "",
      priority: plan.priority || "medium",
    });
    setShowEditPlanForm(true);
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      const desc = (() => {
        const trimmed = planForm.description.trim();
        if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
          try {
            JSON.parse(trimmed);
            return trimmed;
          } catch {
            return planForm.description;
          }
        }
        return planForm.description;
      })();

      const payload = {
        title: planForm.title,
        description: desc,
        goals: planForm.goals,
        duration: planForm.timeline,
        priority: planForm.priority,
        status: "active",
      };

      const res = await api.post("/plans", payload);
      setPlans((prev) => [res.data, ...prev]);
      setShowCreateForm(false);
    } catch (err) {
      console.error("Create plan error:", err);
    }
  };

  const handleUpdatePlan = async (e) => {
    e.preventDefault();
    if (!selectedPlan) return;

    let desc = planForm.description.trim();
    if (desc.startsWith("{") || desc.startsWith("[")) {
      try {
        JSON.parse(desc);
      } catch {
        console.warn("Malformed JSON saved as text.");
      }
    }

    const payload = {
      title: planForm.title,
      description: desc,
      goals: planForm.goals,
      duration: planForm.timeline,
      priority: planForm.priority,
    };

    const res = await api.put(`/plans/${selectedPlan._id}`, payload);
    const updated = res.data || { ...selectedPlan, ...payload };
    setPlans((prev) =>
      prev.map((p) => (p._id === selectedPlan._id ? updated : p))
    );
    setShowEditPlanForm(false);
  };

  const handleDeletePlan = async (id) => {
    if (!window.confirm("Delete this plan?")) return;
    await api.delete(`/plans/${id}`);
    setPlans((prev) => prev.filter((p) => p._id !== id));
  };

  // ✅ NEW: Toggle completion status
  const handleToggleCompletion = async (plan) => {
    try {
      const newStatus = plan.status === "completed" ? "active" : "completed";
      const res = await api.put(`/plans/${plan._id}`, { status: newStatus });

      const updated = res.data || { ...plan, status: newStatus };
      setPlans((prev) => prev.map((p) => (p._id === plan._id ? updated : p)));
    } catch (err) {
      console.error("Error toggling completion:", err);
    }
  };

  const renderPlanDescription = (desc) => {
    const parsed = safeParse(desc);
    if (parsed?.schedule?.length)
      return (
        <div className="ai-plan-checklist">
          <h4>{parsed.title}</h4>
          <ul>
            {parsed.schedule.map((s, i) => (
              <li key={i}>
                <strong>🕒 {s.time}</strong> — {s.activity}
                {s.details && <p>{s.details}</p>}
              </li>
            ))}
          </ul>
        </div>
      );
    return <p>{desc}</p>;
  };

  if (loading) return <div className="planner-container">Loading...</div>;

  return (
    <div className="planner-container">
      <div className="planner-header">
        <h1>Planner</h1>
        <button onClick={() => setShowCreateForm(true)}>+ Create Plan</button>
      </div>

      <div className="plans-grid">
        {plans.map((plan) => (
          <div
            key={plan._id}
            className={`plan-card ${
              plan.status === "completed" ? "completed-plan" : ""
            }`}
          >
            <div className="plan-header">
              <h3>{plan.title}</h3>
              <div className="plan-actions">
                <button
                  className={`status-btn ${
                    plan.status === "completed" ? "completed" : "active"
                  }`}
                  onClick={() => handleToggleCompletion(plan)}
                >
                  {plan.status === "completed"
                    ? "✅ Completed"
                    : "☑️ Mark Done"}
                </button>
                <button onClick={() => handleEditPlan(plan)}>✏️</button>
                <button onClick={() => handleDeletePlan(plan._id)}>🗑</button>
              </div>
            </div>
            {renderPlanDescription(plan.description)}
            <div className="plan-footer">
              <span className={`priority-${plan.priority}`}>
                Priority: {plan.priority}
              </span>
              <span className="status-label">
                {plan.status?.toUpperCase() || "ACTIVE"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {(showCreateForm || showEditPlanForm) && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{showEditPlanForm ? "Edit Plan" : "Create Plan"}</h2>
            <form
              onSubmit={showEditPlanForm ? handleUpdatePlan : handleCreatePlan}
            >
              <div className="form-group">
                <label>Title</label>
                <input
                  value={planForm.title}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows={6}
                  value={planForm.description}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, description: e.target.value })
                  }
                />
              </div>

              <div className="form-row">
                <input
                  placeholder="Timeline"
                  value={planForm.timeline}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, timeline: e.target.value })
                  }
                />
                <select
                  value={planForm.priority}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, priority: e.target.value })
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="submit">
                  {showEditPlanForm ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setShowEditPlanForm(false);
                  }}
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
