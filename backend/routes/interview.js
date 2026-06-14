const express = require('express');
const router = express.Router();
const InterviewResult = require('../models/InterviewResult');
const { authMiddleware } = require('./user');

// ─── Built-in question bank (no external AI needed) ───
const questionBank = {
  'Frontend Developer': [
    'What is the difference between let, const, and var in JavaScript?',
    'Explain the Virtual DOM in React and why it improves performance.',
    'How do you handle state management in a large React application?',
    'What are CSS Flexbox and Grid? When would you use each?',
    'Explain event delegation in JavaScript.',
    'What is the difference between server-side rendering and client-side rendering?',
    'How do you optimize the performance of a web application?',
    'What are Web Accessibility (a11y) best practices you follow?',
    'Explain the concept of closures in JavaScript with an example.',
    'How do you handle cross-browser compatibility issues?'
  ],
  'Backend Developer': [
    'What is the difference between SQL and NoSQL databases? When would you use each?',
    'Explain RESTful API design principles.',
    'How do you handle authentication and authorization in a backend system?',
    'What is middleware in Express.js? Give an example.',
    'Explain the concept of database indexing and its impact on performance.',
    'How would you design a rate limiter for an API?',
    'What are microservices? How do they differ from monolithic architecture?',
    'Explain the difference between horizontal and vertical scaling.',
    'How do you handle error handling and logging in a production Node.js app?',
    'What is caching and how would you implement it in a backend system?'
  ],
  'Full Stack Developer': [
    'Walk me through how a request flows from a browser to the database and back.',
    'How do you decide what logic goes on the frontend vs backend?',
    'Explain how JWT authentication works end-to-end.',
    'What tools do you use for CI/CD and why?',
    'How do you handle environment variables across development and production?',
    'Describe a challenging bug you fixed that involved both frontend and backend.',
    'How would you design a real-time notification system?',
    'What is your approach to database schema design?',
    'How do you ensure security in a full stack application?',
    'What testing strategies do you use across the stack?'
  ],
  'Data Scientist': [
    'Explain the bias-variance tradeoff.',
    'What is the difference between supervised and unsupervised learning?',
    'How do you handle missing data in a dataset?',
    'Explain cross-validation and why it is important.',
    'What evaluation metrics would you use for a classification problem?',
    'How do you handle imbalanced datasets?',
    'Explain the difference between bagging and boosting.',
    'What is feature engineering and why is it important?',
    'How would you deploy a machine learning model into production?',
    'Explain the difference between precision and recall.'
  ],
  'default': [
    'Tell me about yourself and your background.',
    'What are your greatest technical strengths?',
    'Describe a challenging project you worked on recently.',
    'How do you stay up to date with the latest technology trends?',
    'Tell me about a time you had to learn a new technology quickly.',
    'How do you approach debugging a complex problem?',
    'Describe your experience working in a team.',
    'What is your approach to writing clean and maintainable code?',
    'How do you prioritize tasks when working on multiple projects?',
    'Where do you see yourself in 5 years?'
  ]
};

function getQuestions(role) {
  return questionBank[role] || questionBank['default'];
}

// ─── Recruiter-mode follow-ups ───
const recruiterFollowUps = [
  'Can you quantify the impact of that work? Give me specific numbers.',
  'What trade-offs did you consider and why did you choose that approach?',
  'Walk me through the exact technical architecture you used.',
  'What would you do differently if you had to do it again?',
  'How did you handle edge cases and failure scenarios?',
  'That sounds surface-level. Can you go deeper into the implementation details?',
  'How did you measure success for that project?',
  'What was the most difficult technical decision you made and why?'
];

