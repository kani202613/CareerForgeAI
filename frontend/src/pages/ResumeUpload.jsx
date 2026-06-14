import React, { useState, useRef } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { 
  FileText, 
  AlertTriangle, 
  AlertCircle,
  CheckCircle, 
  Sparkles, 
  HelpCircle, 
  UploadCloud, 
  ArrowLeft,
  ChevronRight,
  Info,
  ListFilter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ResumeUpload = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { token } = useAuthStore();
  const fileInputRef = useRef(null);
  const [selectedLine, setSelectedLine] = useState(null);
  const [activeTab, setActiveTab] = useState('critical'); // 'critical', 'strengths', 'suggestions', 'diagnostics'
  const [jobDescription, setJobDescription] = useState('');
  const navigate = useNavigate();

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('resume', file);
    if (jobDescription.trim()) {
      formData.append('jobDescription', jobDescription.trim());
    }

    try {
      const response = await axios.post(
        '/api/resume/upload',
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(response.data.result);
      setSelectedLine(null);
      
      // Auto-set the active tab based on results
      const data = response.data.result;
      if (data.warnings && data.warnings.length > 0) {
        setActiveTab('critical');
      } else if (data.strengths && data.strengths.length > 0) {
        setActiveTab('strengths');
      } else {
        setActiveTab('suggestions');
      }
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || 'Failed to analyze resume. Please try again.';
      alert(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleLineClick = (line) => {
    if (line.reason) {
      setSelectedLine(line);
      setActiveTab('diagnostics');
    }
  };

  return (
    <div className="flex-col gap-8">
      {/* Header Back Button */}
      <div className="flex items-center gap-4" style={{ flexWrap: 'wrap' }}>
        <button 
          className="btn btn-secondary" 
          onClick={() => navigate('/')} 
          style={{ padding: '0.5rem 1rem' }}
        >
          <ArrowLeft size={16} />
          <span>Dashboard</span>
        </button>
        <h2 style={{ fontSize: '2rem', margin: 0, fontFamily: 'var(--font-display)' }}>Resume Analyzer Sandbox</h2>
      </div>
      
      {/* File Upload Zone */}
      <div className="glass-panel" style={{ maxWidth: '640px' }}>
        <div className="input-group mb-6">
          <label className="input-label mb-2">Drag or select your resume file</label>
          <input 
            type="file" 
            ref={fileInputRef}
            accept="application/pdf"
            onChange={e => setFile(e.target.files[0])}
            style={{ display: 'none' }}
          />
          <div 
            onClick={() => fileInputRef.current.click()}
            style={{
              border: '2px dashed var(--border-strong)',
              borderRadius: 'var(--radius-lg)',
              padding: '3rem 2rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: 'rgba(255, 255, 255, 0.01)',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--accent-primary)';
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.03)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-strong)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.01)';
            }}
          >
            <div style={{
              width: '3.5rem',
              height: '3.5rem',
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)'
            }}>
              <UploadCloud size={24} />
            </div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                {file ? file.name : 'Choose Resume PDF'}
              </div>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Supports standard PDF files (limit 5MB)'}
              </div>
            </div>
          </div>
        </div>

        {/* Target Job Description Optional Textarea */}
        <div className="input-group mb-6">
          <label className="input-label mb-2" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Target Job Description (Optional)
          </label>
          <textarea
            className="input-field w-full"
            placeholder="Paste the target job description (JD) here to match missing keywords, extract required skills, and calculate a strict job-to-resume match percentage..."
            value={jobDescription}
            onChange={e => setJobDescription(e.target.value)}
            rows={4}
            style={{
              width: '100%',
              background: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              fontFamily: 'inherit',
              resize: 'vertical',
              outline: 'none'
            }}
          />
        </div>

        <button 
          className="btn btn-primary w-full" 
          onClick={handleUpload} 
          disabled={loading || !file}
          style={{ padding: '0.85rem 1.5rem' }}
        >
          {loading ? 'Executing Strict ATS Parse...' : 'Analyze Resume Structure'}
        </button>
      </div>

      {result && (
        <div className="flex-col gap-6 animate-fade-in">
          
          {/* Executive Summary Cards */}
          <div className="flex gap-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
            <div className="glass-panel flex items-center justify-between" style={{ padding: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Target Profile</span>
                <h4 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: '0.25rem 0 0 0' }}>
                  {result.candidateProfile || 'Fresher'}
                </h4>
              </div>
              <span style={{ 
                background: 'rgba(99, 102, 241, 0.1)', 
                color: 'var(--accent-primary)',
                padding: '0.4rem 0.8rem',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                Detected
              </span>
            </div>

            <div className="glass-panel flex items-center justify-between" style={{ padding: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Overall Rating</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.15rem', marginTop: '0.15rem' }}>
                  <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{result.resumeScore}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/100</span>
                </div>
              </div>
              <CheckCircle size={24} color="var(--accent-tertiary)" />
            </div>

            <div className="glass-panel flex items-center justify-between" style={{ padding: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Strict ATS Match</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.15rem', marginTop: '0.15rem' }}>
                  <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>{result.atsScore}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>%</span>
                </div>
              </div>
              <AlertTriangle size={24} color="#f59e0b" />
            </div>
          </div>

          {/* Skill Tag Deck */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              Extracted Technical Keywords ({result.extractedSkills?.length || 0})
            </h4>
            <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
              {result.extractedSkills?.map(skill => (
                <span key={skill} style={{ 
                  background: 'var(--bg-base)', 
                  color: 'var(--text-secondary)',
                  padding: '0.3rem 0.8rem', 
                  borderRadius: '1rem', 
                  fontSize: '0.825rem',
                  border: '1px solid var(--border-subtle)',
                  fontWeight: 500
                }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Interactive Document Sandbox Section */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1.1fr 0.9fr', 
            gap: '2rem', 
            alignItems: 'start'
          }} className="responsive-editor-layout">
            
            {/* Left: Reconstructed PDF A4 Paper Sheet */}
            <div className="flex-col gap-2">
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', paddingLeft: '0.25rem' }}>
                Interactive Document Canvas (Reconstructed Lines)
              </span>
              <div 
                style={{
                  background: 'var(--bg-surface)',
                  padding: '2.5rem 1.5rem',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-lg)'
                }}
              >
                <div className="resume-paper">
                  {/* Watermark overlay */}
                  <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    color: '#cbd5e1',
                    border: '1.5px solid #cbd5e1',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    fontFamily: 'var(--font-sans)',
                    textTransform: 'uppercase',
                    userSelect: 'none',
                    opacity: 0.8
                  }}>
                    Strict ATS Scan View
                  </div>

                  {result.highlightedLines?.map((line, idx) => {
                    let textHighlight = 'transparent';
                    let textDecoration = 'none';
                    let markerBorder = 'transparent';
                    let borderLeftColor = 'transparent';
                    let cursorState = 'default';
                    
                    if (line.status === 'strength') { 
                      textHighlight = 'rgba(34, 197, 94, 0.07)'; 
                      borderLeftColor = 'rgba(34, 197, 94, 0.6)';
                      cursorState = 'pointer'; 
                    }
                    if (line.status === 'weakness') { 
                      textHighlight = 'rgba(245, 158, 11, 0.07)'; 
                      borderLeftColor = 'rgba(245, 158, 11, 0.6)';
                      cursorState = 'pointer'; 
                    }
                    if (line.status === 'warning') { 
                      textHighlight = 'rgba(239, 68, 68, 0.07)'; 
                      borderLeftColor = 'rgba(239, 68, 68, 0.6)';
                      textDecoration = 'underline dotted rgba(239, 68, 68, 0.8)';
                      cursorState = 'pointer'; 
                    }

                    const isSelected = selectedLine && selectedLine.text === line.text;
                    const finalBackground = isSelected ? 'rgba(99, 102, 241, 0.12)' : textHighlight;
                    const finalBorderLeft = isSelected ? '3px solid var(--accent-primary)' : `3px solid ${borderLeftColor}`;

                    return (
                      <div 
                        key={idx}
                        onClick={() => handleLineClick(line)}
                        style={{
                          background: finalBackground,
                          borderLeft: finalBorderLeft,
                          padding: '0.15rem 0.5rem',
                          marginBottom: '1px',
                          cursor: cursorState,
                          borderRadius: '0 4px 4px 0',
                          textDecoration: textDecoration,
                          fontFamily: line.status === 'header' ? 'var(--font-sans)' : undefined,
                          fontWeight: line.status === 'header' ? '700' : '400',
                          fontSize: line.status === 'header' ? '0.95rem' : '0.85rem',
                          textAlign: line.status === 'header' ? 'center' : 'left',
                          color: '#1e293b',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.5rem'
                        }}
                        className="resume-line-hover"
                      >
                        {/* Line number gutter to make it look like a parser terminal */}
                        <span style={{ 
                          fontFamily: 'monospace', 
                          fontSize: '0.7rem', 
                          color: '#94a3b8', 
                          width: '18px', 
                          display: 'inline-block',
                          textAlign: 'right',
                          marginRight: '0.5rem',
                          userSelect: 'none'
                        }}>
                          {idx + 1}
                        </span>
                        <span style={{ flex: 1 }}>{line.text || ' '}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Tabbed Analysis & Diagnostics Panel */}
            <div className="flex-col gap-2">
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', paddingLeft: '0.25rem' }}>
                ATS Analysis Console
              </span>
              
              <div className="glass-panel" style={{ minHeight: '480px' }}>
                {/* Tab header buttons */}
                <div className="tab-container" style={{ flexWrap: 'wrap', gap: '0.25rem' }}>
                  {result.warnings?.length > 0 && (
                    <button 
                      onClick={() => setActiveTab('critical')}
                      className={`tab-btn ${activeTab === 'critical' ? 'active' : ''}`}
                    >
                      Flags ({result.warnings.length})
                    </button>
                  )}
                  <button 
                    onClick={() => setActiveTab('strengths')}
                    className={`tab-btn ${activeTab === 'strengths' ? 'active' : ''}`}
                  >
                    Strengths ({result.aiFeedback?.strengths?.length || result.strengths?.length || 0})
                  </button>
                  <button 
                    onClick={() => setActiveTab('suggestions')}
                    className={`tab-btn ${activeTab === 'suggestions' ? 'active' : ''}`}
                  >
                    Rewrite Checklist
                  </button>
                  {result.learningRoadmap?.length > 0 && (
                    <button 
                      onClick={() => setActiveTab('roadmap')}
                      className={`tab-btn ${activeTab === 'roadmap' ? 'active' : ''}`}
                    >
                      AI Coach Roadmap
                    </button>
                  )}
                  {result.jdMatch && result.jdMatch.matchPercentage !== null && (
                    <button 
                      onClick={() => setActiveTab('jdmatch')}
                      className={`tab-btn ${activeTab === 'jdmatch' ? 'active' : ''}`}
                    >
                      JD Match
                    </button>
                  )}
                  {selectedLine && (
                    <button 
                      onClick={() => setActiveTab('diagnostics')}
                      className={`tab-btn ${activeTab === 'diagnostics' ? 'active' : ''}`}
                    >
                      Line Audit
                    </button>
                  )}
                </div>

                {/* Tab Content 1: Critical Warnings */}
                {activeTab === 'critical' && (
                  <div className="flex-col gap-4 animate-fade-in">
                    <div style={{
                      background: 'rgba(239, 68, 68, 0.05)',
                      border: '1px solid rgba(239, 68, 68, 0.15)',
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem'
                    }}>
                      <Info size={18} color="#ef4444" style={{ marginTop: '0.15rem', flexShrink: 0 }} />
                      <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                        These formatting structural elements may cause real parser scripts to skip sections or misread your history details.
                      </p>
                    </div>

                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {result.warnings?.map((w, idx) => (
                        <li key={idx} style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.75rem',
                          background: 'rgba(255, 255, 255, 0.01)',
                          border: '1px solid var(--border-subtle)',
                          padding: '1rem',
                          borderRadius: 'var(--radius-md)'
                        }}>
                          <span style={{ fontSize: '1rem', color: '#ef4444', marginTop: '-0.1rem' }}>🚫</span>
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            {w}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tab Content 2: Key Strengths */}
                {activeTab === 'strengths' && (
                  <div className="flex-col gap-4 animate-fade-in">
                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {(result.aiFeedback?.strengths || result.strengths)?.map((s, idx) => (
                        <li key={idx} style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.75rem',
                          background: 'rgba(16, 185, 129, 0.02)',
                          border: '1px solid rgba(16, 185, 129, 0.1)',
                          padding: '1rem',
                          borderRadius: 'var(--radius-md)'
                        }}>
                          <CheckCircle size={16} color="var(--accent-tertiary)" style={{ marginTop: '0.15rem', flexShrink: 0 }} />
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            {s}
                          </span>
                        </li>
                      ))}
                      {(!(result.aiFeedback?.strengths || result.strengths) || (result.aiFeedback?.strengths || result.strengths).length === 0) && (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', marginTop: '2rem' }}>
                          No explicit layout strengths identified. Fix parser warning flags to reveal strengths.
                        </p>
                      )}
                    </ul>
                  </div>
                )}

                {/* Tab Content 3: Rewrite Checklist */}
                {activeTab === 'suggestions' && (
                  <div className="flex-col gap-4 animate-fade-in">
                    {result.aiFeedback ? (
                      <div className="flex-col gap-6">
                        {/* AI Weaknesses */}
                        {result.aiFeedback.weaknesses?.length > 0 && (
                          <div className="flex-col gap-2">
                            <h5 style={{ fontSize: '0.8rem', color: 'var(--accent-secondary)', fontWeight: 600, textTransform: 'uppercase', margin: 0, letterSpacing: '0.05em' }}>Identified Gaps</h5>
                            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {result.aiFeedback.weaknesses.map((w, idx) => (
                                <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.02)', border: '1px solid rgba(239, 68, 68, 0.08)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                                  <AlertCircle size={14} color="#ef4444" style={{ marginTop: '0.15rem', flexShrink: 0 }} />
                                  <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{w}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* AI Suggestions */}
                        {result.aiFeedback.suggestions?.length > 0 && (
                          <div className="flex-col gap-2">
                            <h5 style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 600, textTransform: 'uppercase', margin: 0, letterSpacing: '0.05em' }}>ATS Suggestions</h5>
                            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {result.aiFeedback.suggestions.map((s, idx) => (
                                <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                                  <ChevronRight size={14} color="var(--accent-primary)" style={{ marginTop: '0.15rem', flexShrink: 0 }} />
                                  <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{s}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* AI Improvement Plan */}
                        {result.aiFeedback.improvementPlan?.length > 0 && (
                          <div className="flex-col gap-2">
                            <h5 style={{ fontSize: '0.8rem', color: 'var(--accent-tertiary)', fontWeight: 600, textTransform: 'uppercase', margin: 0, letterSpacing: '0.05em' }}>Action Plan</h5>
                            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {result.aiFeedback.improvementPlan.map((p, idx) => (
                                <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.02)', border: '1px solid rgba(16, 185, 129, 0.08)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                                  <CheckCircle size={14} color="var(--accent-tertiary)" style={{ marginTop: '0.15rem', flexShrink: 0 }} />
                                  <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {(result.suggestions || result.improvements)?.map((item, idx) => (
                          <li key={idx} style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.75rem',
                            background: 'rgba(255, 255, 255, 0.01)',
                            border: '1px solid var(--border-subtle)',
                            padding: '1rem',
                            borderRadius: 'var(--radius-md)'
                          }}>
                            <ChevronRight size={16} color="var(--accent-primary)" style={{ marginTop: '0.15rem', flexShrink: 0 }} />
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Tab Content 5: AI Coach Roadmap */}
                {activeTab === 'roadmap' && result.learningRoadmap && (
                  <div className="flex-col gap-6 animate-fade-in">
                    <div style={{
                      background: 'rgba(99, 102, 241, 0.05)',
                      border: '1px solid rgba(99, 102, 241, 0.15)',
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem'
                    }}>
                      <Sparkles size={18} color="var(--accent-primary)" style={{ marginTop: '0.15rem', flexShrink: 0 }} />
                      <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                        Personalized week-by-week learning roadmap designed by the AI career coach to close your skill gaps.
                      </p>
                    </div>

                    <div className="flex-col" style={{ gap: '1.5rem', position: 'relative', paddingLeft: '1.5rem', borderLeft: '2px dashed var(--border-subtle)', marginLeft: '0.5rem', paddingBottom: '0.5rem' }}>
                      {result.learningRoadmap.map((item, idx) => (
                        <div key={idx} style={{ position: 'relative' }}>
                          <span style={{
                            position: 'absolute',
                            left: '-1.95rem',
                            top: '0.2rem',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: 'var(--accent-primary)',
                            border: '3px solid var(--bg-surface)'
                          }} />
                          <h5 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 700, margin: '0 0 0.25rem 0' }}>
                            {item.week}
                          </h5>
                          <h6 style={{ fontSize: '0.825rem', color: 'var(--accent-secondary)', fontWeight: 600, margin: '0 0 0.5rem 0' }}>
                            {item.topic}
                          </h6>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                            {item.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab Content 6: JD Match Analysis */}
                {activeTab === 'jdmatch' && result.jdMatch && (
                  <div className="flex-col gap-6 animate-fade-in">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-subtle)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>JD Match Rate</span>
                        <h4 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0.15rem 0 0 0', color: result.jdMatch.matchPercentage >= 70 ? 'var(--accent-tertiary)' : 'var(--accent-secondary)' }}>
                          {result.jdMatch.matchPercentage}%
                        </h4>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'right', maxWidth: '180px', lineHeight: 1.4 }}>
                        {result.jdMatch.matchPercentage >= 70 
                          ? 'Strong profile alignment with this job description!' 
                          : 'Moderate alignment. Try targeting missing keywords below.'}
                      </div>
                    </div>

                    {/* Missing Keywords */}
                    {result.jdMatch.missingKeywords?.length > 0 && (
                      <div className="flex-col gap-2">
                        <h5 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Missing Keywords</h5>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {result.jdMatch.missingKeywords.map(kw => (
                            <span key={kw} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.15)', padding: '0.25rem 0.65rem', borderRadius: '0.5rem', fontSize: '0.775rem', fontWeight: 600 }}>
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommended Improvements */}
                    {result.jdMatch.recommendedImprovements?.length > 0 && (
                      <div className="flex-col gap-2">
                        <h5 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Target Recommendations</h5>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {result.jdMatch.recommendedImprovements.map((imp, idx) => (
                            <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                              <ChevronRight size={14} color="var(--accent-secondary)" style={{ marginTop: '0.15rem', flexShrink: 0 }} />
                              <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{imp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab Content 4: Selected Line Diagnostics */}
                {activeTab === 'diagnostics' && selectedLine && (
                  <div className="flex-col gap-6 animate-fade-in">
                    <div className="flex-col gap-2">
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>AUDITED TEXT</span>
                      <div style={{
                        background: '#04040c',
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        fontFamily: 'Consolas, Monaco, monospace',
                        fontSize: '0.775rem',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-secondary)',
                        wordBreak: 'break-word',
                        lineHeight: 1.5
                      }}>
                        "{selectedLine.text}"
                      </div>
                    </div>

                    <div className="flex-col gap-3">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          display: 'inline-block',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: selectedLine.status === 'strength' ? '#22c55e' : selectedLine.status === 'weakness' ? '#f59e0b' : '#ef4444'
                        }} />
                        <strong style={{
                          color: selectedLine.status === 'strength' ? '#22c55e' : selectedLine.status === 'weakness' ? '#f59e0b' : '#ef4444',
                          textTransform: 'uppercase',
                          fontSize: '0.8rem',
                          letterSpacing: '0.05em'
                        }}>
                          {selectedLine.status === 'strength' ? 'Positive Impact' : selectedLine.status === 'weakness' ? 'Grammar Choice Alert' : 'Critical Parser Flag'}
                        </strong>
                      </div>
                      
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)'
                      }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0, lineHeight: '1.6' }}>
                          {selectedLine.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Default prompt when diagnostics active but no line clicked */}
                {activeTab === 'diagnostics' && !selectedLine && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '4rem 1rem' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔍</div>
                    <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5' }}>
                      Click on any highlighted line on the left document canvas to run detailed rewrite suggestions.
                    </p>
                  </div>
                )}

              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
};

export default ResumeUpload;
