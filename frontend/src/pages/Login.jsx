import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { Mail, Lock, ShieldCheck, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, password);
    const token = localStorage.getItem('token');
    if (token) navigate('/');
  };

  return (
    <div className="split-container">
      {/* Left Visual Branding Panel */}
      <div className="split-visual">
        <div style={{ position: 'relative', zIndex: 2 }}>
          {/* Logo Badge */}
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            padding: '0.4rem 1rem',
            borderRadius: '2rem',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            color: 'var(--accent-primary)',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '2rem'
          }}>
            <Sparkles size={14} />
            <span>Next-Gen Placement Platform</span>
          </div>

          <h2 style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '1.5rem', fontFamily: 'var(--font-display)' }}>
            Elevate Your <br />
            <span className="text-gradient">Career Readiness</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '480px', lineHeight: 1.6, marginBottom: '3rem' }}>
            A comprehensive tool suite with strict ATS validators and simulated video mock rooms designed to prepare you for top-tier tech interviews.
          </p>

          {/* Core Feature Highlights */}
          <div className="flex-col gap-4" style={{ marginBottom: '4rem' }}>
            <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(255, 255, 255, 0.02)', maxWidth: '460px' }}>
              <div className="flex items-center gap-3">
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-tertiary)', padding: '0.5rem', borderRadius: '0.5rem' }}>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.15rem' }}>Strict ATS Sandbox</h4>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Get line-by-line parsing warning feedback mapping to real HR algorithms.</p>
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(255, 255, 255, 0.02)', maxWidth: '460px' }}>
              <div className="flex items-center gap-3">
                <div style={{ background: 'rgba(217, 70, 239, 0.1)', color: 'var(--accent-secondary)', padding: '0.5rem', borderRadius: '0.5rem' }}>
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.15rem' }}>Speech Call Simulator</h4>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Test filler word pacing, answer depth, and speech clarity metrics.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Small Footer Testimony */}
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', italic: 'true', borderLeft: '2px solid var(--accent-primary)', paddingLeft: '1rem' }}>
            "Strict scoring gave me a realistic diagnosis. My score was 52%, but after revisions, I secured an offer!"
          </p>
        </div>

        {/* Ambient Decorative Orbs specifically for branding view */}
        <div style={{
          position: 'absolute', top: '-10%', left: '-10%', width: '300px', height: '300px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)', filter: 'blur(50px)'
        }} />
      </div>

      {/* Right Form Container */}
      <div className="split-form-container">
        <div className="w-full animate-fade-in" style={{ maxWidth: '360px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', fontFamily: 'var(--font-display)' }}>Welcome back</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Enter your credentials to access your dashboard</p>
          </div>

          {error && (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.2)', 
              color: '#ef4444', 
              padding: '0.75rem 1rem', 
              borderRadius: 'var(--radius-md)', 
              fontSize: '0.85rem',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex-col gap-4">
            <div className="input-group">
              <label className="input-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="email" 
                  className="input-field" 
                  style={{ paddingLeft: '2.5rem' }}
                  value={email} 
                  placeholder="name@university.edu"
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
                <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: '2rem' }}>
              <label className="input-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="password" 
                  className="input-field" 
                  style={{ paddingLeft: '2.5rem' }}
                  value={password} 
                  placeholder="••••••••"
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
                <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={isLoading} style={{ padding: '0.85rem 1.5rem' }}>
              {isLoading ? 'Verifying Account...' : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="text-center mt-8" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Don't have an account? <Link to="/register" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
