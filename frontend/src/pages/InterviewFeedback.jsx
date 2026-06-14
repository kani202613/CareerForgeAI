import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  ArrowLeft, 
  RotateCcw, 
  Sparkles, 
  CheckCircle,
  MessageSquare,
  Volume2,
  TrendingUp,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';

const InterviewFeedback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    score, 
    feedback, 
    role, 
    transcript, 
    fillerWordsCount, 
    averageWordCount, 
    clarityGrade,
    confidence,
    technicalAccuracy,
    communication,
    detailedEvaluations
  } = location.state || {};

  // Redirect if no direct call state logs exist
  if (!score && score !== 0) {
    navigate('/interview');
    return null;
  }

  // Define grade tags
  let grade, gradeColor, gradeLabel, gradeBg;
  if (score >= 80) {
    grade = 'A'; gradeColor = '#10b981'; gradeLabel = 'EXCELLENT RUN'; gradeBg = 'rgba(16, 185, 129, 0.08)';
  } else if (score >= 60) {
    grade = 'B'; gradeColor = '#3b82f6'; gradeLabel = 'GOOD FLOW'; gradeBg = 'rgba(59, 130, 246, 0.08)';
  } else if (score >= 40) {
    grade = 'C'; gradeColor = '#f59e0b'; gradeLabel = 'AVERAGE PACING'; gradeBg = 'rgba(245, 158, 11, 0.08)';
  } else {
    grade = 'D'; gradeColor = '#ef4444'; gradeLabel = 'NEEDS IMPROVEMENT'; gradeBg = 'rgba(239, 68, 68, 0.08)';
  }

  // Compute text pacing advice
  const suggestions = [];
  if (score < 80) suggestions.push('Incorporate specific tech stack achievements rather than stating general interest.');
  if (score < 70) suggestions.push('Explicitly name-drop libraries, design patterns, or testing frameworks used.');
  if (score < 60) suggestions.push('Quantify project results (e.g. "improved component render latency by 20%").');
  if (score < 50) suggestions.push('Elaborate further on implementation challenges to show senior depth.');
  if (score < 40) suggestions.push('Adopt the STAR methodology (Situation, Task, Action, Result) for logical delivery.');
  suggestions.push('Review marked verbal gaps below to reduce word repetition.');

  const userMessages = (transcript || []).filter(m => m.role === 'user');
  const interviewerMessages = (transcript || []).filter(m => m.role === 'assistant');
  const totalWords = userMessages.reduce((sum, m) => sum + m.content.split(/\s+/).length, 0);

  return (
    <div className="flex-col gap-8" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
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
        <h2 style={{ fontSize: '2rem', margin: 0, fontFamily: 'var(--font-display)' }}>Performance Audit</h2>
      </div>

      {/* Main Results View split columns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '0.9fr 1.1fr',
        gap: '2rem',
        alignItems: 'start'
      }} className="responsive-editor-layout">
        
        {/* Left Side: Score speedometer and speech stats */}
        <div className="flex-col gap-6">
          
          {/* Dashboard Speedometer Card */}
          <div className="glass-panel flex-col items-center text-center" style={{ position: 'relative', padding: '2rem 1.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Target: {role}
            </span>

            {/* SVG Speedometer Gauge */}
            <div style={{ position: 'relative', display: 'inline-block', margin: '1.5rem 0' }}>
              <svg width="200" height="120" viewBox="0 0 200 120">
                {/* Background arc */}
                <path 
                  d="M20 110 A80 80 0 0 1 180 110" 
                  fill="none" 
                  stroke="var(--bg-elevated)" 
                  strokeWidth="12" 
                  strokeLinecap="round" 
                />
                {/* Colored arc representing score */}
                <path 
                  d="M20 110 A80 80 0 0 1 180 110" 
                  fill="none" 
                  stroke="url(#gradeGradient)" 
                  strokeWidth="12" 
                  strokeLinecap="round" 
                  strokeDasharray="251" 
                  strokeDashoffset={251 - (251 * score) / 100}
                  style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
                />
                {/* Gradient Definitions */}
                <defs>
                  <linearGradient id="gradeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="var(--accent-primary)" />
                    <stop offset="100%" stopColor={gradeColor} />
                  </linearGradient>
                </defs>
              </svg>

              {/* Text indicator inside gauge */}
              <div style={{
                position: 'absolute',
                bottom: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', lineHeight: 1 }}>
                  {score}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Readiness Score</div>
              </div>
            </div>

            {/* Performance Grade Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 1.2rem',
              borderRadius: '2rem',
              background: gradeBg,
              border: `1px solid ${gradeColor}33`,
              color: gradeColor,
              fontWeight: 700,
              fontSize: '0.85rem',
              letterSpacing: '0.05em'
            }}>
              <Sparkles size={14} />
              <span>GRADE {grade} • {gradeLabel}</span>
            </div>
          </div>          {/* AI Evaluated Dimensions */}
          <div className="glass-panel flex-col gap-4">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={16} color="var(--accent-primary)" />
              <span>AI Evaluation Dimensions</span>
            </h3>

            <div className="flex-col gap-3">
              {/* Technical Accuracy */}
              <div>
                <div className="flex justify-between items-center" style={{ marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TECHNICAL ACCURACY</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>{technicalAccuracy || 0}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${technicalAccuracy || 0}%`, height: '100%', background: 'var(--accent-secondary)', borderRadius: '3px' }} />
                </div>
              </div>

              {/* Communication structure */}
              <div>
                <div className="flex justify-between items-center" style={{ marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>COMMUNICATION DEPTH</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{communication || 0}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${communication || 0}%`, height: '100%', background: 'var(--accent-primary)', borderRadius: '3px' }} />
                </div>
              </div>

              {/* Confidence pacing */}
              <div>
                <div className="flex justify-between items-center" style={{ marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>CONFIDENCE & PACING</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-tertiary)' }}>{confidence || 0}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${confidence || 0}%`, height: '100%', background: 'var(--accent-tertiary)', borderRadius: '3px' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Speech analytics stats */}
          <div className="glass-panel flex-col gap-4">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Volume2 size={16} color="var(--accent-secondary)" />
              <span>Speech & Pacing Gaps</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              
              {/* Clarity Box */}
              <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>CLARITY INDEX</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: clarityGrade === 'A' ? '#10b981' : '#f59e0b', marginTop: '0.25rem' }}>
                  {clarityGrade || 'B'}
                </div>
                <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                  Based on repetition and vocabulary selection.
                </p>
              </div>

              {/* Fillers Box */}
              <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>FILLER WORDS</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: (fillerWordsCount || 0) > 6 ? '#ef4444' : '#10b981', marginTop: '0.25rem' }}>
                  {fillerWordsCount || 0}
                </div>
                <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                  Counts of "like", "um", "basically", "actually".
                </p>
              </div>

            </div>

            {/* Answer Depth Bar */}
            <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>AVERAGE ANSWER DEPTH</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{averageWordCount || 0} words</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${Math.min((averageWordCount || 0) * 1.5, 100)}%`, 
                  height: '100%', 
                  background: (averageWordCount || 0) < 35 ? '#ef4444' : 'var(--accent-tertiary)',
                  borderRadius: '3px'
                }} />
              </div>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                {(averageWordCount || 0) < 35 ? '⚠️ Short answers detected. Expand technical details.' : '✓ Balanced detail and content depth.'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Feedback narrative and suggestions checklist */}
        <div className="flex-col gap-6">
          
          {/* Narrative Summary Card */}
          <div className="glass-panel flex-col gap-4">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Trophy size={18} color="var(--accent-primary)" />
              <span>Executive Feedback</span>
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: '1.7', margin: 0 }}>
              {feedback}
            </p>
          </div>

          {/* Action Checklist Suggestions */}
          <div className="glass-panel flex-col gap-4">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lightbulb size={18} color="var(--accent-tertiary)" />
              <span>Recommended Revisions</span>
            </h3>

            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {suggestions.map((s, idx) => (
                <li key={idx} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border-subtle)',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: 'var(--gradient-primary)',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    {idx + 1}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {s}
                  </span>
                </li>
              ))}
            </ul>
          </div>

        </div>

      </div>

      {/* Global Session Statistics Row */}
      <div className="flex gap-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-panel text-center" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-primary)', fontFamily: 'var(--font-display)' }}>
            {interviewerMessages.length}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginTop: '0.15rem' }}>Questions Asked</div>
        </div>

        <div className="glass-panel text-center" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-secondary)', fontFamily: 'var(--font-display)' }}>
            {userMessages.length}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginTop: '0.15rem' }}>Answers Logged</div>
        </div>

        <div className="glass-panel text-center" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-tertiary)', fontFamily: 'var(--font-display)' }}>
            {totalWords}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginTop: '0.15rem' }}>Total Word Count</div>
        </div>
      </div>

      {/* Full Conversation Transcript Timeline */}
      <div className="glass-panel flex-col gap-4">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
          <MessageSquare size={16} color="var(--accent-primary)" />
          <span>Interactive Session Transcript</span>
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.5rem' }}>
          {(transcript || []).map((msg, idx) => {
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
                  color: isAssistant ? 'var(--accent-tertiary)' : 'rgba(255,255,255,0.8)'
                }}>
                  {isAssistant ? '🎤 INTERVIEWER' : '💬 YOU'}
                </strong>
                <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5, color: isAssistant ? 'var(--text-secondary)' : 'white' }}>
                  {msg.content}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Detailed Q&A Audit */}
      {detailedEvaluations && detailedEvaluations.length > 0 && (
        <div className="glass-panel flex-col gap-4">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem', margin: 0 }}>
            <Sparkles size={16} color="var(--accent-tertiary)" />
            <span>AI Question-by-Question Audit</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {detailedEvaluations.map((item, idx) => (
              <div key={idx} style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-subtle)', padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', borderBottom: '1px solid rgba(255, 255, 255, 0.03)', paddingBottom: '0.5rem' }}>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--accent-primary)' }}>Q{idx + 1}: Technical assessment</strong>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)', padding: '0.2rem 0.65rem', borderRadius: '0.5rem' }}>
                    Score: {item.overall || 0}%
                  </span>
                </div>
                <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>"{item.question}"</p>
                <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '0.75rem', fontSize: '0.825rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  "{item.answer}"
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Accuracy</span>
                    <strong style={{ color: 'var(--accent-secondary)' }}>{item.technicalAccuracy || 0}%</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Communication</span>
                    <strong style={{ color: 'var(--accent-primary)' }}>{item.communication || 0}%</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Confidence</span>
                    <strong style={{ color: 'var(--accent-tertiary)' }}>{item.confidence || 0}%</strong>
                  </div>
                </div>

                <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(99, 102, 241, 0.03)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-secondary)', borderLeft: '3px solid var(--accent-primary)' }}>
                  <strong>AI Feedback: </strong> {item.feedback}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Bottom Action buttons */}
      <div className="flex gap-4" style={{ justifyContent: 'center', paddingBottom: '2.5rem' }}>
        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/interview')}
          style={{ padding: '0.75rem 1.5rem' }}
        >
          <RotateCcw size={16} />
          <span>Restart Interview Simulator</span>
        </button>
        <button 
          className="btn btn-secondary" 
          onClick={() => navigate('/')}
          style={{ padding: '0.75rem 1.5rem' }}
        >
          <span>Back to Dashboard</span>
        </button>
      </div>

    </div>
  );
};

export default InterviewFeedback;
