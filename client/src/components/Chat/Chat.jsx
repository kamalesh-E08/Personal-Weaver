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
  const [latestPlan, setLatestPlan] = useState(null);

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

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const { data: history } = await chatApi.getChatHistory();
        if (Array.isArray(history) && history.length > 0) {
          setSessions(history);
          setCurrentSessionId((prev) =>
            !prev && history[0] ? history[0]._id : prev
          );
        }
      } catch (err) {
        console.error("Failed to load chat sessions:", err);
      }
    };
    if (user) loadSessions();
  }, [user]);

  useEffect(() => {
    if (!currentSessionId) {
      setMessages([]);
      return;
    }

    const currentSession = sessions.find((s) => s._id === currentSessionId);
    if (currentSession && currentSession.messages) {
      const formatted = currentSession.messages.map((m, idx) => ({
        id: `${currentSessionId}-${idx}`,
        role: m.role,
        content:
          typeof m.content === "string" && m.type === "plan"
            ? JSON.parse(m.content)
            : m.content,
        timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
        type: m.type || null,
      }));
      setMessages(formatted);
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
      const data = await chatApi.sendMessage(messageInput, currentSessionId);

      if (data.sessionId && data.sessionId !== currentSessionId) {
        setCurrentSessionId(data.sessionId);
        const { data: history } = await chatApi.getChatHistory();
        if (Array.isArray(history)) setSessions(history);
      }

      // 🧩 Parse plan responses directly
      let parsedContent = data?.response;
      if (data?.type === "plan" && typeof parsedContent === "string") {
        try {
          parsedContent = JSON.parse(parsedContent);
        } catch (err) {
          console.error("Failed to parse plan JSON:", err);
        }
      }

      const aiMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: parsedContent,
        timestamp: data?.timestamp ? new Date(data.timestamp) : new Date(),
        type: data?.type || null,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date(),
          isError: true,
        },
      ]);
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
    setTimeout(() => handleSubmit({ preventDefault: () => {} }), 100);
  };

  const renderMessageContent = (message) => {
    const content = message.content;

    // 🧠 AI PLAN DETECTION
    if (
      (typeof content === "object" &&
        content.title &&
        Array.isArray(content.schedule)) ||
      (typeof content === "string" && content.includes('"schedule"'))
    ) {
      try {
        const plan =
          typeof content === "string" ? JSON.parse(content) : content;
        return (
          <div className="plan-message">
            <h3>📅 {plan.title}</h3>
            <ul className="plan-schedule">
              {plan.schedule.map((item, i) => (
                <li key={i} className="plan-item">
                  <div className="plan-time">🕒 {item.time}</div>
                  <div className="plan-activity">
                    <strong>{item.activity}</strong>
                    {item.details && <p>{item.details}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      } catch (err) {
        console.error("Error rendering plan:", err);
      }
    }

    // ✅ AI Task list
    if (
      (typeof content === "object" && Array.isArray(content.tasks)) ||
      (typeof content === "string" && content.includes('"tasks"'))
    ) {
      try {
        const taskData =
          typeof content === "string" ? JSON.parse(content) : content;
        return (
          <div className="task-list-message">
            <h4>✅ AI-Generated Tasks</h4>
            <ul>
              {taskData.tasks.map((task, i) => (
                <li key={i}>🗒️ {task.title || task}</li>
              ))}
            </ul>
          </div>
        );
      } catch (err) {
        console.error("Error rendering tasks:", err);
      }
    }

    if (message.isError) {
      return (
        <div className="error-content">
          <span className="error-icon">⚠️</span>
          <span>{content}</span>
        </div>
      );
    }

    return (
      <span>
        {typeof content === "object" ? JSON.stringify(content) : content}
      </span>
    );
  };

  const currentSession = sessions.find((s) => s._id === currentSessionId);

  return (
    <div className="chat-container">
      {/* === Header === */}
      <div className="chat-header">
        <div className="header-content">
          <h1 className="chat-title gradient-text">AI Planner</h1>
          <p className="chat-subtitle">
            Your intelligent personal assistant powered by AI
          </p>
        </div>

        <div className="header-actions">
          {sessions.length > 0 && (
            <div className="session-selector">
              <select
                value={currentSessionId || ""}
                onChange={(e) => handleSelectSession(e.target.value || null)}
                className="session-select"
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
              <button onClick={handleNewSession} className="new-session-btn">
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

      {currentSession && (
        <div className="session-info">
          <strong>{currentSession.sessionTitle || "Chat Session"}</strong> •{" "}
          {currentSession.messages?.length || 0} messages •{" "}
          {new Date(
            currentSession.updatedAt || currentSession.createdAt
          ).toLocaleString()}
        </div>
      )}

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="welcome-screen">
            <div className="welcome-icon">🧠</div>
            <h3 className="welcome-title">Welcome to Personal Weaver AI</h3>
            <p className="welcome-description">
              I'm here to help you with planning, task management, and
              productivity.
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