// Start an interview session or get next question
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { role, history, newMessage, recruiterMode } = req.body;
    const messages = [...history];

    if (newMessage) {
      messages.push({ role: 'user', content: newMessage });
    }

    // Determine which question to ask next
    const questions = getQuestions(role);
    
    // Find already asked standard questions from history
    const askedQuestions = messages
      .filter(m => m.role === 'assistant')
      .map(m => m.content);

    // Filter questions that are present in the question bank but haven't been asked yet
    const remainingQuestions = questions.filter(q => !askedQuestions.includes(q));
    const standardAskedCount = questions.filter(q => askedQuestions.includes(q)).length;
    
    const assistantCount = messages.filter(m => m.role === 'assistant').length;

    let aiResponse;

    if (standardAskedCount >= questions.length) {
      // All questions from bank asked
      aiResponse = 'Great, that concludes our interview! Click "End Interview" to see your evaluation and score.';
    } else if (recruiterMode && assistantCount > 0 && assistantCount % 2 === 1) {
      // In recruiter mode, every other response is a tough follow-up
      const idx = Math.floor(Math.random() * recruiterFollowUps.length);
      aiResponse = recruiterFollowUps[idx];
    } else {
      // Ask a random unasked question from the bank
      if (remainingQuestions.length > 0) {
        const idx = Math.floor(Math.random() * remainingQuestions.length);
        aiResponse = remainingQuestions[idx];
      } else {
        aiResponse = 'Great, that concludes our interview! Click "End Interview" to see your evaluation and score.';
      }
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

    // Simple scoring based on answer length, detail, and keyword presence
    const userMessages = history.filter(m => m.role === 'user');
    let totalScore = 0;
    let totalWords = 0;
    let totalFillerWords = 0;
    
    // List of common verbal filler words
    const fillerWordsList = ['like', 'basically', 'actually', 'um', 'uh', 'so', 'literally', 'you know'];

    userMessages.forEach(msg => {
      const text = msg.content.toLowerCase();
      const words = text.split(/\s+/).filter(Boolean);
      totalWords += words.length;
      
      // Count filler words
      words.forEach(w => {
        const cleanWord = w.replace(/[^a-z]/g, '');
        if (fillerWordsList.includes(cleanWord)) {
          totalFillerWords++;
        }
      });

      let msgScore = 0;

      // Length score (longer = more detailed, up to 40 pts)
      msgScore += Math.min(40, Math.round((words.length / 50) * 40));

      // Technical depth (keywords present, up to 30 pts)
      const techTerms = ['api', 'database', 'server', 'frontend', 'backend', 'react', 'node', 'component', 'algorithm', 'performance', 'security', 'testing', 'deploy', 'architecture', 'cache', 'async', 'promise', 'state', 'query', 'index'];
      const techCount = techTerms.filter(t => text.includes(t)).length;
      msgScore += Math.min(30, techCount * 6);

      // Clarity — has examples or numbers (up to 30 pts)
      const hasExample = /for example|such as|like|instance|e\.g\./i.test(text);
      const hasNumbers = /\d+/.test(text);
      if (hasExample) msgScore += 15;
      if (hasNumbers) msgScore += 15;

      totalScore += Math.min(100, msgScore);
    });

    const avgScore = userMessages.length > 0 ? Math.round(totalScore / userMessages.length) : 0;
    const finalScore = Math.min(100, avgScore);

    // Calculate communication stats
    const averageWordCount = userMessages.length > 0 ? Math.round(totalWords / userMessages.length) : 0;
    const fillerDensity = totalFillerWords / (totalWords || 1);
    
    let clarityGrade = 'A';
    if (fillerDensity > 0.08 || averageWordCount < 15) {
      clarityGrade = 'D';
    } else if (fillerDensity > 0.05 || averageWordCount < 30) {
      clarityGrade = 'C';
    } else if (fillerDensity > 0.02 || averageWordCount < 50) {
      clarityGrade = 'B';
    }

    // Generate feedback
    let feedback;
    if (finalScore >= 80) {
      feedback = 'Excellent performance! Your answers were detailed, technically sound, and well-structured. You demonstrated strong knowledge and communication skills.';
    } else if (finalScore >= 60) {
      feedback = 'Good performance overall. You showed solid understanding but could improve by providing more specific examples, quantifiable results, and deeper technical details.';
    } else if (finalScore >= 40) {
      feedback = 'Average performance. Try to elaborate more on your answers with concrete examples, mention specific technologies, and explain your thought process in greater detail.';
    } else {
      feedback = 'Needs improvement. Focus on providing longer, more detailed answers. Use specific examples from your experience, mention technologies by name, and quantify your achievements wherever possible.';
    }

    const newInterview = new InterviewResult({
      userId: req.user.userId,
      role: role,
      score: finalScore,
      feedback: feedback,
      transcript: history,
      fillerWordsCount: totalFillerWords,
      averageWordCount: averageWordCount,
      clarityGrade: clarityGrade
    });

    await newInterview.save();
    res.json({ 
      message: 'Interview completed', 
      result: { 
        score: finalScore, 
        feedback,
        fillerWordsCount: totalFillerWords,
        averageWordCount,
        clarityGrade
      } 
    });

  } catch (error) {
    console.error('Interview End Error:', error);
    res.status(500).json({ message: 'Failed to end interview' });
  }
});

module.exports = router;
