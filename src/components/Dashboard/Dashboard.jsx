import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import Sidebar from '../Sidebar/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    activePlans: 0,
    productivityScore: 0
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [recentPlans, setRecentPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Mock data for demonstration
      const mockTasks = [
        {
          _id: '1',
          title: 'Review quarterly reports',
          description: 'Analyze Q3 performance and prepare insights',
          completed: true,
          priority: 'high',
          aiGenerated: true
        },
        {
          _id: '2',
          title: 'Schedule team meeting',
          description: 'Coordinate with team members for weekly standup',
          completed: true,
          priority: 'medium',
          aiGenerated: true
        },
        {
          _id: '3',
          title: 'Update project documentation',
          description: 'Document recent changes and update API specs',
          completed: false,
          priority: 'high',
          aiGenerated: true
        },
        {
          _id: '4',
          title: 'Prepare presentation slides',
          description: 'Create slides for upcoming client presentation',
          completed: false,
          priority: 'low',
          aiGenerated: false
        }
      ];

      const mockPlans = [
        {
          _id: '1',
          title: 'Q4 Marketing Strategy',
          status: 'active',
          progress: 75
        },
        {
          _id: '2',
          title: 'Personal Fitness Journey',
          status: 'active',
          progress: 60
        },
        {
          _id: '3',
          title: 'Learning React Advanced',
          status: 'completed',
          progress: 100
        }
      ];

      setStats({
        totalTasks: mockTasks.length,
        completedTasks: mockTasks.filter(task => task.completed).length,
        activePlans: mockPlans.filter(plan => plan.status === 'active').length,
        productivityScore: Math.round((mockTasks.filter(task => task.completed).length / mockTasks.length) * 100)
      });

      setRecentTasks(mockTasks.slice(0, 4));
      setRecentPlans(mockPlans.slice(0, 3));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'high': return 'badge-danger';
      case 'medium': return 'badge-warning';
      case 'low': return 'badge-success';
      default: return 'badge-primary';
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Sidebar isCollapsed={isSidebarCollapsed} />
      
      {/* New rectangular section on top */}
      <div className="dashboard-top-section">
        <button 
          className="sidebar-toggle-top"
          onClick={toggleSidebar}
        >
          ☰
        </button>
        <div className="top-section-welcome">
          <h2 className="welcome-text"></h2>
        </div>
        <div className="top-section-actions">
          <button 
            className="btn btn-primary btn-top"
            onClick={() => handleNavigation('/chat')}
          >
            <span className="btn-icon">💬</span>
            AI Assistant
          </button>
          <button 
            className="btn btn-outline btn-top"
            onClick={() => handleNavigation('/planner')}
          >
            <span className="btn-icon">🧠</span>
            Plan Maker
          </button>
        </div>
      </div>
      
      <div className={`dashboard-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="dashboard-container">
          {/* Header */}
          <div className="dashboard-header">
            <div className="header-content">
              <h1 className="dashboard-title gradient-text">
                Welcome back, {user?.name || 'User'}
              </h1>
              <p className="dashboard-subtitle">
                Here's what's happening with your productivity today
              </p>
            </div>
            <div className="header-actions">
              {/* These buttons are now in the top section */}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card card">
              <div className="stat-header">
                <span className="stat-label">Tasks Completed</span>
                <span className="stat-icon">✅</span>
              </div>
              <div className="stat-value">{stats.completedTasks}/{stats.totalTasks}</div>
              <div className="stat-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${(stats.completedTasks / Math.max(stats.totalTasks, 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="stat-card card">
              <div className="stat-header">
                <span className="stat-label">Productivity Score</span>
                <span className="stat-icon">📊</span>
              </div>
              <div className="stat-value">{stats.productivityScore}%</div>
              <div className="stat-change">+5 from last week</div>
            </div>

            <div className="stat-card card">
              <div className="stat-header">
                <span className="stat-label">Active Plans</span>
                <span className="stat-icon">🎯</span>
              </div>
              <div className="stat-value">{stats.activePlans}</div>
              <div className="stat-change">2 in progress</div>
            </div>

            <div className="stat-card card">
              <div className="stat-header">
                <span className="stat-label">Weekly Goal</span>
                <span className="stat-icon">🏆</span>
              </div>
              <div className="stat-value">85%</div>
              <div className="stat-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '85%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="dashboard-grid">
            {/* Recent Tasks */}
            <div className="dashboard-section card">
              <div className="section-header">
                <div>
                  <h3 className="section-title">Recent Tasks</h3>
                  <p className="section-subtitle">Your latest AI-generated tasks</p>
                </div>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleNavigation('/tasks')}
                >
                  View All →
                </button>
              </div>
              <div className="tasks-list">
                {recentTasks.map((task) => (
                  <div key={task._id} className="task-item">
                    <div className="task-checkbox">
                      <input 
                        type="checkbox" 
                        checked={task.completed}
                        onChange={() => {}}
                      />
                    </div>
                    <div className="task-content">
                      <h4 className={`task-title ${task.completed ? 'completed' : ''}`}>
                        {task.title}
                      </h4>
                      <p className="task-description">{task.description}</p>
                    </div>
                    <div className="task-badges">
                      {task.aiGenerated && (
                        <span className="badge badge-info">
                          <span className="badge-icon">✨</span>
                          AI
                        </span>
                      )}
                      <span className={`badge ${getPriorityBadgeClass(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                ))}
                <button 
                  className="btn btn-outline add-task-btn"
                  onClick={() => handleNavigation('/tasks')}
                >
                  <span className="btn-icon">+</span>
                  Generate New Tasks
                </button>
              </div>
            </div>

            {/* Active Plans */}
            <div className="dashboard-section card">
              <div className="section-header">
                <div>
                  <h3 className="section-title">Active Plans</h3>
                  <p className="section-subtitle">Your AI-powered strategic plans</p>
                </div>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleNavigation('/planner')}
                >
                  View All →
                </button>
              </div>
              <div className="plans-list">
                {recentPlans.map((plan) => (
                  <div key={plan._id} className="plan-item">
                    <div className="plan-header">
                      <h4 className="plan-title">{plan.title}</h4>
                      <span className={`badge ${plan.status === 'completed' ? 'badge-success' : 'badge-primary'}`}>
                        {plan.status}
                      </span>
                    </div>
                    <div className="plan-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${plan.progress}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">{plan.progress}% complete</span>
                    </div>
                  </div>
                ))}
                <button 
                  className="btn btn-outline add-plan-btn"
                  onClick={() => handleNavigation('/planner')}
                >
                  <span className="btn-icon">+</span>
                  Create New Plan
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <h2 className="quick-actions-title">Quick Actions</h2>
            <div className="quick-actions-grid">
              <div 
                className="quick-action-card card"
                onClick={() => handleNavigation('/chat')}
              >
                <div className="quick-action-icon">💬</div>
                <h3 className="quick-action-title">Chat with AI</h3>
                <p className="quick-action-description">Get instant help and advice</p>
              </div>
              <div 
                className="quick-action-card card"
                onClick={() => handleNavigation('/planner')}
              >
                <div className="quick-action-icon">🧠</div>
                <h3 className="quick-action-title">Create Plan</h3>
                <p className="quick-action-description">Generate strategic plans</p>
              </div>
              <div 
                className="quick-action-card card"
                onClick={() => handleNavigation('/profile')}
              >
                <div className="quick-action-icon">⚡</div>
                <h3 className="quick-action-title">Optimize Settings</h3>
                <p className="quick-action-description">Personalize your experience</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
