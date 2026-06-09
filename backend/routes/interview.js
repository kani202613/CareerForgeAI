const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');
const InterviewResult = require('../models/InterviewResult');
const { authMiddleware } = require('./user');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Start an interview session or get next question
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { role, history, newMessage, recruiterMode } = req.body;
    
    const messages = [...history];
    if (newMessage) {
      messages.push({ role: 'user', content: newMessage });
    }

    let systemPrompt = `You are an expert technical interviewer conducting a mock interview for the role of ${role}. 
    Ask one question at a time. Do not provide the answer. Evaluate the user's previous answer briefly before asking the next question.`;

    if (recruiterMode) {
      systemPrompt = `You are a highly critical, strict technical recruiter for top tier companies. 
      You are interviewing a candidate for the role of ${role}. 
      You will grill them on measurable impact, deployment details, deep technical decisions, and edge cases. 
      Do not be overly polite. Push for deep details. Ask one question at a time.`;
    }

    const openAiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: openAiMessages,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0].message.content;
    
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
    Evaluate the candidate and provide a JSON response exactly in this format:
    {
      "score": (number out of 100 representing overall performance),
      "feedback": "Detailed feedback on their performance, communication, and technical depth."
    }
    
    Transcript:
    ${JSON.stringify(history)}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content);

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
