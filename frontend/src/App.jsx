import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Interview from './pages/Interview';
import InterviewFeedback from './pages/InterviewFeedback';
import ResumeUpload from './pages/ResumeUpload';
import useAuthStore from './store/authStore';
import { LogOut, LayoutDashboard, FileText, MessageSquare, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import './index.css';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" />;
  return children;
};

// Navigation wrapper component to utilize useLocation hooks
function NavigationWrapper() {
  const { isAuthenticated, logout, user } = useAuthStore();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Helper to determine active link styling
  const isActive = (path) => location.pathname === path;

  // Don't show sidebar/header if not logged in
  if (!isAuthenticated) {
    return (
      <main style={{ minHeight: '100vh', width: '100%', position: 'relative', zIndex: 5 }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </main>
    );
  }

  // Get User Initials
  const getInitials = (name) => {
    if (!name) return 'S';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="dashboard-layout">
      {/* Mobile Header Bar */}
      <header style={{
        display: 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0 1.5rem',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 90
      }} className="mobile-header-el">
        <h1 className="text-gradient" style={{ fontSize: '1.25rem', margin: 0 }}>CareerForge AI</h1>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Persistent Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'mobile-open' : ''}`} style={{
        transform: sidebarOpen ? 'translateX(0)' : undefined
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h1 className="text-gradient" style={{ fontSize: '1.5rem', margin: 0, fontWeight: 800 }}>CareerForge AI</h1>
          <button 
            onClick={() => setSidebarOpen(false)}
            style={{ display: 'none', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
            className="mobile-close-btn"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="nav-links">
          <Link 
            to="/" 
            className={`nav-item ${isActive('/') ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          <Link 
            to="/resume" 
            className={`nav-item ${isActive('/resume') ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <FileText size={20} />
            <span>ATS Resume Sandbox</span>
          </Link>
          <Link 
            to="/interview" 
            className={`nav-item ${isActive('/interview') ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <MessageSquare size={20} />
            <span>Interview Simulator</span>
          </Link>
        </nav>

        {/* User Sidebar Footer */}
        <div className="user-sidebar-card">
          <div className="user-avatar">
            {getInitials(user?.name)}
          </div>
          <div className="flex-col" style={{ flex: 1, overflow: 'hidden' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || 'Student'}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered Member</span>
          </div>
          <button 
            onClick={logout}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            title="Log Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="main-content-area" style={{
        marginTop: sidebarOpen ? '60px' : undefined
      }}>
        <Routes>
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/resume" element={<ProtectedRoute><ResumeUpload /></ProtectedRoute>} />
          <Route path="/interview" element={<ProtectedRoute><Interview /></ProtectedRoute>} />
          <Route path="/interview/feedback" element={<ProtectedRoute><InterviewFeedback /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="app-container">
        {/* Ambient background decoration */}
        <div className="ambient-glow" />
        <div className="ambient-glow-2" />
        
        <NavigationWrapper />
      </div>
    </Router>
  );
}

export default App;
