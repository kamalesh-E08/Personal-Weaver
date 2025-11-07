import React, { useState, useEffect } from "react";
import "./history.css";
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType]);

  // ---------- Helpers to compute "next occurrence" (local time aware) ----------
  const parseTimePart = (timeStr) => {
    // Accepts formats: "10:00", "10:00-11:00", "10 AM", "2025-11-07T10:00:00", etc.
    if (!timeStr) return null;
    const t = String(timeStr).trim();

    // If contains ISO-ish date or recognizable date text -> try Date()
    // (If user sends full date-time, Date should parse it in local timezone or as specified.)
    const possibleDate = new Date(t);
    if (!isNaN(possibleDate.getTime()) && /[0-9]{4}/.test(t)) {
      return possibleDate;
    }

    // For range like "10:00-11:00", pick the start "10:00"
    const firstPart = t.split("-")[0].trim();

    // Normalize "10 AM" to "10:00"
    const ampmMatch = firstPart.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
    if (ampmMatch) {
      let hour = parseInt(ampmMatch[1], 10);
      const minute = parseInt(ampmMatch[2] || "0", 10);
      const ampm = ampmMatch[3].toLowerCase();
      if (ampm === "pm" && hour !== 12) hour += 12;
      if (ampm === "am" && hour === 12) hour = 0;
      const dt = new Date();
      dt.setHours(hour, minute, 0, 0);
      return dt;
    }

    // For pure "HH:MM" or "H:MM" pattern
    const hmMatch = firstPart.match(/^(\d{1,2}):(\d{2})$/);
    if (hmMatch) {
      const hour = parseInt(hmMatch[1], 10);
      const minute = parseInt(hmMatch[2], 10);
      const dt = new Date();
      dt.setHours(hour, minute, 0, 0);
      return dt;
    }

    // If none match, return null
    return null;
  };

  const nextOccurrenceFromScheduleItem = (timeStr) => {
    // Returns a Date representing the next local occurrence for the given timeStr
    // If timeStr contains full date -> returns that date (if it's in future) else null.
    const now = new Date();
    const parsed = parseTimePart(timeStr);
    if (!parsed) return null;

    // If parsed includes a year (we treated that earlier) OR parsed's date differs in day:
    // For time-only parseTimePart returns a Date with today's date/time.
    // If that time has already passed, add one day.
    const candidate = new Date(parsed);
    // Only "time-only" candidates will match today's date; if candidate is in the past, move to tomorrow
    if (candidate.getTime() <= now.getTime()) {
      // If input had a year (i.e. original included a full date) we *shouldn't* roll forward
      // But `parseTimePart` returns full-date objects if it found a year/date string.
      // Heuristic: if timeStr contains a 4-digit year then we don't roll forward.
      if (!/\b\d{4}\b/.test(String(timeStr))) {
        candidate.setDate(candidate.getDate() + 1);
      }
    }
    return candidate;
  };

  // ---------- main fetch ----------
  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // fetch chat history, plans, tasks (separate)
      const [chatRes, plansRes, tasksRes] = await Promise.all([
        api.get(
          filterType === "all"
            ? "/chat/history"
            : `/chat/history?category=${filterType}`
        ),
        api.get("/plans"),
        api.get("/tasks"),
      ]);

      // Normalize responses
      const chatHistory = Array.isArray(chatRes.data)
        ? chatRes.data.map((item) => ({
            ...item,
            type: item.category || "chat",
            title: item.sessionTitle || item.title || "Chat Session",
            description: item.summary || item.content || "",
            timestamp: item.createdAt || item.updatedAt || item.date,
          }))
        : [];

      const plansRaw = Array.isArray(plansRes.data)
        ? plansRes.data
        : Array.isArray(plansRes.data?.plans)
        ? plansRes.data.plans
        : [];

      const tasksRaw = Array.isArray(tasksRes.data) ? tasksRes.data : [];

      // Build combined history (for History tab)
      const plansForHistory = plansRaw.map((p) => ({
        ...p,
        type: "plan",
        title: p.title || "Plan",
        description: typeof p.description === "string" ? p.description : "",
        timestamp: p.createdAt || p.updatedAt || p.date,
      }));

      const tasksForHistory = tasksRaw.map((t) => ({
        ...t,
        type: "tasks",
        title: t.title || "Task",
        description: t.description || "",
        timestamp: t.createdAt || t.updatedAt || t.date,
      }));

      const combinedHistory = [
        ...chatHistory,
        ...plansForHistory,
        ...tasksForHistory,
      ]
        .filter((item) => item.timestamp)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // ---------- Active plans (EXCLUSIVELY from plans API) ----------
      // For each plan, compute a `nextOccurrence` (local time aware) using its description.schedule
      const now = new Date();
      const plansWithNext = plansRaw.map((plan) => {
        let nextOccurrence = null;
        try {
          const parsed =
            typeof plan.description === "string"
              ? JSON.parse(plan.description)
              : plan.description;

          if (
            parsed &&
            Array.isArray(parsed.schedule) &&
            parsed.schedule.length
          ) {
            // Map schedule items to candidate Date objects and pick the earliest candidate in the future
            const candidates = parsed.schedule
              .map((s) => {
                const t = s?.time ?? s?.when ?? s; // support different keys
                return nextOccurrenceFromScheduleItem(t);
              })
              .filter(Boolean)
              .map((dt) => new Date(dt)); // ensure Date objects

            // pick the nearest candidate that is >= now
            const futureCandidates = candidates.filter(
              (c) => c.getTime() >= now.getTime()
            );
            if (futureCandidates.length > 0) {
              futureCandidates.sort((a, b) => a - b);
              nextOccurrence = futureCandidates[0];
            } else if (candidates.length > 0) {
              // no future candidate today/tomorrow logic may have not rolled; pick earliest candidate anyway
              candidates.sort((a, b) => a - b);
              nextOccurrence = candidates[0];
            }
          } else if (plan.dueDate) {
            // fallback to plan.dueDate if present
            const d = new Date(plan.dueDate);
            if (!isNaN(d.getTime())) nextOccurrence = d;
          }
        } catch (err) {
          // ignore parse errors
          nextOccurrence = null;
        }

        return { ...plan, nextOccurrence };
      });

      // Filter only plans with status active (and ensure tasks are not present here)
      const activeOnly = plansWithNext.filter((p) => p.status === "active");

      // Sort by nextOccurrence ascending (soonest first), fallback to createdAt if no nextOccurrence
      activeOnly.sort((a, b) => {
        const aKey = a.nextOccurrence
          ? new Date(a.nextOccurrence).getTime()
          : new Date(a.createdAt || 0).getTime();
        const bKey = b.nextOccurrence
          ? new Date(b.nextOccurrence).getTime()
          : new Date(b.createdAt || 0).getTime();
        return aKey - bKey;
      });

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

  // Filters for history tab
  const filteredItems = historyItems.filter((item) => {
    const matchesSearch =
      (item.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description || "").toLowerCase().includes(searchTerm.toLowerCase());

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
              ? "View your current active strategic AI plans and their upcoming steps (local time)."
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
              {activePlans.map((plan, idx) => {
                let parsed = null;
                try {
                  parsed =
                    typeof plan.description === "string"
                      ? JSON.parse(plan.description)
                      : plan.description;
                } catch {
                  parsed = null;
                }

                return (
                  <div key={plan._id || idx} className="history-item card">
                    <div className="item-content">
                      <div className="item-icon">🧭</div>
                      <div className="item-details">
                        <h3 className="item-title gradient-text">
                          {plan.title}
                        </h3>

                        {/* friendly next occurrence display */}
                        <div className="item-meta" style={{ marginBottom: 8 }}>
                          {plan.nextOccurrence ? (
                            <span>
                              ⏱ Next:{" "}
                              {new Date(plan.nextOccurrence).toLocaleString()}
                            </span>
                          ) : plan.dueDate ? (
                            <span>
                              📅 Due: {new Date(plan.dueDate).toLocaleString()}
                            </span>
                          ) : null}
                          <span
                            className="badge badge-primary"
                            style={{ marginLeft: 8 }}
                          >
                            {plan.category || plan.type || "General"}
                          </span>
                          <span
                            className={`badge ${getStatusColor(plan.status)}`}
                            style={{ marginLeft: 8 }}
                          >
                            {plan.status}
                          </span>
                        </div>

                        {parsed && Array.isArray(parsed.schedule) ? (
                          <ul className="checklist">
                            {parsed.schedule.map((task, i) => {
                              const t = task?.time ?? task?.when ?? task;
                              return (
                                <li key={i} className="check-item">
                                  {/* not marking checked automatically — user can check manually in UI */}
                                  <input type="checkbox" />
                                  <span>
                                    {t} — {task.activity ?? task.title ?? task}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <p className="muted">
                            {plan.description || "No description"}
                          </p>
                        )}
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
                        {(item.description || "").slice(0, 100) ||
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
