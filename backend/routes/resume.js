const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Resume = require('../models/Resume');
const { authMiddleware } = require('./user');

const upload = multer({ storage: multer.memoryStorage() });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/upload', authMiddleware, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const data = await pdfParse(req.file.buffer);
    const text = data.text;

    const prompt = `You are an expert ATS (Applicant Tracking System) and technical recruiter. 
    Analyze the following resume text and provide a JSON response exactly in this format (no markdown, no extra text, just raw JSON):
    {
      "resumeScore": (number out of 100 representing overall quality),
      "atsScore": (number out of 100 representing ATS parsability and keyword richness),
      "extractedSkills": ["skill1", "skill2"],
      "feedback": "Detailed feedback on how to improve the resume."
    }
    
    Resume Text:
    ${text.substring(0, 3000)}`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    // Strip markdown code fences if present
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    const aiResponse = JSON.parse(cleaned);

    const newResume = new Resume({
      userId: req.user.userId,
      resumeScore: aiResponse.resumeScore,
      atsScore: aiResponse.atsScore,
      extractedSkills: aiResponse.extractedSkills,
      feedback: aiResponse.feedback
    });

    await newResume.save();

    res.json({ message: 'Resume analyzed successfully', result: aiResponse });

  } catch (error) {
    console.error('Resume Analysis Error:', error);
    res.status(500).json({ message: 'Failed to analyze resume' });
  }
});

module.exports = router;
