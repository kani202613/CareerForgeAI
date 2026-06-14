import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Trophy, Target, TrendingUp, AlertTriangle, ArrowLeft, RotateCcw } from 'lucide-react';

const InterviewFeedback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { score, feedback, role, transcript, fillerWordsCount, averageWordCount, clarityGrade } = location.state || {};

  // If no data, redirect back
  if (!score && score !== 0) {
    navigate('/interview');
    return null;
  }

  // Determine grade & color
  let grade, gradeColor, gradeLabel;
  if (score >= 80) {
    grade = 'A'; gradeColor = '#22c55e'; gradeLabel = 'Excellent';
  } else if (score >= 60) {
    grade = 'B'; gradeColor = '#3b82f6'; gradeLabel = 'Good';
  } else if (score >= 40) {
    grade = 'C'; gradeColor = '#f59e0b'; gradeLabel = 'Average';
  } else {
    grade = 'D'; gradeColor = '#ef4444'; gradeLabel = 'Needs Improvement';
  }

  // Generate suggestions based on score
  const suggestions = [];
  if (score < 80) suggestions.push('Use specific examples from your real projects to support your answers.');
  if (score < 70) suggestions.push('Mention technologies, frameworks, and tools by name rather than speaking generically.');
  if (score < 60) suggestions.push('Quantify your achievements — use numbers like "reduced load time by 40%".');
  if (score < 50) suggestions.push('Provide longer, more detailed explanations to show depth of knowledge.');
  if (score < 40) suggestions.push('Practice common interview questions and prepare structured responses (STAR method).');
  suggestions.push('Review the transcript below to identify weak answers and improve them.');
  if (score >= 80) suggestions.push('Great job! Consider practicing with Recruiter Mode for an even tougher challenge.');

  // Count user answers
  const userMessages = (transcript || []).filter(m => m.role === 'user');
  const interviewerMessages = (transcript || []).filter(m => m.role === 'assistant');

  return (
    <div className="flex-col gap-8" style={{ maxWidth: '900px', margin: '0 auto' }}>

      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <button className="btn btn-secondary" onClick={() => navigate('/')} style={{ padding: '0.5rem 1rem' }}>
          <ArrowLeft size={16} /> Dashboard
        </button>
        <h2 style={{ fontSize: '2rem', margin: 0 }}>Interview Results</h2>
      </div>

      {/* ── Score Card ── */}
      <div className="glass-panel" style={{ textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Glow background */}
        <div style={{
          position: 'absolute', top: '-50%', left: '50%', transform: 'translateX(-50%)',
          width: '300px', height: '300px', borderRadius: '50%',
          background: `radial-gradient(circle, ${gradeColor}22, transparent 70%)`,
          pointerEvents: 'none'
        }} />

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          Role: <strong style={{ color: 'var(--text-primary)' }}>{role}</strong>
        </p>

        {/* Circular score */}
        <div style={{ position: 'relative', display: 'inline-block', margin: '1rem 0' }}>
          <svg width="180" height="180" viewBox="0 0 180 180">
            {/* Background circle */}
            <circle cx="90" cy="90" r="78" fill="none" stroke="var(--bg-elevated)" strokeWidth="12" />
            {/* Score arc */}
            <circle cx="90" cy="90" r="78" fill="none" stroke={gradeColor} strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${(score / 100) * 490} 490`}
              transform="rotate(-90 90 90)"
              style={{ transition: 'stroke-dasharray 1.5s ease' }}
            />
          </svg>
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: gradeColor }}>
              {score}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>out of 100</div>
          </div>
        </div>

        <div style={{
          display: 'inline-block', padding: '0.4rem 1.2rem', borderRadius: 'var(--radius-2xl)',
          background: `${gradeColor}18`, border: `1px solid ${gradeColor}44`, color: gradeColor,
          fontWeight: 700, fontSize: '1rem', marginTop: '0.5rem'
        }}>
          Grade {grade} — {gradeLabel}
        </div>
      </div>

      {/* ── Feedback ── */}
      <div className="glass-panel flex-col gap-4">
        <div className="flex items-center gap-2">
          <Target size={20} style={{ color: 'var(--accent-primary)' }} />
          <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Feedback</h3>
        </div>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '1rem' }}>
          {feedback}
        </p>
      </div>

      {/* ── Suggestions ── */}
      <div className="glass-panel flex-col gap-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={20} style={{ color: 'var(--accent-tertiary)' }} />
          <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Suggestions to Improve</h3>
        </div>
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {suggestions.map((s, i) => (
            <li key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
              padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-base)', border: '1px solid var(--border-subtle)'
            }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                minWidth: '24px', height: '24px', borderRadius: '50%', fontSize: '0.75rem',
                background: 'var(--gradient-primary)', color: 'white', fontWeight: 700
              }}>
                {i + 1}
              </span>
              <span style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{s}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Stats ── */}
      <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
        <div className="glass-panel" style={{ flex: '1 1 200px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--accent-primary)' }}>
            {interviewerMessages.length}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Questions Asked</div>
        </div>
        <div className="glass-panel" style={{ flex: '1 1 200px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--accent-secondary)' }}>
            {userMessages.length}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Your Answers</div>
        </div>
        <div className="glass-panel" style={{ flex: '1 1 200px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--accent-tertiary)' }}>
            {userMessages.reduce((sum, m) => sum + m.content.split(/\s+/).length, 0)}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Words</div>
        </div>
      </div>

      {/* ── Communication & Speech Analytics ── */}
      <div className="glass-panel flex-col gap-4">
        <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--accent-secondary)' }}>🎤 Communication & Speech Analytics</h3>
        <div className="flex gap-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'var(--bg-base)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Clarity Grade</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: clarityGrade === 'A' ? '#22c55e' : clarityGrade === 'B' ? '#3b82f6' : clarityGrade === 'C' ? '#f59e0b' : '#ef4444' }}>
              {clarityGrade || 'B'}
            </div>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              {clarityGrade === 'A' ? 'Excellent clarity!' : clarityGrade === 'B' ? 'Good verbal flow.' : clarityGrade === 'C' ? 'Noticeable filler words.' : 'Heavy filler word density.'}
            </p>
          </div>
          <div style={{ background: 'var(--bg-base)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Filler Words Count</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: (fillerWordsCount || 0) > 8 ? '#ef4444' : (fillerWordsCount || 0) > 4 ? '#f59e0b' : '#22c55e' }}>
              {fillerWordsCount || 0}
            </div>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              Avoid verbal fillers like "um", "like", "basically", "actually".
            </p>
          </div>
          <div style={{ background: 'var(--bg-base)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Avg. Answer Depth</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: (averageWordCount || 0) < 30 ? '#ef4444' : '#22c55e' }}>
              {averageWordCount || 0} <span style={{ fontSize: '1rem', fontWeight: 'normal' }}>wds</span>
            </div>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              {(averageWordCount || 0) < 30 ? 'Short answers. Expand with details.' : 'Detailed explanations.'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Transcript ── */}
      <div className="glass-panel flex-col gap-4">
        <div className="flex items-center gap-2">
          <Trophy size={20} style={{ color: 'var(--accent-secondary)' }} />
          <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Full Transcript</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '500px', overflowY: 'auto', padding: '0.5rem' }}>
          {(transcript || []).map((msg, idx) => (
            <div key={idx} style={{
              padding: '1rem', borderRadius: 'var(--radius-md)',
              background: msg.role === 'assistant' ? 'var(--bg-elevated)' : 'var(--accent-primary)',
              marginLeft: msg.role === 'assistant' ? '0' : 'auto',
              marginRight: msg.role === 'assistant' ? 'auto' : '0',
              maxWidth: '85%'
            }}>
              <strong style={{
                display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem',
                color: msg.role === 'assistant' ? 'var(--accent-tertiary)' : 'rgba(255,255,255,0.7)'
              }}>
                {msg.role === 'assistant' ? '🎤 Interviewer' : '💬 You'}
              </strong>
              <p style={{ margin: 0, lineHeight: 1.6 }}>{msg.content}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="flex gap-4" style={{ justifyContent: 'center', paddingBottom: '2rem' }}>
        <button className="btn btn-primary" onClick={() => navigate('/interview')}>
          <RotateCcw size={16} /> Try Again
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>

    </div>
  );
};

export default InterviewFeedback;
