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
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [showEditTaskForm, setShowEditTaskForm] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  const [planForm, setPlanForm] = useState({
    title: "",
    description: "",
    goals: [""],
    timeline: "",
    priority: "medium",
  });

  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
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
    setLoading(true);
    try {
      const res = await api.get("/plans");
      const data = Array.isArray(res.data) ? res.data : res.data.plans || [];
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

  // --- Render Visual Editor for JSON Plans ---
  const renderSmartEditor = () => {
    let parsed = safeParse(planForm.description);
    if (parsed && Array.isArray(parsed.schedule)) {
      return (
        <div className="form-group">
          <label>Schedule Steps</label>
          {parsed.schedule.map((item, i) => (
            <div className="schedule-item" key={i}>
              <input
                type="text"
                placeholder="Time"
                value={item.time}
                onChange={(e) => {
                  const newSchedule = [...parsed.schedule];
                  newSchedule[i].time = e.target.value;
                  setPlanForm({
                    ...planForm,
                    description: JSON.stringify({
                      ...parsed,
                      schedule: newSchedule,
                    }),
                  });
                }}
              />
              <input
                type="text"
                placeholder="Activity"
                value={item.activity}
                onChange={(e) => {
                  const newSchedule = [...parsed.schedule];
                  newSchedule[i].activity = e.target.value;
                  setPlanForm({
                    ...planForm,
                    description: JSON.stringify({
                      ...parsed,
                      schedule: newSchedule,
                    }),
                  });
                }}
              />
              <input
                type="text"
                placeholder="Details"
                value={item.details}
                onChange={(e) => {
                  const newSchedule = [...parsed.schedule];
                  newSchedule[i].details = e.target.value;
                  setPlanForm({
                    ...planForm,
                    description: JSON.stringify({
                      ...parsed,
                      schedule: newSchedule,
                    }),
                  });
                }}
              />
              <button
                type="button"
                className="remove-step"
                onClick={() => {
                  const newSchedule = parsed.schedule.filter(
                    (_, idx) => idx !== i
                  );
                  setPlanForm({
                    ...planForm,
                    description: JSON.stringify({
                      ...parsed,
                      schedule: newSchedule,
                    }),
                  });
                }}
              >
                🗑
              </button>
            </div>
          ))}
          <button
            type="button"
            className="add-step-btn"
            onClick={() => {
              const newSchedule = [
                ...parsed.schedule,
                { time: "", activity: "", details: "" },
              ];
              setPlanForm({
                ...planForm,
                description: JSON.stringify({
                  ...parsed,
                  schedule: newSchedule,
                }),
              });
            }}
          >
            ➕ Add Step
          </button>
        </div>
      );
    }

    return (
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
    );
  };

  return (
    <div className="planner-container">
      <div className="planner-header">
        <h1>Planner</h1>
        <button onClick={() => setShowCreateForm(true)}>+ Create Plan</button>
      </div>

      <div className="plans-grid">
        {plans.map((plan) => (
          <div key={plan._id} className="plan-card">
            <div className="plan-header">
              <h3>{plan.title}</h3>
              <div>
                <button onClick={() => handleEditPlan(plan)}>✏️</button>
                <button onClick={() => handleDeletePlan(plan._id)}>🗑</button>
              </div>
            </div>
            {renderPlanDescription(plan.description)}
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
              {renderSmartEditor()}
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
