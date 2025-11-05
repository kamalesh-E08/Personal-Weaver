import React, { useState, useEffect } from "react";
import "./History.css";
// Layout is provided by the router parent (uses <Outlet />). Do not wrap pages with Layout here.
import api from "../../utils/api";

const History = () => {
  const [historyItems, setHistoryItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("plans"); // for tab control

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const [chatRes, plansRes, tasksRes] = await Promise.all([
        api.get("/history"),
        api.get("/plans"),
        api.get("/tasks"),  
      ]);

      const chatHistory = Array.isArray(chatRes.data)
        ? chatRes.data.map((item) => ({
            ...item,
            type: "chat",
            title: item.sessionTitle || "Chat Session",
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

      const combinedHistory = [...chatHistory, ...plans, ...tasks];

      // Sort by timestamp (most recent first)
      combinedHistory.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );

      setHistoryItems(combinedHistory);
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
      }
    }

    return matchesSearch && matchesType && matchesDate;
  });

  const stats = {
    totalSessions: historyItems.length,
    chatSessions: historyItems.filter((item) => item.type === "chat").length,
    plansCreated: historyItems.filter((item) => item.type === "plan").length,
    tasksGenerated: historyItems.filter((item) => item.type === "tasks").length,
  };

  return (
    <Layout>
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
                : "Track your AI interactions and productivity journey"}
            </p>
          </div>

          <button className="btn btn-outline" onClick={fetchHistory}>
            <span className="btn-icon">📥</span>
            Refresh
          </button>
        </div>

        {/* === ACTIVE PLANS SECTION === */}
        {activeTab === "plans" && (
          <div className="empty-state card">
            <div className="empty-icon">🧠</div>
            <h3 className="empty-title">No Active Plans Yet</h3>
            <p className="empty-description">
              Start creating strategic AI plans to see them appear here.
            </p>
          </div>
        )}

        {/* === HISTORY SECTION === */}
        {activeTab === "history" && (
          <>
            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card card">
                <div className="stat-header">
                  <span className="stat-label">Total Sessions</span>
                  <span className="stat-icon">📜</span>
                </div>
                <div className="stat-value">{stats.totalSessions}</div>
                <div className="stat-change">All interactions</div>
              </div>

              <div className="stat-card card">
                <div className="stat-header">
                  <span className="stat-label">Chat Sessions</span>
                  <span className="stat-icon">💬</span>
                </div>
                <div className="stat-value">{stats.chatSessions}</div>
                <div className="stat-change">AI conversations</div>
              </div>

              <div className="stat-card card">
                <div className="stat-header">
                  <span className="stat-label">Plans Created</span>
                  <span className="stat-icon">🧠</span>
                </div>
                <div className="stat-value">{stats.plansCreated}</div>
                <div className="stat-change">Strategic plans</div>
              </div>

              <div className="stat-card card">
                <div className="stat-header">
                  <span className="stat-label">Tasks Generated</span>
                  <span className="stat-icon">✅</span>
                </div>
                <div className="stat-value">{stats.tasksGenerated}</div>
                <div className="stat-change">AI-generated tasks</div>
              </div>
            </div>

            {/* Filters */}
            <div className="filters-section">
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search history..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input input"
                />
                <span className="search-icon">🔍</span>
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="select"
              >
                <option value="all">All Types</option>
                <option value="chat">Chat Sessions</option>
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

            {/* Loading State */}
            {loading && (
              <div className="empty-state card">
                <div className="empty-icon">⏳</div>
                <h3 className="empty-title">Loading history...</h3>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="empty-state card">
                <div className="empty-icon">⚠️</div>
                <h3 className="empty-title">Error</h3>
                <p className="empty-description">{error}</p>
              </div>
            )}

            {/* History List */}
            {!loading && !error && filteredItems.length > 0 && (
              <div className="history-list">
                {filteredItems.map((item) => (
                  <div key={item._id} className="history-item card">
                    <div className="item-content">
                      <div className="item-icon">{getTypeIcon(item.type)}</div>

                      <div className="item-details">
                        <div className="item-header">
                          <h3 className="item-title">{item.title}</h3>
                          <div className="item-badges">
                            <span className={`badge ${getTypeColor(item.type)}`}>
                              {item.type?.charAt(0).toUpperCase() +
                                item.type?.slice(1)}
                            </span>
                            <span
                              className={`badge ${getStatusColor(item.status)}`}
                            >
                              {item.status?.charAt(0).toUpperCase() +
                                item.status?.slice(1)}
                            </span>
                          </div>
                        </div>

                        <p className="item-description">{item.description}</p>

                        <div className="item-meta">
                          <div className="meta-item">
                            <span className="meta-icon">📅</span>
                            <span>
                              {item.timestamp
                                ? new Date(item.timestamp).toLocaleDateString()
                                : "N/A"}
                            </span>
                          </div>
                          <div className="meta-item">
                            <span className="meta-icon">⏱️</span>
                            <span>{item.duration || "—"}</span>
                          </div>
                          <span className={`badge ${getTypeColor(item.category)}`}>
                            {item.category || "General"}
                          </span>
                        </div>
                      </div>

                      <button className="btn btn-outline btn-sm">
                        <span className="btn-icon">👁️</span>
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredItems.length === 0 && (
              <div className="empty-state card">
                <div className="empty-icon">📜</div>
                <h3 className="empty-title">No history found</h3>
                <p className="empty-description">
                  {searchTerm || filterType !== "all" || dateRange !== "all"
                    ? "No items match your current filters. Try adjusting your search criteria."
                    : "Start using Personal Weaver AI to see your activity history here."}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default History;
