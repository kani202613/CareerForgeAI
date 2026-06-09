import React, { useState } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';

const Interview = () => {
  const [role, setRole] = useState('Frontend Developer');
  const [recruiterMode, setRecruiterMode] = useState(false);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { token } = useAuthStore();

  const handleSend = async (isFirst = false) => {
    if (!isFirst && !input.trim()) return;
    setLoading(true);
    
    const newMessage = isFirst ? null : input;
    if (!isFirst) setInput('');
    
    try {
      const response = await axios.post(
        'http://localhost:5000/api/interview/chat',
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
        'http://localhost:5000/api/interview/end',
        { role, history },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Interview Finished! Score: ${response.data.result.score}/100\nFeedback: ${response.data.result.feedback}`);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-col gap-8">
      <h2 style={{ fontSize: '2rem' }}>Mock Interview Simulator</h2>
      
      {history.length === 0 ? (
        <div className="glass-panel" style={{ maxWidth: '600px' }}>
          <div className="input-group">
            <label className="input-label">Target Role</label>
            <input 
              className="input-field" 
              value={role} 
              onChange={e => setRole(e.target.value)} 
            />
          </div>
          <div className="flex items-center gap-2 mb-4 mt-4">
            <input 
              type="checkbox" 
              id="recruiter" 
              checked={recruiterMode} 
              onChange={e => setRecruiterMode(e.target.checked)} 
            />
            <label htmlFor="recruiter">Recruiter Mode (Strict Evaluation)</label>
          </div>
          <button className="btn btn-primary" onClick={startInterview} disabled={loading}>
            {loading ? 'Starting...' : 'Start Interview'}
          </button>
        </div>
      ) : (
        <div className="glass-panel flex-col gap-4">
          <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '1rem', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)' }}>
            {history.map((msg, idx) => {
              if (msg.role === 'system') return null; // hide system prompt
              return (
                <div key={idx} style={{ 
                  marginBottom: '1rem', 
                  padding: '1rem', 
                  borderRadius: 'var(--radius-md)',
                  background: msg.role === 'assistant' ? 'var(--bg-elevated)' : 'var(--accent-primary)',
                  marginLeft: msg.role === 'assistant' ? '0' : 'auto',
                  marginRight: msg.role === 'assistant' ? 'auto' : '0',
                  maxWidth: '80%'
                }}>
                  <strong style={{ display: 'block', marginBottom: '0.5rem', color: msg.role === 'assistant' ? 'var(--accent-tertiary)' : 'white' }}>
                    {msg.role === 'assistant' ? 'Interviewer' : 'You'}
                  </strong>
                  <p style={{ margin: 0 }}>{msg.content}</p>
                </div>
              );
            })}
            {loading && <div className="text-muted" style={{ padding: '1rem' }}>Interviewer is typing...</div>}
          </div>
          <div className="flex gap-2">
            <input 
              className="input-field" 
              style={{ flex: 1 }} 
              value={input} 
              onChange={e => setInput(e.target.value)}
              placeholder="Type your answer..."
              onKeyPress={e => e.key === 'Enter' && handleSend(false)}
            />
            <button className="btn btn-primary" onClick={() => handleSend(false)} disabled={loading}>Send</button>
            <button className="btn btn-secondary" onClick={endInterview} disabled={loading}>End & Score</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Interview;
