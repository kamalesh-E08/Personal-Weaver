import React, { useState, useEffect } from "react";
import "./History.css";
import Sidebar from "../Sidebar/Sidebar";

const History = () => {
  const [historyItems, setHistoryItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [loading, setLoading] = useState(true); // loader state
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/history", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // You can add token here if auth is required:
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setHistoryItems(Array.isArray(data) ? data : []);
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

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="history-page">
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={setIsSidebarCollapsed} />
      <div className={`history-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="history-container">
          {/* Header */}
          <div className="history-header">
            <div className="header-content">
              <h1 className="history-title gradient-text">Activity History</h1>
              <p className="history-subtitle">Track your AI interactions and productivity journey</p>
            </div>

            <button className="btn btn-outline" onClick={fetchHistory}>
              <span className="btn-icon">📥</span>
              Refresh
            </button>
          </div>

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
                        <span
                          className={`badge ${getTypeColor(item.category)}`}
                        >
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
        </div>
      </div>
    </div>
  );
};

export default History;
