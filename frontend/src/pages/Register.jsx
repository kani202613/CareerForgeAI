import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { User, Mail, Lock, ShieldCheck, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await register(name, email, password);
    const token = localStorage.getItem('token');
    if (token) navigate('/');
  };

  return (
    <div className="split-container" style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      {/* Left Visual Branding Panel */}
      <div className="split-visual" style={{ background: 'var(--bg-base)', borderRight: '1px solid var(--border-subtle)' }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          {/* Logo Badge */}
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            padding: '0.4rem 1rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(2, 173, 200, 0.1)',
            color: 'var(--accent-primary)',
            fontSize: '0.85rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            marginBottom: '2rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <Sparkles size={14} />
            <span>Next-Gen Placement Platform</span>
          </div>

          <h2 style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '1.5rem', fontFamily: 'var(--font-display)' }}>
            Join the <br />
            <span style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>Career Revolution</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '480px', lineHeight: 1.6, marginBottom: '3rem', fontWeight: 500 }}>
            Get access to strict mock tests, interactive ATS heatmap diagnostics, and deep conversational speech metrics to stand out in front of HR managers.
          </p>

          {/* Core Feature Highlights */}
          <div className="flex-col gap-4" style={{ marginBottom: '4rem' }}>
            <div className="glass-panel" style={{ padding: '1.25rem', background: 'var(--bg-surface)', maxWidth: '460px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)', borderRadius: 'var(--radius-md)' }}>
              <div className="flex items-center gap-3">
                <div style={{ background: 'rgba(2, 173, 200, 0.1)', color: 'var(--accent-primary)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.15rem', textTransform: 'uppercase' }}>Strict ATS Sandbox</h4>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0 }}>Get line-by-line parsing warning feedback mapping to real HR algorithms.</p>
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', background: 'var(--bg-surface)', maxWidth: '460px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)', borderRadius: 'var(--radius-md)' }}>
              <div className="flex items-center gap-3">
                <div style={{ background: 'rgba(0, 119, 182, 0.1)', color: 'var(--accent-secondary)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.15rem', textTransform: 'uppercase' }}>Speech Call Simulator</h4>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0 }}>Test filler word pacing, answer depth, and speech clarity metrics.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Small Footer Testimony */}
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, borderLeft: '3px solid var(--accent-primary)', paddingLeft: '1rem' }}>
            "Strict scoring gave me a realistic diagnosis. My score was 52%, but after revisions, I secured an offer!"
          </p>
        </div>

        {/* Floating Ambient Background Decoration */}
        <div style={{
          position: 'absolute', top: '10%', left: '-50px', width: '200px', height: '200px',
          borderRadius: '50%', background: 'var(--accent-primary)', opacity: 0.05, pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', top: '65%', left: '70%', width: '150px', height: '150px',
          borderRadius: '50%', background: 'var(--accent-secondary)', opacity: 0.05, pointerEvents: 'none'
        }} />
      </div>

      {/* Right Form Container */}
      <div className="split-form-container" style={{ borderLeft: '1px solid var(--border-subtle)' }}>
        <div className="w-full animate-fade-in" style={{ maxWidth: '360px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>Create account</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Fill in the details to start your preparation path</p>
          </div>

          {error && (
            <div style={{ 
              background: 'var(--accent-primary)', 
              color: '#ffffff', 
              padding: '0.75rem 1rem', 
              borderRadius: 'var(--radius-md)', 
              fontWeight: 700,
              fontSize: '0.85rem',
              marginBottom: '1.5rem',
              textAlign: 'center',
              boxShadow: 'var(--shadow-sm)'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex-col gap-4">
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  className="input-field" 
                  style={{ paddingLeft: '2.5rem' }}
                  value={name} 
                  placeholder="Kanishka"
                  onChange={(e) => setName(e.target.value)} 
                  required 
                />
                <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

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
              {isLoading ? 'Creating Account...' : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="text-center mt-8" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
