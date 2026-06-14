import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { 
  FileText, 
  MessageSquare, 
  TrendingUp, 
  Award, 
  Sparkles, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const [data, setData] = useState({
    resumeScore: 0,
    atsScore: 0,
    placementReadiness: 0,
    interviewScore: 0,
    resumeHistory: [],
    interviewHistory: [],
    missingSkills: [],
    activeRoadmap: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/user/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(response.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      }
    };
    fetchData();
  }, [token]);

  return (
    <div className="flex-col gap-8">
      {/* Welcome Hero Banner */}
      <div className="glass-panel" style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(217, 70, 239, 0.08) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        padding: '2.5rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '0.35rem 0.75rem',
            borderRadius: '1rem',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'var(--accent-secondary)',
            marginBottom: '1rem'
          }}>
            <Sparkles size={12} />
            <span>Placement Readiness Activated</span>
          </div>

          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.75rem', fontFamily: 'var(--font-display)' }}>
            Forge Your Way to <span className="text-gradient">Success</span>, {user?.name || 'Student'}
          </h2>
          <p className="text-secondary" style={{ maxWidth: '680px', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
            Run strict ATS document audits and voice communication analytics to identify keyword gaps. Get immediate diagnostic results tailored to senior developer expectations.
          </p>
        </div>

        {/* Decorative Grid Overlay */}
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.015) 1px, transparent 1px)',
          backgroundSize: '16px 16px', pointerEvents: 'none'
        }} />
      </div>

      {/* Interactive Metrics Bar */}
      <div className="flex gap-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        
        {/* ATS Score Card */}
        <div className="glass-panel glass-panel-hover flex-col gap-4">
          <div className="flex items-center justify-between">
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>STRICT ATS MATCH</span>
            <FileText size={18} color="var(--accent-primary)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-display)' }} className="text-gradient">
                {data.atsScore || 0}
              </span>
              <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/100</span>
            </div>
            {/* Progress line */}
            <div style={{ width: '100%', height: '4px', background: 'var(--bg-base)', borderRadius: '2px', marginTop: '0.75rem', overflow: 'hidden' }}>
              <div style={{ width: `${data.atsScore || 0}%`, height: '100%', background: 'var(--gradient-primary)', borderRadius: '2px' }} />
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
            {data.atsScore > 60 ? '✓ Exceeds freshers baseline keywords' : '⚠️ Missing crucial tools/keywords'}
          </p>
        </div>

        {/* Interview Score Card */}
        <div className="glass-panel glass-panel-hover flex-col gap-4">
          <div className="flex items-center justify-between">
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>LAST MOCK GRADE</span>
            <Award size={18} color="var(--accent-secondary)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-display)' }} className="text-gradient">
                {data.interviewScore || 0}
              </span>
              <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/100</span>
            </div>
            {/* Progress line */}
            <div style={{ width: '100%', height: '4px', background: 'var(--bg-base)', borderRadius: '2px', marginTop: '0.75rem', overflow: 'hidden' }}>
              <div style={{ width: `${data.interviewScore || 0}%`, height: '100%', background: 'var(--accent-secondary)', borderRadius: '2px' }} />
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
            {data.interviewScore > 75 ? '✓ Strong communication depth' : '⚠️ Filler words count needs improvement'}
          </p>
        </div>

        {/* Readiness Meter Card */}
        <div className="glass-panel glass-panel-hover flex-col gap-4">
          <div className="flex items-center justify-between">
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>READINESS INDEX</span>
            <TrendingUp size={18} color="var(--accent-tertiary)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-display)' }} className="text-gradient-teal">
                {data.placementReadiness || 0}%
              </span>
            </div>
            {/* Progress line */}
            <div style={{ width: '100%', height: '4px', background: 'var(--bg-base)', borderRadius: '2px', marginTop: '0.75rem', overflow: 'hidden' }}>
              <div style={{ width: `${data.placementReadiness || 0}%`, height: '100%', background: 'linear-gradient(135deg, #14b8a6, #3b82f6)', borderRadius: '2px' }} />
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
            Combined resume scoring & mock interview stats
          </p>
        </div>
      </div>

      {/* AI Placement Analytics Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        
        {/* Line Chart: ATS Score History */}
        <div className="glass-panel flex-col gap-4">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={16} color="var(--accent-primary)" />
            <span>ATS Score History</span>
          </h3>
          <div style={{ position: 'relative', height: '160px', background: 'rgba(0,0,0,0.1)', borderRadius: 'var(--radius-md)', padding: '1rem 0.5rem 0.5rem 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {data.resumeHistory && data.resumeHistory.length > 0 ? (
              (() => {
                const width = 400;
                const height = 130;
                const points = data.resumeHistory.map((r, idx) => {
                  const x = data.resumeHistory.length > 1 ? (idx / (data.resumeHistory.length - 1)) * (width - 40) + 20 : width / 2;
                  const y = height - 20 - (r.score / 100) * (height - 40);
                  return { x, y, score: r.score };
                });

                const pathD = points.length > 1 
                  ? `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`
                  : '';
                
                const areaD = points.length > 1
                  ? `${pathD} L ${points[points.length - 1].x} ${height - 10} L ${points[0].x} ${height - 10} Z`
                  : '';

                return (
                  <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <line x1="10" y1="20" x2={width - 10} y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="10" y1="50" x2={width - 10} y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="10" y1="80" x2={width - 10} y2="80" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="10" y1="110" x2={width - 10} y2="110" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

                    {points.length > 1 && <path d={areaD} fill="url(#chartAreaGrad)" />}
                    {points.length > 1 && <path d={pathD} fill="none" stroke="var(--accent-primary)" strokeWidth="3" strokeLinecap="round" />}

                    {points.map((p, idx) => (
                      <g key={idx}>
                        <circle cx={p.x} cy={p.y} r="5" fill="var(--bg-surface)" stroke="var(--accent-primary)" strokeWidth="2" />
                        <text x={p.x} y={p.y - 10} fill="var(--text-primary)" fontSize="8" fontWeight="700" textAnchor="middle">
                          {p.score}%
                        </text>
                      </g>
                    ))}
                  </svg>
                );
              })()
            ) : (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No historical data available yet. Scan your resume to start tracking.</span>
            )}
          </div>
        </div>

        {/* Bar Chart: Mock Interview Performance */}
        <div className="glass-panel flex-col gap-4">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={16} color="var(--accent-secondary)" />
            <span>Interview Performance Trend</span>
          </h3>
          <div style={{ position: 'relative', height: '160px', background: 'rgba(0,0,0,0.1)', borderRadius: 'var(--radius-md)', padding: '1rem 0.5rem 0.5rem 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {data.interviewHistory && data.interviewHistory.length > 0 ? (
              (() => {
                const width = 400;
                const height = 130;
                const len = data.interviewHistory.length;
                const colWidth = (width - 40) / len;

                return (
                  <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                    <line x1="10" y1="20" x2={width - 10} y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="10" y1="50" x2={width - 10} y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="10" y1="80" x2={width - 10} y2="80" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="10" y1="110" x2={width - 10} y2="110" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

                    {data.interviewHistory.map((item, idx) => {
                      const groupX = 20 + idx * colWidth + (colWidth - 30) / 2;
                      const barH_overall = (item.overall / 100) * (height - 40);
                      const barH_tech = (item.technicalAccuracy / 100) * (height - 40);
                      const barH_comm = (item.communication / 100) * (height - 40);

                      return (
                        <g key={idx}>
                          <rect 
                            x={groupX} 
                            y={height - 20 - barH_overall} 
                            width="8" 
                            height={barH_overall} 
                            fill="var(--accent-secondary)" 
                            rx="2"
                          />
                          <rect 
                            x={groupX + 10} 
                            y={height - 20 - barH_tech} 
                            width="8" 
                            height={barH_tech} 
                            fill="var(--accent-tertiary)" 
                            rx="2"
                          />
                          <rect 
                            x={groupX + 20} 
                            y={height - 20 - barH_comm} 
                            width="8" 
                            height={barH_comm} 
                            fill="var(--accent-primary)" 
                            rx="2"
                          />
                          <text x={groupX + 14} y={height - 5} fill="var(--text-muted)" fontSize="7" textAnchor="middle">
                            Run {idx + 1}
                          </text>
                          <text x={groupX + 14} y={height - 25 - Math.max(barH_overall, barH_tech, barH_comm)} fill="var(--text-primary)" fontSize="7" fontWeight="bold" textAnchor="middle">
                            {item.overall}%
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                );
              })()
            ) : (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No historical interview data yet. Enter mock call room.</span>
            )}
          </div>
        </div>

        {/* Skill gaps dashboard helper */}
        <div className="glass-panel flex-col gap-4">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={16} color="var(--accent-tertiary)" />
            <span>AI Skills Coach</span>
          </h3>
          <div className="flex-col gap-2" style={{ height: '160px', overflowY: 'auto' }}>
            {data.missingSkills && data.missingSkills.length > 0 ? (
              <>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>DETECTED SKILL GAPS:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
                  {data.missingSkills.slice(0, 5).map(sk => (
                    <span key={sk} style={{ background: 'rgba(217, 70, 239, 0.08)', color: 'var(--accent-secondary)', border: '1px solid rgba(217, 70, 239, 0.15)', padding: '0.2rem 0.5rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 600 }}>
                      {sk}
                    </span>
                  ))}
                </div>
                {data.activeRoadmap && data.activeRoadmap.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>ACTIVE ROADMAP:</span>
                    <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {data.activeRoadmap[0].week} • {data.activeRoadmap[0].topic}
                    </p>
                    <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {data.activeRoadmap[0].description}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                All skill gaps closed! Scan a resume to generate skill diagnostics.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Large Columns Split */}
      <div className="flex gap-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* Core Actions */}
        <div className="flex-col gap-4">
          {/* Action 1: Resume Upload */}
          <div className="glass-panel glass-panel-hover flex-col gap-4" style={{ padding: '1.75rem' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)', width: '42px', height: '42px', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyCenter: 'center', justifyContent: 'center' }}>
              <FileText size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.35rem' }}>ATS Sandbox Audit</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Upload your resume PDF and analyze how modern parser algorithms look at your formatting, dates, layout pipelines, and keyword densities.
              </p>
            </div>
            <button 
              className="btn btn-secondary w-full" 
              onClick={() => navigate('/resume')}
              style={{ justifyContent: 'space-between', padding: '0.75rem 1.25rem' }}
            >
              <span>Scan Resume</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Action 2: Mock Interview */}
          <div className="glass-panel glass-panel-hover flex-col gap-4" style={{ padding: '1.75rem' }}>
            <div style={{ background: 'rgba(217, 70, 239, 0.1)', color: 'var(--accent-secondary)', width: '42px', height: '42px', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyCenter: 'center', justifyContent: 'center' }}>
              <MessageSquare size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.35rem' }}>AI Interview Simulator</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Practice real-time text/voice conversation inside our mock video panel, tracking verbal filler pacing, speech grade levels, and technical depth.
              </p>
            </div>
            <button 
              className="btn btn-primary w-full" 
              onClick={() => navigate('/interview')}
              style={{ justifyContent: 'space-between', padding: '0.75rem 1.25rem' }}
            >
              <span>Enter Call Room</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Preparation Milestones / Checklist */}
        <div className="glass-panel flex-col gap-6" style={{ padding: '1.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>Milestone Preparation path</h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0 }}>Complete the following steps to maximize placement success.</p>
          </div>

          <div className="timeline">
            {/* Step 1 */}
            <div className="timeline-item flex-col gap-1">
              <span className={`timeline-dot ${(data.atsScore > 0) ? 'completed' : ''}`} style={{
                background: (data.atsScore > 0) ? 'var(--accent-tertiary)' : undefined
              }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>1. Submit Resume Diagnostic</strong>
                {(data.atsScore > 0) && <CheckCircle size={14} color="var(--accent-tertiary)" />}
              </div>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', margin: 0 }}>
                Upload your resume PDF to register a score in our database.
              </p>
            </div>

            {/* Step 2 */}
            <div className="timeline-item flex-col gap-1">
              <span className={`timeline-dot ${(data.atsScore > 50) ? 'completed' : ''}`} style={{
                background: (data.atsScore > 50) ? 'var(--accent-tertiary)' : undefined
              }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>2. Clear Formatting Warnings</strong>
                {(data.atsScore > 50) && <CheckCircle size={14} color="var(--accent-tertiary)" />}
              </div>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', margin: 0 }}>
                Clean up visual icons, seasonal dates, and achieve a strict score over 50%.
              </p>
            </div>

            {/* Step 3 */}
            <div className="timeline-item flex-col gap-1">
              <span className={`timeline-dot ${(data.interviewScore > 0) ? 'completed' : ''}`} style={{
                background: (data.interviewScore > 0) ? 'var(--accent-tertiary)' : undefined
              }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>3. Run Interview Practice</strong>
                {(data.interviewScore > 0) && <CheckCircle size={14} color="var(--accent-tertiary)" />}
              </div>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', margin: 0 }}>
                Conduct a mock interview simulation to map verbal pacing.
              </p>
            </div>

            {/* Step 4 */}
            <div className="timeline-item flex-col gap-1">
              <span className={`timeline-dot ${(data.interviewScore >= 70) ? 'completed' : ''}`} style={{
                background: (data.interviewScore >= 70) ? 'var(--accent-tertiary)' : undefined
              }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>4. Achieve Gold Grade</strong>
                {(data.interviewScore >= 70) && <CheckCircle size={14} color="var(--accent-tertiary)" />}
              </div>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', margin: 0 }}>
                Reduce verbal fillers and achieve a grade B or above.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
