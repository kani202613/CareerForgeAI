import React, { useState } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';

const ResumeUpload = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { token } = useAuthStore();

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
      alert('Failed to analyze resume');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-col gap-8">
      <h2 style={{ fontSize: '2rem' }}>Resume Analyzer</h2>
      
      <div className="glass-panel" style={{ maxWidth: '600px' }}>
        <div className="input-group mb-4">
          <label className="input-label">Upload Resume (PDF)</label>
          <input 
            type="file" 
            accept="application/pdf"
            onChange={e => setFile(e.target.files[0])}
            style={{ color: 'var(--text-secondary)' }}
          />
        </div>
        <button className="btn btn-primary w-full" onClick={handleUpload} disabled={loading || !file}>
          {loading ? 'Analyzing with AI...' : 'Analyze Resume'}
        </button>
      </div>

      {result && (
        <div className="glass-panel animate-fade-in flex-col gap-4 mt-8">
          <h3 style={{ fontSize: '1.5rem', color: 'var(--accent-tertiary)' }}>Analysis Results</h3>
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
          <div style={{ background: 'var(--bg-base)', padding: '1rem', borderRadius: 'var(--radius-md)', marginTop: '1rem' }}>
            <h4 style={{ marginBottom: '0.5rem', color: 'var(--accent-secondary)' }}>Feedback</h4>
            <p>{result.feedback}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeUpload;
