import React, { useState, useEffect } from "react";
import "./History.css";
import Sidebar from "../Sidebar/Sidebar";

const History = () => {
  const [historyItems, setHistoryItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [dateRange, setDateRange] = useState("all");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    // Mock data for demonstration
    const mockHistory = [
      {
        id: 1,
        type: "chat",
        title: "Productivity Tips Discussion",
        description:
          "Asked for advice on improving daily productivity and time management",
        timestamp: "2024-01-15T10:30:00Z",
        duration: "15 minutes",
        category: "Productivity",
        status: "completed",
      },
      {
        id: 2,
        type: "plan",
        title: "Q4 Marketing Strategy Plan",
        description:
          "Generated comprehensive marketing plan for fourth quarter goals",
        timestamp: "2024-01-14T14:20:00Z",
        duration: "8 minutes",
        category: "Business",
        status: "active",
      },
      {
        id: 3,
        type: "tasks",
        title: "Weekly Task Generation",
        description:
          "AI generated 12 tasks for project management and personal goals",
        timestamp: "2024-01-14T09:15:00Z",
        duration: "3 minutes",
        category: "Tasks",
        status: "completed",
      },
      {
        id: 4,
        type: "chat",
        title: "Learning Path Consultation",
        description: "Discussed React.js learning roadmap and best practices",
        timestamp: "2024-01-13T16:45:00Z",
        duration: "22 minutes",
        category: "Learning",
        status: "completed",
      },
      {
        id: 5,
        type: "plan",
        title: "Personal Fitness Journey",
        description: "Created 3-month fitness and wellness transformation plan",
        timestamp: "2024-01-12T11:30:00Z",
        duration: "12 minutes",
        category: "Health",
        status: "active",
      },
    ];

    setHistoryItems(mockHistory);
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
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || item.type === filterType;

    let matchesDate = true;
    if (dateRange !== "all") {
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
    <div className="history-page">
      <Sidebar />
      <div className="history-content">
        <div className="history-container">
          {/* Header */}
          <div className="history-header">
            <div className="header-content">
              <h1 className="history-title gradient-text">Activity History</h1>
              <p className="history-subtitle">
                Track your AI interactions and productivity journey
              </p>
            </div>
            <button className="btn btn-outline">
              <span className="btn-icon">📥</span>
              Export History
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

          {/* History List */}
          <div className="history-list">
            {filteredItems.map((item) => (
              <div key={item.id} className="history-item card">
                <div className="item-content">
                  <div className="item-icon">{getTypeIcon(item.type)}</div>

                  <div className="item-details">
                    <div className="item-header">
                      <h3 className="item-title">{item.title}</h3>
                      <div className="item-badges">
                        <span className={`badge ${getTypeColor(item.type)}`}>
                          {item.type.charAt(0).toUpperCase() +
                            item.type.slice(1)}
                        </span>
                        <span
                          className={`badge ${getStatusColor(item.status)}`}
                        >
                          {item.status.charAt(0).toUpperCase() +
                            item.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    <p className="item-description">{item.description}</p>

                    <div className="item-meta">
                      <div className="meta-item">
                        <span className="meta-icon">📅</span>
                        <span>
                          {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-icon">⏱️</span>
                        <span>{item.duration}</span>
                      </div>
                      <span className={`badge ${getTypeColor(item.category)}`}>
                        {item.category}
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

          {filteredItems.length === 0 && (
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
