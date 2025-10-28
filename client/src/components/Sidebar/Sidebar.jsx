import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Sidebar.css";
import { useAuth } from "../../context/AuthContext";

const Sidebar = ({ isCollapsed: controlledCollapsed, toggleSidebar }) => {
  const [localCollapsed, setLocalCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  const isCollapsed =
    typeof controlledCollapsed === "boolean"
      ? controlledCollapsed
      : localCollapsed;
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const menuItems = [
    { path: "/dashboard", icon: "📊", label: "Dashboard" },
    { path: "/chat", icon: "💬", label: "AI Assistant" },
    { path: "/planner", icon: "🧠", label: "Plan Maker" },
    { path: "/tasks", icon: "✅", label: "Tasks" },
    { path: "/history", icon: "📜", label: "History" },
    { path: "/profile", icon: "👤", label: "Profile" },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    // Collapse sidebar when navigation is clicked
    if (toggleSidebar && !isCollapsed) {
      toggleSidebar();
    }
  };

  // Handle clicks outside the user menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleUserMenuClick = () => {
    setShowUserMenu(!showUserMenu);
  };

  const handleMenuOptionClick = (option) => {
    setShowUserMenu(false);
    // Collapse sidebar when menu option is clicked
    if (toggleSidebar && !isCollapsed) {
      toggleSidebar();
    }
    switch (option) {
      case 'settings':
        navigate("/profile");
        break;
      case 'profile':
        navigate("/profile");
        break;
      case 'logout':
        handleLogout();
        break;
      default:
        break;
    }
  };

  return (
    <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <span className="brand-icon">🧠</span>
          {!isCollapsed && (
            <span className="brand-text gradient-text-primary">
              Personal Weaver
            </span>
          )}
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-label">Main Menu</div>
          <ul className="nav-list">
            {menuItems.map((item) => (
              <li key={item.path} className="nav-item">
                <button
                  className={`nav-link ${location.pathname === item.path ? "active" : ""
                    }`}
                  onClick={() => handleNavigation(item.path)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {!isCollapsed && (
                    <span className="nav-text">{item.label}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="user-menu-container" ref={userMenuRef}>
          <button className="user-menu-btn" onClick={handleUserMenuClick}>
            <div className="user-avatar-small">
              <span className="avatar-text-small">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
            {!isCollapsed && (
              <div className="user-info-small">
                <div className="user-name-small">{user?.name || "User"}</div>
              </div>
            )}
            <span className="menu-arrow">▼</span>
          </button>

          {showUserMenu && (
            <div className="user-dropup-menu">
              <button
                className="menu-option"
                onClick={() => handleMenuOptionClick('settings')}
              >
                <span className="menu-icon">⚙️</span>
                Settings
              </button>
              <button
                className="menu-option"
                onClick={() => handleMenuOptionClick('profile')}
              >
                <span className="menu-icon">👤</span>
                Profile
              </button>
              <button
                className="menu-option logout-option"
                onClick={() => handleMenuOptionClick('logout')}
              >
                <span className="menu-icon">🚪</span>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
