import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { 
  ArrowLeft, 
  Send, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Monitor, 
  PhoneOff, 
  MessageSquare,
  Sparkles,
  Play
} from 'lucide-react';

const Interview = () => {
  const [role, setRole] = useState('Frontend Developer');
  const [recruiterMode, setRecruiterMode] = useState(false);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Call hardware controls states (simulation)
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [screenShare, setScreenShare] = useState(false);

  const { token } = useAuthStore();
  const navigate = useNavigate();

  const handleSend = async (isFirst = false) => {
    if (!isFirst && !input.trim()) return;
    setLoading(true);
    
    const newMessage = isFirst ? null : input;
    if (!isFirst) setInput('');
    
    try {
      const response = await axios.post(
        'https://careerforgeai-ucd7.onrender.com/api/interview/chat',
        { role, history, newMessage, recruiterMode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHistory(response.data.messages);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const startInterview = () => {
    setHistory([]);
    handleSend(true);
  };

  const endInterview = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        'https://careerforgeai-ucd7.onrender.com/api/interview/end',
        { role, history },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate('/interview/feedback', {
        state: {
          score: response.data.result.score,
          feedback: response.data.result.feedback,
          role,
          transcript: history,
          fillerWordsCount: response.data.result.fillerWordsCount,
          averageWordCount: response.data.result.averageWordCount,
          clarityGrade: response.data.result.clarityGrade
        }
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-col gap-8">
      {/* Header Back Button */}
      <div className="flex items-center gap-4">
        <button 
          className="btn btn-secondary" 
          onClick={() => navigate('/')} 
          style={{ padding: '0.5rem 1rem' }}
        >
          <ArrowLeft size={16} />
          <span>Dashboard</span>
        </button>
        <h2 style={{ fontSize: '2rem', margin: 0, fontFamily: 'var(--font-display)' }}>Interview Call Room</h2>
      </div>

      {history.length === 0 ? (
        /* Setup Configuration Card */
        <div className="glass-panel" style={{ maxWidth: '600px' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.35rem' }}>Configure Setup</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              Select your target role and evaluation mode before connecting to the simulator.
            </p>
          </div>

          <div className="input-group">
            <label className="input-label">Target Role / Designation</label>
            <input 
              className="input-field" 
              value={role} 
              onChange={e => setRole(e.target.value)} 
              placeholder="e.g. Full Stack Developer"
            />
          </div>

          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-subtle)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '2rem',
              marginTop: '1.5rem',
              cursor: 'pointer'
            }}
            onClick={() => setRecruiterMode(!recruiterMode)}
          >
            <input 
              type="checkbox" 
              id="recruiter" 
              checked={recruiterMode} 
              onChange={e => setRecruiterMode(e.target.checked)} 
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <div className="flex-col" style={{ gap: '0.1rem' }}>
              <label htmlFor="recruiter" style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                Recruiter Mode (Strict Evaluation)
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Enforces rigid grading guidelines matching competitive FAANG standards.
              </span>
            </div>
          </div>

          <button 
            className="btn btn-primary w-full" 
            onClick={startInterview} 
            disabled={loading}
            style={{ padding: '0.85rem' }}
          >
            <Play size={16} />
            <span>Connect to Simulator</span>
          </button>
        </div>
      ) : (
        /* Active Call Layout */
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.1fr 0.9fr',
          gap: '2rem',
          alignItems: 'stretch'
        }} className="responsive-editor-layout">
          
          {/* Left Panel: Simulated Call Screen */}
          <div className="glass-panel flex-col" style={{ 
            justifyContent: 'space-between', 
            background: 'linear-gradient(180deg, #101118 0%, #06070a 100%)',
            minHeight: '480px',
            padding: '2rem 1.5rem',
            position: 'relative'
          }}>
            
            {/* Live Indicator overlay */}
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                padding: '0.3rem 0.75rem',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                fontWeight: 700
              }}>
                <span style={{ 
                  display: 'inline-block', 
                  width: '6px', 
                  height: '6px', 
                  background: '#ef4444', 
                  borderRadius: '50%',
                  animation: 'pulse 1s infinite alternate'
                }} />
                <span>REC LIVE</span>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Role: <strong style={{ color: 'var(--text-primary)' }}>{role}</strong>
              </span>
            </div>

            {/* Video Call Avatar and Waveform */}
            <div className="flex-col items-center justify-center" style={{ margin: 'auto' }}>
              {/* Profile Avatar Frame */}
              <div style={{
                width: '110px',
                height: '110px',
                borderRadius: '50%',
                background: loading ? 'var(--gradient-primary)' : 'rgba(255, 255, 255, 0.03)',
                border: loading ? '3px solid var(--accent-primary)' : '2px dashed var(--border-strong)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: loading ? 'var(--shadow-glow)' : 'none',
                transition: 'all 0.3s ease',
                marginBottom: '1.5rem'
              }}>
                <span style={{ fontSize: '2.5rem' }}>🤖</span>
              </div>

              <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                {loading ? 'AI Interviewer is speaking...' : 'AI Interviewer (Listening)'}
              </strong>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {loading ? 'Processing verbal answers' : 'Waiting for user input'}
              </p>

              {/* Bouncing Audio Waveform */}
              {loading && (
                <div className="waveform">
                  <div className="wave-bar" />
                  <div className="wave-bar" />
                  <div className="wave-bar" />
                  <div className="wave-bar" />
                  <div className="wave-bar" />
                  <div className="wave-bar" />
                  <div className="wave-bar" />
                  <div className="wave-bar" />
                </div>
              )}
            </div>

            {/* Zoom-style hardware controller buttons */}
            <div className="flex justify-center gap-3 w-full" style={{ marginTop: 'auto', flexWrap: 'wrap' }}>
              <button 
                onClick={() => setMuted(!muted)} 
                className="btn btn-secondary"
                style={{ 
                  borderRadius: '50%', 
                  width: '44px', 
                  height: '44px', 
                  padding: 0,
                  background: muted ? 'rgba(239, 68, 68, 0.15)' : undefined,
                  borderColor: muted ? '#ef4444' : undefined,
                  color: muted ? '#ef4444' : undefined
                }}
                title={muted ? 'Unmute Mic' : 'Mute Mic'}
              >
                {muted ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              <button 
                onClick={() => setCameraOn(!cameraOn)} 
                className="btn btn-secondary"
                style={{ 
                  borderRadius: '50%', 
                  width: '44px', 
                  height: '44px', 
                  padding: 0,
                  background: !cameraOn ? 'rgba(239, 68, 68, 0.15)' : undefined,
                  borderColor: !cameraOn ? '#ef4444' : undefined,
                  color: !cameraOn ? '#ef4444' : undefined
                }}
                title={cameraOn ? 'Turn Camera Off' : 'Turn Camera On'}
              >
                {cameraOn ? <Video size={18} /> : <VideoOff size={18} />}
              </button>

              <button 
                onClick={() => setScreenShare(!screenShare)} 
                className="btn btn-secondary"
                style={{ 
                  borderRadius: '50%', 
                  width: '44px', 
                  height: '44px', 
                  padding: 0,
                  background: screenShare ? 'rgba(16, 185, 129, 0.15)' : undefined,
                  borderColor: screenShare ? 'var(--accent-tertiary)' : undefined,
                  color: screenShare ? 'var(--accent-tertiary)' : undefined
                }}
                title="Share Screen"
              >
                <Monitor size={18} />
              </button>

              <button 
                onClick={endInterview} 
                className="btn btn-danger"
                style={{ borderRadius: 'var(--radius-md)', padding: '0.5rem 1.25rem' }}
              >
                <PhoneOff size={16} />
                <span>Disconnect Call</span>
              </button>
            </div>

          </div>

          {/* Right Panel: Conversation Stream */}
          <div className="glass-panel flex-col gap-4" style={{ height: '520px', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <MessageSquare size={16} color="var(--accent-primary)" />
              <strong style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>SESSION TRANSCRIPT</strong>
            </div>

            {/* Conversation Log */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '0.5rem', 
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem' 
            }}>
              {history.map((msg, idx) => {
                if (msg.role === 'system') return null;
                const isAssistant = msg.role === 'assistant';
                return (
                  <div 
                    key={idx} 
                    style={{ 
                      alignSelf: isAssistant ? 'flex-start' : 'flex-end',
                      maxWidth: '85%',
                      background: isAssistant ? 'rgba(255, 255, 255, 0.02)' : 'var(--gradient-primary)',
                      border: isAssistant ? '1px solid var(--border-subtle)' : 'none',
                      borderRadius: 'var(--radius-lg)',
                      padding: '1rem',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <strong style={{ 
                      display: 'block', 
                      marginBottom: '0.25rem', 
                      fontSize: '0.75rem', 
                      color: isAssistant ? 'var(--accent-tertiary)' : 'rgba(255, 255, 255, 0.8)' 
                    }}>
                      {isAssistant ? '🎤 INTERVIEWER' : '💬 YOU'}
                    </strong>
                    <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.5', color: isAssistant ? 'var(--text-secondary)' : 'white' }}>
                      {msg.content}
                    </p>
                  </div>
                );
              })}
              {loading && (
                <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Interviewer is typing...
                  </span>
                </div>
              )}
            </div>

            {/* User Answer Input Block */}
            <div className="flex gap-2" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
              <input 
                className="input-field" 
                style={{ flex: 1 }} 
                value={input} 
                onChange={e => setInput(e.target.value)}
                placeholder="Compose answer context..."
                onKeyPress={e => e.key === 'Enter' && handleSend(false)}
                disabled={loading}
              />
              <button 
                className="btn btn-primary" 
                onClick={() => handleSend(false)} 
                disabled={loading || !input.trim()}
                style={{ padding: '0.75rem 1.25rem' }}
              >
                <Send size={14} />
              </button>
            </div>

          </div>

        </div>
      )}
    </div>
  );
};

export default Interview;
