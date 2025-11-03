import React, { useState, useEffect, useRef } from "react";
import "./Chat.css";
import { useAuth } from "../../context/AuthContext";
import { chatApi } from "../../utils/api";

const Chat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    "Create a daily productivity plan for me",
    "Help me organize my tasks for this week",
    "What are some effective time management strategies?",
    "Generate a workout routine for beginners",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat sessions list
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const { data: history } = await chatApi.getChatHistory();
        if (Array.isArray(history) && history.length > 0) {
          setSessions(history);
          // Set the most recent session as current if no session is selected
          setCurrentSessionId((prev) => {
            if (!prev && history[0]) {
              return history[0]._id;
            }
            return prev;
          });
        }
      } catch (err) {
        console.error("Failed to load chat sessions:", err);
      }
    };

    if (user) loadSessions();
  }, [user]);

  // Load messages for the current session
  useEffect(() => {
    if (!currentSessionId) {
      setMessages([]);
      return;
    }

    // Find the current session from the sessions list
    const currentSession = sessions.find((s) => s._id === currentSessionId);

    if (currentSession && currentSession.messages) {
      const formatted = currentSession.messages.map((m, idx) => ({
        id: `${currentSessionId}-${idx}`,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
        type: m.type || null,
      }));
      setMessages(formatted);
    } else {
      // If session not found in cached sessions, try to fetch it
      const fetchSession = async () => {
        try {
          setIsLoading(true);
          const { data: history } = await chatApi.getChatHistory();
          if (Array.isArray(history) && history.length > 0) {
            const foundSession = history.find(
              (s) => s._id === currentSessionId
            );
            if (foundSession && foundSession.messages) {
              const formatted = foundSession.messages.map((m, idx) => ({
                id: `${currentSessionId}-${idx}`,
                role: m.role,
                content: m.content,
                timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
                type: m.type || null,
              }));
              setMessages(formatted);
              // Update sessions list
              setSessions((prev) => {
                const exists = prev.find((s) => s._id === currentSessionId);
                if (!exists && foundSession) {
                  return [foundSession, ...prev];
                }
                return prev;
              });
            } else {
              setMessages([]);
            }
          }
        } catch (err) {
          console.error("Failed to load session messages:", err);
          setMessages([]);
        } finally {
          setIsLoading(false);
        }
      };

      if (user) {
        fetchSession();
      }
    }
  }, [user, currentSessionId, sessions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageInput = input;
    setInput("");
    setIsLoading(true);

    try {
      // Send message with current sessionId (or null for new session)
      const data = await chatApi.sendMessage(messageInput, currentSessionId);

      // Backend returns: { sessionId, response, type, timestamp }
      // Update current session if a new one was created
      if (data.sessionId && data.sessionId !== currentSessionId) {
        setCurrentSessionId(data.sessionId);
        // Reload sessions list to include the new session
        const { data: history } = await chatApi.getChatHistory();
        if (Array.isArray(history)) {
          setSessions(history);
        }
      }

      const responseText = data?.response || data?.message || "";
      const aiMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content:
          typeof responseText === "string"
            ? responseText
            : JSON.stringify(responseText),
        timestamp: data?.timestamp ? new Date(data.timestamp) : new Date(),
        type: data?.type || null,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewSession = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setInput("");
  };

  const handleSelectSession = (sessionId) => {
    setCurrentSessionId(sessionId);
  };

  const handleQuickPrompt = (prompt) => {
    setInput(prompt);
    // Auto-submit the prompt
    setTimeout(() => {
      const event = { preventDefault: () => {} };
      handleSubmit(event);
    }, 100);
  };

  // Helper to render message content (handles plan and error types)
  const renderMessageContent = (message) => {
    // Detect trip plan JSON
    const isTripPlanJSON = (str) => {
      try {
        const data = typeof str === "string" ? JSON.parse(str) : str;
        return data?.title && Array.isArray(data?.schedule);
      } catch {
        return false;
      }
    };

    // Render trip plan
    const renderTripPlan = (data) => {
      const plan = typeof data === "string" ? JSON.parse(data) : data;
      return (
        <div className="trip-plan">
          <h3 className="trip-title">📅 {plan.title}</h3>
          <ul className="trip-list">
            {plan.schedule.map((item, index) => (
              <li key={index} className="trip-item">
                <div className="trip-time">🕒 {item.time}</div>
                <div className="trip-activity">
                  <strong>{item.activity}</strong>
                </div>
                <div className="trip-details">{item.details}</div>
              </li>
            ))}
          </ul>
        </div>
      );
    };

    // Handle plan / trip responses
    if (isTripPlanJSON(message.content)) {
      return renderTripPlan(message.content);
    }
    if (message.type === "plan") {
      try {
        const plan =
          typeof message.content === "string"
            ? JSON.parse(message.content)
            : message.content;
        return (
          <div className="plan-message">
            <h4>{plan.title || "Generated Plan"}</h4>
            {Array.isArray(plan.tasks) ? (
              <ul className="plan-tasks">
                {plan.tasks.map((t, i) => (
                  <li key={i}>{t.title || t}</li>
                ))}
              </ul>
            ) : (
              <pre style={{ whiteSpace: "pre-wrap" }}>
                {JSON.stringify(plan, null, 2)}
              </pre>
            )}
          </div>
        );
      } catch (err) {
        console.error("Failed to parse plan message:", err);
        return <span>{message.content}</span>;
      }
    }

    if (message.isError) {
      return (
        <div className="error-content">
          <span className="error-icon">⚠️</span>
          <span>{message.content}</span>
        </div>
      );
    }

    return <span>{message.content}</span>;
  };

  const currentSession = sessions.find((s) => s._id === currentSessionId);

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <div className="header-content">
          <h1 className="chat-title gradient-text">AI Planner</h1>
          <p className="chat-subtitle">
            Your intelligent personal assistant powered by AI
          </p>
        </div>
        <div className="header-actions">
          {/* Session Selector */}
          {sessions.length > 0 && (
            <div className="session-selector">
              <select
                value={currentSessionId || ""}
                onChange={(e) => handleSelectSession(e.target.value || null)}
                className="session-select"
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  color: "#fff",
                  fontSize: "14px",
                  cursor: "pointer",
                  marginRight: "12px",
                }}
              >
                <option value="">New Conversation</option>
                {sessions.map((session) => (
                  <option key={session._id} value={session._id}>
                    {session.sessionTitle || "Chat Session"} -{" "}
                    {new Date(
                      session.updatedAt || session.createdAt
                    ).toLocaleDateString()}
                  </option>
                ))}
              </select>
              <button
                onClick={handleNewSession}
                className="new-session-btn"
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  transition: "all 0.3s ease",
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                }}
              >
                ➕ New
              </button>
            </div>
          )}
          <div className="status-badge">
            <div className="status-indicator"></div>
            <span>Online</span>
          </div>
        </div>
      </div>

      {/* Current Session Info */}
      {currentSession && (
        <div
          className="session-info"
          style={{
            padding: "8px 16px",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            fontSize: "13px",
            color: "rgba(255, 255, 255, 0.7)",
          }}
        >
          <strong>{currentSession.sessionTitle || "Chat Session"}</strong> •{" "}
          {currentSession.messages?.length || 0} messages •{" "}
          {new Date(
            currentSession.updatedAt || currentSession.createdAt
          ).toLocaleString()}
        </div>
      )}

      {/* Chat Messages */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="welcome-screen">
            <div className="welcome-icon">🧠</div>
            <h3 className="welcome-title">Welcome to Personal Weaver AI</h3>
            <p className="welcome-description">
              I'm here to help you with planning, task management, productivity
              tips, and more. How can I assist you today?
            </p>

            <div className="quick-prompts">
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  className="quick-prompt-btn"
                  onClick={() => handleQuickPrompt(prompt)}
                >
                  <span className="prompt-icon">✨</span>
                  <span className="prompt-text">{prompt}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${
                  message.role === "user" ? "user-message" : "ai-message"
                }`}
              >
                <div className="message-avatar">
                  {message.role === "user" ? (
                    <span className="user-avatar">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  ) : (
                    <span className="ai-avatar">🤖</span>
                  )}
                </div>
                <div className="message-content">
                  <div className="message-bubble">
                    <div className="message-text">
                      {renderMessageContent(message)}
                    </div>
                    <div className="message-time">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="message ai-message">
                <div className="message-avatar">
                  <span className="ai-avatar">🤖</span>
                </div>
                <div className="message-content">
                  <div className="message-bubble">
                    <div className="typing-indicator">
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                    </div>
                    <span className="typing-text">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="chat-input-container">
        <form onSubmit={handleSubmit} className="chat-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about productivity, planning, or tasks..."
            className="chat-input"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="send-btn"
            disabled={isLoading || !input.trim()}
          >
            <span className="send-icon">📤</span>
          </button>
        </form>
        <p className="chat-disclaimer">
          Personal Weaver AI can make mistakes. Consider checking important
          information.
        </p>
      </div>
    </div>
  );
};

export default Chat;
