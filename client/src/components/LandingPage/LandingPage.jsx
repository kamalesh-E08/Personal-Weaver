import React, { useState } from 'react';
import './LandingPage.css';
import { useAuth } from '../../context/AuthContext';

const LandingPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, register } = useAuth();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;
      if (isLogin) {
        result = await login(formData.email, formData.password);
      } else {
        result = await register(formData.name, formData.email, formData.password);
      }

      if (!result.success) {
        setError(result.message);
      }
    } catch{
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: '✨',
      title: 'AI Plan Maker',
      description: 'Generate intelligent plans and strategies tailored to your goals'
    },
    {
      icon: '✅',
      title: 'Smart Todo Lists',
      description: 'AI-generated tasks that adapt to your workflow and priorities'
    },
    {
      icon: '💬',
      title: 'Personal Assistant',
      description: '24/7 AI companion for questions, planning, and productivity'
    },
    {
      icon: '🔒',
      title: 'Secure & Private',
      description: 'Your data is encrypted and protected with enterprise-grade security'
    }
  ];

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-brand">
            <span className="brand-icon">🧠</span>
            <span className="brand-text gradient-text-primary">Personal Weaver</span>
          </div>
        </div>
      </nav>

      <div className="landing-content">
        {/* Left Side - Hero Content */}
        <div className="hero-section">
          <div className="hero-content">
            <div className="hero-header">
              <h1 className="hero-title gradient-text">
                Your AI-Powered
                <br />
                Personal Assistant
              </h1>
              <p className="hero-description">
                Transform your productivity with intelligent planning, smart task management, 
                and personalized assistance powered by advanced AI technology.
              </p>
            </div>

            {/* Features Grid */}
            <div className="features-grid">
              {features.map((feature, index) => (
                <div key={index} className="feature-card">
                  <div className="feature-icon">{feature.icon}</div>
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.description}</p>
                </div>
              ))}
            </div>

            <div className="hero-cta">
              <button 
                className="btn btn-primary btn-large"
                onClick={() => setIsLogin(false)}
              >
                Get Started Free
                <span className="btn-icon">→</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Forms */}
        <div className="auth-section">
          <div className="auth-card card">
            <div className="auth-header">
              <h2 className="auth-title">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="auth-description">
                {isLogin 
                  ? 'Sign in to access your personal AI assistant' 
                  : 'Join thousands of users boosting their productivity'
                }
              </p>
            </div>

            <div className="auth-tabs">
              <button 
                className={`auth-tab ${isLogin ? 'active' : ''}`}
                onClick={() => setIsLogin(true)}
              >
                Login
              </button>
              <button 
                className={`auth-tab ${!isLogin ? 'active' : ''}`}
                onClick={() => setIsLogin(false)}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {error && <div className="error-message">{error}</div>}
              
              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="name" className="form-label">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="Enter your full name"
                    required={!isLogin}
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="input"
                  placeholder={isLogin ? "Enter your password" : "Create a password"}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary auth-submit"
                disabled={loading}
              >
                {loading ? (
                  <span className="loading-spinner"></span>
                ) : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <span className="btn-icon">→</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
