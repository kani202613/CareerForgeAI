import React, { useState, useRef } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';

const ResumeUpload = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { token } = useAuthStore();
  const fileInputRef = useRef(null);
  const [selectedLine, setSelectedLine] = useState(null);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await axios.post(
        'https://careerforgeai-ucd7.onrender.com/api/resume/upload',
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(response.data.result);
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || 'Failed to analyze resume. Please try again.';
      alert(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-col gap-8">
      <h2 style={{ fontSize: '2rem' }}>Resume Analyzer</h2>
      
      <div className="glass-panel" style={{ maxWidth: '600px' }}>
        <div className="input-group mb-6">
          <label className="input-label mb-2">Upload Resume (PDF)</label>
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
              border: '2px dashed var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: 'rgba(255, 255, 255, 0.01)',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--accent-primary)';
              e.currentTarget.style.background = 'rgba(168, 85, 247, 0.03)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.01)';
            }}
          >
            <div style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '50%',
              background: 'rgba(168, 85, 247, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
              fontSize: '1.25rem'
            }}>
              📁
            </div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.15rem' }}>
                {file ? file.name : 'Select Resume PDF'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Click to browse files (PDF only)'}
              </div>
            </div>
          </div>
        </div>
        <button className="btn btn-primary w-full" onClick={handleUpload} disabled={loading || !file}>
          {loading ? 'Analyzing with AI...' : 'Analyze Resume'}
        </button>
      </div>

      {result && (
        <div className="glass-panel animate-fade-in flex-col gap-4 mt-8">
          <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--accent-tertiary)', margin: 0 }}>Analysis Results</h3>
            {result.candidateProfile && (
              <span style={{ 
                background: 'rgba(59, 130, 246, 0.1)', 
                color: '#3b82f6', 
                padding: '0.25rem 0.75rem', 
                borderRadius: '0.5rem', 
                fontSize: '0.875rem', 
                fontWeight: '600',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}>
                Target Profile: {result.candidateProfile}
              </span>
            )}
          </div>
          
          <div className="flex gap-8">
            <div>
              <div className="text-muted text-sm">Overall Score</div>
              <div className="text-gradient" style={{ fontSize: '2rem', fontWeight: 'bold' }}>{result.resumeScore}/100</div>
            </div>
            <div>
              <div className="text-muted text-sm">ATS Score</div>
              <div className="text-gradient" style={{ fontSize: '2rem', fontWeight: 'bold' }}>{result.atsScore}/100</div>
            </div>
          </div>

          {result.warnings && result.warnings.length > 0 && (
            <div 
              className="glass-panel" 
              style={{ 
                background: 'rgba(239, 68, 68, 0.05)', 
                borderLeft: '4px solid #ef4444', 
                padding: '1.25rem', 
                borderRadius: 'var(--radius-md)'
              }}
            >
              <h4 style={{ margin: '0 0 0.75rem 0', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🚫</span> Critical ATS Warnings
              </h4>
              <ul style={{ paddingLeft: '1.25rem', margin: 0, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {result.warnings.map((w, idx) => (
                  <li key={idx} style={{ lineHeight: '1.5' }}>{w}</li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <h4 style={{ marginBottom: '0.5rem' }}>Extracted Skills</h4>
            <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
              {result.extractedSkills?.map(skill => (
                <span key={skill} style={{ background: 'var(--bg-elevated)', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.875rem' }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Strengths Card */}
            {result.strengths && result.strengths.length > 0 && (
              <div 
                className="glass-panel" 
                style={{ 
                  background: 'rgba(16, 185, 129, 0.03)', 
                  borderLeft: '4px solid #10b981', 
                  padding: '1.25rem', 
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <h4 style={{ margin: '0 0 0.75rem 0', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>👍</span> Key Strengths
                </h4>
                <ul style={{ paddingLeft: '1.25rem', margin: 0, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {result.strengths.map((s, idx) => (
                    <li key={idx} style={{ lineHeight: '1.5' }}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Improvements Card */}
            {result.improvements && result.improvements.length > 0 && (
              <div 
                className="glass-panel" 
                style={{ 
                  background: 'rgba(245, 158, 11, 0.03)', 
                  borderLeft: '4px solid #f59e0b', 
                  padding: '1.25rem', 
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <h4 style={{ margin: '0 0 0.75rem 0', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>⚠️</span> Areas for Improvement
                </h4>
                <ul style={{ paddingLeft: '1.25rem', margin: 0, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {result.improvements.map((imp, idx) => (
                    <li key={idx} style={{ lineHeight: '1.5' }}>{imp}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions Card */}
            {result.suggestions && result.suggestions.length > 0 && (
              <div 
                className="glass-panel" 
                style={{ 
                  background: 'rgba(59, 130, 246, 0.03)', 
                  borderLeft: '4px solid #3b82f6', 
                  padding: '1.25rem', 
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <h4 style={{ margin: '0 0 0.75rem 0', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>💡</span> Suggestions to Boost Score
                </h4>
                <ul style={{ paddingLeft: '1.25rem', margin: 0, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {result.suggestions.map((sug, idx) => (
                    <li key={idx} style={{ lineHeight: '1.5' }}>{sug}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Interactive Heatmap & Diagnostics Side-by-Side */}
            {result.highlightedLines && result.highlightedLines.length > 0 && (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
                gap: '1.5rem', 
                marginTop: '1.5rem' 
              }}>
                {/* Heatmap */}
                <div className="glass-panel" style={{ padding: '1.25rem', background: 'var(--bg-surface)' }}>
                  <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--accent-primary)', fontSize: '1.1rem' }}>Interactive ATS Heatmap</h4>
                  <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>Click on any highlighted line below to run ATS code diagnostics.</p>
                  
                  <div style={{ 
                    maxHeight: '400px', 
                    overflowY: 'auto', 
                    padding: '1rem', 
                    background: '#04040c', 
                    borderRadius: 'var(--radius-md)', 
                    fontFamily: 'Consolas, Monaco, monospace', 
                    fontSize: '0.8rem', 
                    lineHeight: '1.6', 
                    whiteSpace: 'pre-wrap',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    {result.highlightedLines.map((line, idx) => {
                      let bgColor = 'transparent';
                      let borderColor = 'transparent';
                      let cursor = 'default';
                      
                      if (line.status === 'strength') { bgColor = 'rgba(34, 197, 94, 0.05)'; borderColor = '#22c55e'; cursor = 'pointer'; }
                      if (line.status === 'weakness') { bgColor = 'rgba(245, 158, 11, 0.05)'; borderColor = '#f59e0b'; cursor = 'pointer'; }
                      if (line.status === 'warning') { bgColor = 'rgba(239, 68, 68, 0.05)'; borderColor = '#ef4444'; cursor = 'pointer'; }
                      if (line.status === 'header') { bgColor = 'rgba(255, 255, 255, 0.02)'; borderColor = 'rgba(255, 255, 255, 0.1)'; }

                      const isSelected = selectedLine && selectedLine.text === line.text;

                      return (
                        <div 
                          key={idx}
                          onClick={() => line.reason ? setSelectedLine(line) : null}
                          style={{
                            background: isSelected ? 'rgba(168, 85, 247, 0.12)' : bgColor,
                            borderLeft: isSelected ? '3px solid var(--accent-primary)' : `3px solid ${borderColor}`,
                            padding: '0.2rem 0.5rem',
                            marginBottom: '2px',
                            borderRadius: '0 4px 4px 0',
                            cursor: cursor,
                            transition: 'background 0.2s ease, border-left 0.2s ease',
                            fontWeight: line.status === 'header' ? 'bold' : 'normal',
                            color: line.status === 'header' ? 'var(--text-primary)' : 'var(--text-secondary)'
                          }}
                        >
                          {line.text || ' '}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Diagnostics Panel */}
                <div className="glass-panel flex-col" style={{ padding: '1.25rem', justifyContent: 'center', minHeight: '300px' }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: 'var(--accent-secondary)', fontSize: '1.1rem' }}>ATS Line Diagnostics</h4>
                  {selectedLine ? (
                    <div className="flex-col gap-4 animate-fade-in" style={{ height: '100%', justifyContent: 'space-between' }}>
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        fontFamily: 'Consolas, Monaco, monospace',
                        fontSize: '0.8rem',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-secondary)',
                        wordBreak: 'break-word'
                      }}>
                        "{selectedLine.text}"
                      </div>
                      <div className="flex-col gap-2">
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
                            fontSize: '0.85rem',
                            letterSpacing: '0.05em'
                          }}>
                            {selectedLine.status === 'strength' ? 'Positive Impact' : selectedLine.status === 'weakness' ? 'Grammar / Word Choice Alert' : 'Critical Parser Flag'}
                          </strong>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, lineHeight: '1.6' }}>
                          {selectedLine.reason}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 1rem' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔍</div>
                      <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5' }}>Select any highlighted line on the left tool to run code rewrite advice.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Fallback general feedback (if old data or strings) */}
            {(!result.strengths || result.strengths.length === 0) && result.feedback && (
              <div style={{ background: 'var(--bg-base)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ marginBottom: '0.5rem', color: 'var(--accent-secondary)' }}>Feedback Summary</h4>
                <p style={{ margin: 0, lineHeight: '1.5' }}>{result.feedback}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeUpload;
