const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const Resume = require('../models/Resume');
const { authMiddleware } = require('./user');

// Memory storage for uploaded PDF
const upload = multer({ storage: multer.memoryStorage() });

// ----- ATS‑style free analysis (no external AI) -----
function atsAnalyze(text) {
  // Word count based resume score (0‑100)
  const words = text.split(/\s+/).filter(Boolean);
  const wordScore = Math.min(100, Math.round((words.length / 500) * 100));

  // Detect common resume sections
  const sections = ['education', 'experience', 'skills', 'projects', 'summary', 'certifications'];
  let sectionsFound = 0;
  const lower = text.toLowerCase();
  sections.forEach(sec => { if (lower.includes(sec)) sectionsFound++; });
  const sectionScore = Math.min(100, sectionsFound * 20); // each section up to 20 pts

  // Keyword extraction – tech and soft‑skill keywords
  const techKeywords = ['javascript', 'node', 'react', 'express', 'mongodb', 'api', 'frontend', 'backend', 'full stack', 'aws', 'docker', 'git', 'typescript', 'sql', 'graphql', 'html', 'css'];
  const softKeywords = ['leadership', 'communication', 'team', 'problem solving', 'agile', 'scrum'];
  const techFound = techKeywords.filter(k => lower.includes(k));
  const softFound = softKeywords.filter(k => lower.includes(k));
  const keywordScore = Math.min(100, (techFound.length * 5) + (softFound.length * 2));

  // Readability (Flesch Reading Ease) – higher = easier to read
  const sentences = text.split(/[.!?]+/).filter(Boolean).length || 1;
  const syllableCount = (text.toLowerCase().match(/[aeiouy]{1,2}/g) || []).length;
  const asl = words.length / sentences; // avg sentence length
  const asw = syllableCount / words.length; // avg syllables per word
  const flesch = Math.max(0, Math.min(100, Math.round(206.835 - 1.015 * asl - 84.6 * asw)));

  // Combine scores into an overall ATS‑style score
  const atsScore = Math.round((sectionScore + keywordScore + flesch) / 3);

  // Build feedback
  const feedback = [];
  if (sectionsFound < 3) feedback.push('Add more standard sections (Education, Experience, Skills) to improve ATS parsing.');
  if (techFound.length < 5) feedback.push('Include more relevant technical keywords/skills.');
  if (flesch < 60) feedback.push('Improve readability – use shorter sentences and simpler wording.');
  if (feedback.length === 0) feedback.push('Your resume looks well‑structured for ATS parsing.');

  return {
    resumeScore: wordScore,
    atsScore,
    extractedSkills: techFound.concat(softFound),
    feedback: feedback.join(' ')
  };
}

router.post('/upload', authMiddleware, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const data = await pdfParse(req.file.buffer);
    const text = data.text;

    // Perform free ATS‑style analysis
    const analysis = atsAnalyze(text);

    const newResume = new Resume({
      userId: req.user.userId,
      resumeScore: analysis.resumeScore,
      atsScore: analysis.atsScore,
      extractedSkills: analysis.extractedSkills,
      feedback: analysis.feedback
    });

    await newResume.save();
    res.json({ message: 'Resume analyzed successfully (free ATS mode)', result: analysis });
  } catch (error) {
    console.error('Resume Analysis Error:', error);
    res.status(500).json({ message: 'Failed to analyze resume' });
  }
});

module.exports = router;
