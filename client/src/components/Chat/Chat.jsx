import React, { useState, useEffect, useRef } from "react";
import "./Chat.css";
import { useAuth } from "../../context/AuthContext";

const Chat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
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
    setInput("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponses = [
        "I'd be happy to help you with that! Let me break this down into actionable steps for you.",
        "That's a great question! Based on your productivity patterns, I recommend focusing on high-priority tasks first.",
        "I can help you create a structured plan for this. Let's start by identifying your main objectives.",
        "Here are some personalized suggestions based on your goals and current progress.",
        "I understand what you're looking for. Let me provide you with some strategic recommendations.",
        "That's an excellent goal! I can help you create a step-by-step plan to achieve it effectively.",
      ];

      const aiMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: aiResponses[Math.floor(Math.random() * aiResponses.length)],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleQuickPrompt = (prompt) => {
    setInput(prompt);
    // Auto-submit the prompt
    setTimeout(() => {
      const event = { preventDefault: () => {} };
      handleSubmit(event);
    }, 100);
  };

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
        <div className="status-badge">
          <div className="status-indicator"></div>
          <span>Online</span>
        </div>
      </div>

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
                    <p className="message-text">{message.content}</p>
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
