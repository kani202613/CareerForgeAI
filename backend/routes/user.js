const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Resume = require('../models/Resume');
const InterviewResult = require('../models/InterviewResult');

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey_replace_me_in_prod');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const latestResume = await Resume.findOne({ userId }).sort({ createdAt: -1 });
    const resumes = await Resume.find({ userId }).sort({ createdAt: 1 });
    const interviews = await InterviewResult.find({ userId }).sort({ createdAt: 1 });
    
    let avgInterviewScore = 0;
    if (interviews.length > 0) {
      avgInterviewScore = interviews.reduce((acc, curr) => acc + curr.score, 0) / interviews.length;
    }

    const placementReadiness = Math.round(((latestResume?.resumeScore || 0) + avgInterviewScore) / 2) || 0;

    // Map historical logs for charts
    const resumeHistory = resumes.map(r => ({
      date: r.createdAt,
      score: r.atsScore,
      overall: r.resumeScore
    }));

    const interviewHistory = interviews.map(i => ({
      date: i.createdAt,
      overall: i.score,
      confidence: i.confidence || i.score, // fallback
      technicalAccuracy: i.technicalAccuracy || i.score, // fallback
      communication: i.communication || i.score // fallback
    }));

    res.json({
      resumeScore: latestResume?.resumeScore || 0,
      atsScore: latestResume?.atsScore || 0,
      interviewScore: Math.round(avgInterviewScore),
      placementReadiness,
      totalInterviews: interviews.length,
      resumeHistory,
      interviewHistory,
      missingSkills: latestResume?.aiFeedback?.missingSkills || latestResume?.extractedSkills?.slice(0, 4) || [],
      activeRoadmap: latestResume?.learningRoadmap || []
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
module.exports.authMiddleware = authMiddleware; // export for other routes
