import React, { useEffect, useState } from 'react';
import { UploadCloud, CheckCircle, TrendingUp, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/authStore';

const Dashboard = () => {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const [data, setData] = useState({
    resumeScore: 0,
    atsScore: 0,
    placementReadiness: 0,
    interviewScore: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/user/dashboard', {
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
      <div>
        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Welcome back, <span className="text-gradient">{user?.name || 'Student'}</span></h2>
        <p className="text-muted">Here is your current placement readiness overview.</p>
      </div>
      
      <div className="flex gap-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
        <div className="glass-panel">
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontSize: '1.1rem' }}>Resume Score</h3>
            <UploadCloud color="var(--accent-primary)" />
          </div>
          <div className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{data.resumeScore}/100</div>
          <p className="text-muted mt-4" style={{ fontSize: '0.875rem' }}>+5% from last upload</p>
        </div>

        <div className="glass-panel">
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontSize: '1.1rem' }}>ATS Match</h3>
            <CheckCircle color="var(--accent-tertiary)" />
          </div>
          <div className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 'bold', backgroundImage: 'var(--gradient-glow)' }}>{data.atsScore}%</div>
          <p className="text-muted mt-4" style={{ fontSize: '0.875rem' }}>Needs improvement in keywords</p>
        </div>

        <div className="glass-panel">
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontSize: '1.1rem' }}>Placement Readiness</h3>
            <TrendingUp color="var(--accent-secondary)" />
          </div>
          <div className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{data.placementReadiness}%</div>
          <p className="text-muted mt-4" style={{ fontSize: '0.875rem' }}>Based on 3 mock interviews</p>
        </div>
      </div>
      
      <div className="flex gap-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        <div className="glass-panel flex-col justify-center items-center text-center">
          <UploadCloud size={48} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
          <h3 className="mb-4">Upload New Resume</h3>
          <p className="text-muted mb-8" style={{ fontSize: '0.875rem' }}>Get instant feedback on your resume using our AI analyzer.</p>
          <button className="btn btn-primary" onClick={() => navigate('/resume')}>Analyze Resume</button>
        </div>

        <div className="glass-panel flex-col justify-center items-center text-center">
          <BookOpen size={48} color="var(--accent-secondary)" style={{ marginBottom: '1rem' }} />
          <h3 className="mb-4">Mock Interview</h3>
          <p className="text-muted mb-8" style={{ fontSize: '0.875rem' }}>Practice with our AI simulator tailored to your target role.</p>
          <button className="btn btn-secondary" onClick={() => navigate('/interview')}>Start Interview</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
