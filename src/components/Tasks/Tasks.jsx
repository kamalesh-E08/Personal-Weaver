import React, { useState, useEffect } from 'react';
import './Tasks.css';
import Sidebar from '../Sidebar/Sidebar';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('priority');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    // Mock data for demonstration
    const mockTasks = [
      {
        _id: '1',
        title: 'Review quarterly financial reports',
        description: 'Analyze Q3 performance and prepare insights for stakeholders',
        completed: false,
        priority: 'high',
        category: 'Business',
        dueDate: '2024-01-15',
        estimatedTime: '2 hours',
        aiGenerated: true
      },
      {
        _id: '2',
        title: 'Schedule team standup meetings',
        description: 'Coordinate with team members for weekly standup schedule',
        completed: true,
        priority: 'medium',
        category: 'Work',
        dueDate: '2024-01-12',
        estimatedTime: '30 minutes',
        aiGenerated: true
      },
      {
        _id: '3',
        title: 'Update project documentation',
        description: 'Document recent changes and update API specifications',
        completed: false,
        priority: 'high',
        category: 'Development',
        dueDate: '2024-01-16',
        estimatedTime: '3 hours',
        aiGenerated: true
      },
      {
        _id: '4',
        title: 'Prepare presentation for client meeting',
        description: 'Create slides for upcoming client presentation on project progress',
        completed: false,
        priority: 'medium',
        category: 'Business',
        dueDate: '2024-01-18',
        estimatedTime: '1.5 hours',
        aiGenerated: false
      },
      {
        _id: '5',
        title: 'Complete React course module 5',
        description: 'Finish advanced hooks and context API lessons',
        completed: true,
        priority: 'low',
        category: 'Learning',
        dueDate: '2024-01-10',
        estimatedTime: '2 hours',
        aiGenerated: true
      },
      {
        _id: '6',
        title: 'Plan weekend workout routine',
        description: 'Design a balanced workout plan for Saturday and Sunday',
        completed: false,
        priority: 'low',
        category: 'Health',
        dueDate: '2024-01-14',
        estimatedTime: '45 minutes',
        aiGenerated: true
      }
    ];

    setTimeout(() => {
      setTasks(mockTasks);
      setLoading(false);
    }, 500);
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'completed') return task.completed;
    if (filter === 'pending') return !task.completed;
    if (filter === 'ai-generated') return task.aiGenerated;
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'priority') {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    if (sortBy === 'dueDate') {
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    return 0;
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'badge-danger';
      case 'medium': return 'badge-warning';
      case 'low': return 'badge-success';
      default: return 'badge-primary';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const toggleTaskCompletion = (taskId) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task._id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const generateAITasks = async () => {
    setLoading(true);
    // Simulate AI task generation
    setTimeout(() => {
      const newTasks = [
        {
          _id: Date.now().toString(),
          title: 'Organize digital workspace',
          description: 'Clean up desktop files and organize project folders',
          completed: false,
          priority: 'medium',
          category: 'Productivity',
          dueDate: '2024-01-20',
          estimatedTime: '1 hour',
          aiGenerated: true
        },
        {
          _id: (Date.now() + 1).toString(),
          title: 'Research industry trends',
          description: 'Stay updated with latest developments in your field',
          completed: false,
          priority: 'low',
          category: 'Learning',
          dueDate: '2024-01-22',
          estimatedTime: '45 minutes',
          aiGenerated: true
        }
      ];
      setTasks(prevTasks => [...prevTasks, ...newTasks]);
      setLoading(false);
    }, 1000);
  };

  const completedCount = tasks.filter(task => task.completed).length;
  const pendingCount = tasks.filter(task => !task.completed).length;
  const aiGeneratedCount = tasks.filter(task => task.aiGenerated).length;

  return (
    <div className="tasks-page">
      <Sidebar />
      <div className="tasks-content">
        <div className="tasks-container">
          {/* Header */}
          <div className="tasks-header">
            <div className="header-content">
              <h1 className="tasks-title gradient-text">Smart Tasks</h1>
              <p className="tasks-subtitle">AI-powered task management and productivity tracking</p>
            </div>
            <button 
              className="btn btn-primary"
              onClick={generateAITasks}
              disabled={loading}
            >
              {loading ? (
                <span className="loading-spinner"></span>
              ) : (
                <>
                  <span className="btn-icon">✨</span>
                  Generate AI Tasks
                </>
              )}
            </button>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card card">
              <div className="stat-header">
                <span className="stat-label">Total Tasks</span>
                <span className="stat-icon">✅</span>
              </div>
              <div className="stat-value">{tasks.length}</div>
              <div className="stat-change">All tasks</div>
            </div>

            <div className="stat-card card">
              <div className="stat-header">
                <span className="stat-label">Completed</span>
                <span className="stat-icon">✅</span>
              </div>
              <div className="stat-value">{completedCount}</div>
              <div className="stat-change">{Math.round((completedCount / Math.max(tasks.length, 1)) * 100)}% completion rate</div>
            </div>

            <div className="stat-card card">
              <div className="stat-header">
                <span className="stat-label">Pending</span>
                <span className="stat-icon">⏳</span>
              </div>
              <div className="stat-value">{pendingCount}</div>
              <div className="stat-change">Remaining tasks</div>
            </div>

            <div className="stat-card card">
              <div className="stat-header">
                <span className="stat-label">AI Generated</span>
                <span className="stat-icon">✨</span>
              </div>
              <div className="stat-value">{aiGeneratedCount}</div>
              <div className="stat-change">Smart suggestions</div>
            </div>
          </div>

          {/* Filters and Controls */}
          <div className="controls-section">
            <div className="filters">
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                className="select"
              >
                <option value="all">All Tasks</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="ai-generated">AI Generated</option>
              </select>

              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="select"
              >
                <option value="priority">Sort by Priority</option>
                <option value="dueDate">Sort by Due Date</option>
                <option value="category">Sort by Category</option>
              </select>
            </div>

            <button className="btn btn-outline">
              <span className="btn-icon">+</span>
              Add Manual Task
            </button>
          </div>

          {/* Tasks List */}
          <div className="tasks-list">
            {sortedTasks.map((task) => (
              <div key={task._id} className="task-card card">
                <div className="task-content">
                  <div className="task-main">
                    <div className="task-checkbox">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTaskCompletion(task._id)}
                        className="checkbox"
                      />
                    </div>
                    
                    <div className="task-info">
                      <h3 className={`task-title ${task.completed ? 'completed' : ''}`}>
                        {task.title}
                      </h3>
                      <p className="task-description">{task.description}</p>
                      
                      <div className="task-meta">
                        <div className="meta-item">
                          <span className="meta-icon">📅</span>
                          <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-icon">⏱️</span>
                          <span>Est: {task.estimatedTime}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="task-badges">
                    {task.aiGenerated && (
                      <span className="badge badge-info">
                        <span className="badge-icon">✨</span>
                        AI
                      </span>
                    )}
                    <span className={`badge ${getPriorityColor(task.priority)}`}>
                      <span className="badge-icon">{getPriorityIcon(task.priority)}</span>
                      {task.priority}
                    </span>
                    <span className="badge badge-primary">
                      {task.category}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {sortedTasks.length === 0 && (
            <div className="empty-state card">
              <div className="empty-icon">✅</div>
              <h3 className="empty-title">No tasks found</h3>
              <p className="empty-description">
                {filter === 'all' 
                  ? "You don't have any tasks yet. Let AI generate some for you!"
                  : `No tasks match the current filter: ${filter}`
                }
              </p>
              <button 
                className="btn btn-primary"
                onClick={generateAITasks}
              >
                <span className="btn-icon">✨</span>
                Generate AI Tasks
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tasks;
