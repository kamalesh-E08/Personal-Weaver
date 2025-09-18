import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Sidebar.css';
import { useAuth } from '../../context/AuthContext';


  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const menuItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/chat', icon: '💬', label: 'AI Assistant' },
    { path: '/planner', icon: '🧠', label: 'Plan Maker' },
    { path: '/tasks', icon: '✅', label: 'Tasks' },
    { path: '/history', icon: '📜', label: 'History' },
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleUserMenuClick = () => {
    setShowUserMenu(!showUserMenu);
  };

  const handleMenuOption = (option) => {
    setShowUserMenu(false);
    switch (option) {
      case 'settings':
        navigate('/profile');
        break;
      case 'profile':
        navigate('/profile');
        break;
      case 'logout':
        handleLogout();
        break;
      default:
        break;
    }
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <span className="brand-icon">🧠</span>
          {!isCollapsed && (
            <span className="brand-text gradient-text-primary">Personal Weaver</span>
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
                  className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                  onClick={() => handleNavigation(item.path)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {!isCollapsed && <span className="nav-text">{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="user-menu-container">
          <button className="user-menu-btn" onClick={handleUserMenuClick}>
            <div className="user-avatar-small">
              <span className="avatar-text-small">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            {!isCollapsed && (
              <div className="user-info-small">
                <div className="user-name-small">{user?.name || 'User'}</div>
              </div>
            )}
            <span className="menu-arrow">▼</span>
          </button>

          {showUserMenu && (
            <div className="user-dropup-menu">
              <button
                className="menu-option"
                onClick={() => handleMenuOption('settings')}
              >
                <span className="menu-icon">⚙️</span>
                <span>Settings</span>
              </button>
              <button
                className="menu-option"
                onClick={() => handleMenuOption('profile')}
              >
                <span className="menu-icon">👤</span>
                <span>Profile</span>
              </button>
              <button
                className="menu-option logout-option"
                onClick={() => handleMenuOption('logout')}
              >
                <span className="menu-icon">🚪</span>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
