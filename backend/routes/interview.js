const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const InterviewResult = require('../models/InterviewResult');
const { authMiddleware } = require('./user');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Start an interview session or get next question
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { role, history, newMessage, recruiterMode } = req.body;

    let systemPrompt = `You are an expert technical interviewer conducting a mock interview for the role of ${role}. 
    Ask one question at a time. Do not provide the answer. Evaluate the user's previous answer briefly before asking the next question.`;

    if (recruiterMode) {
      systemPrompt = `You are a highly critical, strict technical recruiter for top tier companies. 
      You are interviewing a candidate for the role of ${role}. 
      You will grill them on measurable impact, deployment details, deep technical decisions, and edge cases. 
      Do not be overly polite. Push for deep details. Ask one question at a time.`;
    }

    // Build conversation for Gemini
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: systemPrompt
    });

    // Build chat history in Gemini format
    const geminiHistory = history.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const chat = model.startChat({ history: geminiHistory });
    const result = await chat.sendMessage(newMessage || 'Start the interview with your first question.');
    const aiResponse = result.response.text();

    const messages = [...history];
    if (newMessage) {
      messages.push({ role: 'user', content: newMessage });
    }
    messages.push({ role: 'assistant', content: aiResponse });

    res.json({ messages });

  } catch (error) {
    console.error('Interview Error:', error);
    res.status(500).json({ message: 'Interview failed' });
  }
});

// End interview and get score
router.post('/end', authMiddleware, async (req, res) => {
  try {
    const { role, history } = req.body;

    const prompt = `Review the following interview transcript for the role of ${role}.
    Evaluate the candidate and provide a JSON response exactly in this format (no markdown, no extra text, just raw JSON):
    {
      "score": (number out of 100 representing overall performance),
      "feedback": "Detailed feedback on their performance, communication, and technical depth."
    }
    
    Transcript:
    ${JSON.stringify(history)}`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    // Strip markdown code fences if present
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    const aiResponse = JSON.parse(cleaned);

    const newInterview = new InterviewResult({
      userId: req.user.userId,
      role: role,
      score: aiResponse.score,
      feedback: aiResponse.feedback,
      transcript: history
    });

    await newInterview.save();

    res.json({ message: 'Interview completed', result: aiResponse });

  } catch (error) {
    console.error('Interview End Error:', error);
    res.status(500).json({ message: 'Failed to end interview' });
  }
});

module.exports = router;
