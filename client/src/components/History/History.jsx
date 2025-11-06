import React, { useState, useEffect } from "react";
import "./History.css";
import api from "../../utils/api";

const History = () => {
  const [historyItems, setHistoryItems] = useState([]);
  const [activePlans, setActivePlans] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("plans");

  useEffect(() => {
    fetchHistory();
  }, [filterType]);

  const fetchLatestPlan = async () => {
    try {
      const res = await api.get("/chat/latest-plan");
      if (res.data) {
        setLatestPlan(res.data);
      }
    } catch (err) {
      console.warn("No active plan found:", err.response?.data?.message);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // 🟢 Fetch all data, including filtered chat history
      const [chatRes, plansRes, tasksRes] = await Promise.all([
        api.get(
          filterType === "all"
            ? "/chat/history"
            : `/chat/history?category=${filterType}`
        ),
        api.get("/plans"),
        api.get("/tasks"),
      ]);

      const chatHistory = Array.isArray(chatRes.data)
        ? chatRes.data.map((item) => ({
            ...item,
            type: item.category || "chat",
            title: item.sessionTitle || "Chat Session",
            timestamp: item.createdAt,
          }))
        : [];

      const plans = Array.isArray(plansRes.data)
        ? plansRes.data.map((item) => ({
            ...item,
            type: "plan",
            timestamp: item.createdAt,
          }))
        : [];

      const tasks = Array.isArray(tasksRes.data)
        ? tasksRes.data.map((item) => ({
            ...item,
            type: "tasks",
            timestamp: item.createdAt,
          }))
        : [];

      const combinedHistory = [...chatHistory, ...plans, ...tasks]
        .filter((item) => item.timestamp)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // 🧠 Active Plans (from plans API)
      const activeOnly = plans.filter((p) => p.status === "active");

      setHistoryItems(combinedHistory);
      setActivePlans(activeOnly);
    } catch (err) {
      console.error("Error fetching history:", err);
      setError("Failed to fetch history. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "chat":
        return "💬";
      case "plan":
        return "🧠";
      case "tasks":
        return "✅";
      default:
        return "📜";
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "chat":
        return "badge-info";
      case "plan":
        return "badge-primary";
      case "tasks":
        return "badge-success";
      default:
        return "badge-primary";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "badge-warning";
      case "completed":
        return "badge-success";
      default:
        return "badge-primary";
    }
  };

  // 🔍 Search + Date Filters
  const filteredItems = historyItems.filter((item) => {
    const matchesSearch =
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === "all" || item.type === filterType;

    let matchesDate = true;
    if (dateRange !== "all" && item.timestamp) {
      const itemDate = new Date(item.timestamp);
      const now = new Date();
      const daysDiff = Math.floor(
        (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      switch (dateRange) {
        case "today":
          matchesDate = daysDiff === 0;
          break;
        case "week":
          matchesDate = daysDiff <= 7;
          break;
        case "month":
          matchesDate = daysDiff <= 30;
          break;
        default:
          matchesDate = true;
      }
    }

    return matchesSearch && matchesType && matchesDate;
  });

  const stats = {
    totalSessions: historyItems.length,
    chatSessions: historyItems.filter((i) => i.type === "chat").length,
    plansCreated: historyItems.filter((i) => i.type === "plan").length,
    tasksGenerated: historyItems.filter((i) => i.type === "tasks").length,
  };

  return (
    <div className="history-container">
      {/* === TOP NAV TABS === */}
      <div className="top-tabs">
        <button
          className={`tab ${activeTab === "plans" ? "active-tab" : ""}`}
          onClick={() => setActiveTab("plans")}
        >
          Active Plans
        </button>
        <button
          className={`tab ${activeTab === "history" ? "active-tab" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          History
        </button>
      </div>

      {/* === HEADER === */}
      <div className="history-header">
        <div className="header-content">
          <h1 className="history-title gradient-text">
            {activeTab === "plans" ? "Active Plans" : "History"}
          </h1>
          <p className="history-subtitle">
            {activeTab === "plans"
              ? "View your current active strategic AI plans and goals."
              : "Track your AI interactions and productivity journey."}
          </p>
        </div>
        <button className="btn btn-outline" onClick={fetchHistory}>
          <span className="btn-icon">🔄</span> Refresh
        </button>
      </div>

      {/* === ACTIVE PLANS TAB === */}
      {activeTab === "plans" && (
        <>
          {loading ? (
            <div className="empty-state card">
              <div className="empty-icon">⏳</div>
              <h3 className="empty-title">Loading plans...</h3>
            </div>
          ) : activePlans.length > 0 ? (
            <div className="plan-list">
              {activePlans
                .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                .map((plan, idx) => {
                  let parsed;
                  try {
                    parsed =
                      typeof plan.description === "string"
                        ? JSON.parse(plan.description)
                        : plan.description;
                  } catch {
                    parsed = null;
                  }

                  return (
                    <div key={idx} className="history-item card">
                      <div className="item-content">
                        <div className="item-icon">🧭</div>
                        <div className="item-details">
                          <h3 className="item-title gradient-text">
                            {plan.title}
                          </h3>
                          {parsed && Array.isArray(parsed.schedule) ? (
                            <ul className="checklist">
                              {parsed.schedule.map((task, i) => (
                                <li key={i} className="check-item">
                                  <input type="checkbox" />
                                  <span>
                                    {task.time} — {task.activity}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p>{plan.description}</p>
                          )}
                          <div className="item-meta">
                            <span>
                              📅 {new Date(plan.dueDate).toLocaleString()}
                            </span>
                            <span className="badge badge-primary">
                              {plan.category}
                            </span>
                            <span className="badge badge-warning">
                              {plan.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      </div>
                    );
                  })}
            </div>
          ) : (
            <div className="empty-state card">
              <div className="empty-icon">🧠</div>
              <h3 className="empty-title">No Active Plans Yet</h3>
              <p className="empty-description">
                Start creating strategic AI plans to see them appear here.
              </p>
            </div>
          )}
        </>
      )}

      {/* === HISTORY TAB === */}
      {activeTab === "history" && (
        <>
          <div className="filters-section">
            <input
              type="text"
              placeholder="Search history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input input"
            />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="select"
            >
              <option value="all">All</option>
              <option value="chat">Chats</option>
              <option value="plan">Plans</option>
              <option value="tasks">Tasks</option>
            </select>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="select"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          {loading ? (
            <div className="empty-state card">
              <div className="empty-icon">⏳</div>
              <h3 className="empty-title">Loading history...</h3>
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="history-list">
              {filteredItems.map((item, index) => (
                <div key={index} className="history-item card">
                  <div className="item-content">
                    <div className="item-icon">{getTypeIcon(item.type)}</div>
                    <div className="item-details">
                      <h3 className="item-title">{item.title}</h3>
                      <p>
                        {item.description?.slice(0, 100) ||
                          "No description available"}
                      </p>
                      <div className="item-meta">
                        <span>
                          📅 {new Date(item.timestamp).toLocaleString()}
                        </span>
                        <span className={`badge ${getTypeColor(item.type)}`}>
                          {item.type}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state card">
              <div className="empty-icon">📭</div>
              <h3 className="empty-title">No history found</h3>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default History;
