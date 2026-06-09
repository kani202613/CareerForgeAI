import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Interview from './pages/Interview';
import ResumeUpload from './pages/ResumeUpload';
import useAuthStore from './store/authStore';
import { LogOut, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import './index.css';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" />;
  return children;
};

function App() {
  const { isAuthenticated, logout, user } = useAuthStore();

  return (
    <Router>
      <div className="app-container">
        <header style={{ 
          padding: '1rem 2rem', 
          borderBottom: '1px solid var(--border-subtle)', 
          background: 'var(--bg-surface)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div className="flex items-center gap-4">
            <h1 className="text-gradient" style={{ fontSize: '1.5rem', margin: 0 }}>CareerForge AI</h1>
            {isAuthenticated && (
              <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                <Home size={20} /> Dashboard
              </Link>
            )}
          </div>
          {isAuthenticated && (
            <div className="flex items-center gap-4">
              <span className="text-muted" style={{ fontSize: '0.875rem' }}>Hi, {user?.name || 'Student'}</span>
              <button 
                onClick={logout} 
                className="btn btn-secondary" 
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </header>
        <main className="main-content animate-fade-in">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/interview" 
              element={
                <ProtectedRoute>
                  <Interview />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/resume" 
              element={
                <ProtectedRoute>
                  <ResumeUpload />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
