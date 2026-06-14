const express = require('express');
const router = express.Router();
const InterviewResult = require('../models/InterviewResult');
const { authMiddleware } = require('./user');

// ─── Built-in question bank with required keywords for validation ───
const questionBank = {
  'Frontend Developer': [
    {
      question: 'What is the difference between let, const, and var in JavaScript?',
      keywords: ['scope', 'hoist', 'reassign', 'var', 'let', 'const', 'block'],
      hint: 'scope, hoisting, or block level reassignability'
    },
    {
      question: 'Explain the Virtual DOM in React and why it improves performance.',
      keywords: ['virtual dom', 'diff', 'reconciliation', 'render', 'dom', 'update'],
      hint: 'the reconciliation process or DOM diffing'
    },
    {
      question: 'How do you handle state management in a large React application?',
      keywords: ['redux', 'context', 'state', 'usestate', 'props', 'store', 'reducer'],
      hint: 'state management tools like Redux, Context API, or hooks'
    },
    {
      question: 'What are CSS Flexbox and Grid? When would you use each?',
      keywords: ['flex', 'grid', 'layout', 'axis', 'dimension', 'align', 'column'],
      hint: 'flexbox axes, grid layout systems, or dimensions'
    },
    {
      question: 'Explain event delegation in JavaScript.',
      keywords: ['event', 'bubble', 'listener', 'parent', 'target', 'propagation'],
      hint: 'event bubbling and target listeners'
    }
  ],
  'Backend Developer': [
    {
      question: 'What is the difference between SQL and NoSQL databases? When would you use each?',
      keywords: ['sql', 'nosql', 'relational', 'schema', 'document', 'table', 'scaling'],
      hint: 'schemas, tables, or relational scaling'
    },
    {
      question: 'Explain RESTful API design principles.',
      keywords: ['rest', 'api', 'http', 'endpoint', 'stateless', 'method', 'get', 'post'],
      hint: 'stateless communication or standard HTTP methods'
    },
    {
      question: 'How do you handle authentication and authorization in a backend system?',
      keywords: ['auth', 'jwt', 'token', 'session', 'permission', 'role', 'hash', 'bcrypt'],
      hint: 'JWT tokens, session storage, or hashing'
    },
    {
      question: 'What is middleware in Express.js? Give an example.',
      keywords: ['middleware', 'express', 'request', 'response', 'next', 'function'],
      hint: 'request-response lifecycle functions or the next() call'
    },
    {
      question: 'Explain the concept of database indexing and its impact on performance.',
      keywords: ['index', 'query', 'search', 'performance', 'slow', 'b-tree', 'scan'],
      hint: 'query performance, scans, or B-Trees'
    }
  ],
  'Full Stack Developer': [
    {
      question: 'Walk me through how a request flows from a browser to the database and back.',
      keywords: ['request', 'browser', 'server', 'database', 'dns', 'http', 'api', 'response'],
      hint: 'DNS resolution, HTTP requests, or DB queries'
    },
    {
      question: 'How do you decide what logic goes on the frontend vs backend?',
      keywords: ['client', 'server', 'security', 'validation', 'database', 'render'],
      hint: 'security concerns, client rendering, or data validation'
    },
    {
      question: 'Explain how JWT authentication works end-to-end.',
      keywords: ['jwt', 'token', 'signature', 'header', 'payload', 'secret', 'verify'],
      hint: 'payload verification, signatures, or token headers'
    },
    {
      question: 'What tools do you use for CI/CD and why?',
      keywords: ['git', 'jenkins', 'github', 'actions', 'pipeline', 'deploy', 'docker'],
      hint: 'pipelines, GitHub Actions, Docker, or deployments'
    },
    {
      question: 'How do you handle environment variables across development and production?',
      keywords: ['env', 'process.env', 'config', 'secret', 'production', 'variables'],
      hint: '.env configs, production secrets, or environment variables'
    }
  ],
  'Data Scientist': [
    {
      question: 'Explain the bias-variance tradeoff.',
      keywords: ['bias', 'variance', 'overfit', 'underfit', 'tradeoff', 'error'],
      hint: 'model overfitting, underfitting, or prediction errors'
    },
    {
      question: 'What is the difference between supervised and unsupervised learning?',
      keywords: ['label', 'supervised', 'unsupervised', 'cluster', 'classify', 'train'],
      hint: 'labeled datasets, clustering, or classifications'
    },
    {
      question: 'How do you handle missing data in a dataset?',
      keywords: ['missing', 'impute', 'mean', 'median', 'drop', 'null', 'nan'],
      hint: 'data imputation (mean/median) or dropping Null fields'
    },
    {
      question: 'Explain cross-validation and why it is important.',
      keywords: ['cross', 'validation', 'fold', 'overfit', 'train', 'test', 'split'],
      hint: 'K-folds split, training validation, or overfitting prevention'
    }
  ],
  'default': [
    {
      question: 'Tell me about yourself and your background.',
      keywords: ['experience', 'projects', 'skills', 'developer', 'career', 'study', 'interest'],
      hint: 'your programming projects, studies, or career history'
    },
    {
      question: 'What are your greatest technical strengths?',
      keywords: ['strength', 'programming', 'languages', 'solve', 'skills', 'architecture'],
      hint: 'problem solving, languages, or software design strengths'
    },
    {
      question: 'Describe a challenging project you worked on recently.',
      keywords: ['project', 'challenge', 'built', 'solved', 'architecture', 'problem'],
      hint: 'engineering difficulties, features built, or solutions found'
    },
    {
      question: 'How do you stay up to date with the latest technology trends?',
      keywords: ['learn', 'blog', 'news', 'article', 'tech', 'follow', 'github', 'reading'],
      hint: 'articles, blogs, GitHub, or documentation resources'
    }
  ]
};

function getQuestions(role) {
  return questionBank[role] || questionBank['default'];
}

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

    const questions = getQuestions(role);
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    const askedQuestionsText = assistantMessages.map(m => m.content);

    let aiResponse = null;
    let isFollowUpPrompt = false;

    // --- ANSWER VALIDATION LOGIC ---
    if (newMessage && assistantMessages.length > 0) {
      const lastQText = assistantMessages[assistantMessages.length - 1].content;
      
      // Determine if the last question was an elaboration prompt
      const wasElaborationRequest = lastQText.includes("I notice you didn't quite cover") || lastQText.includes("Could you elaborate");

      // Find which standard question in the bank corresponds to this discussion
      const matchedQuestionObj = questions.find(q => 
        q.question === lastQText || 
        (wasElaborationRequest && lastQText.includes(q.keywords[0]))
      );

      // If we found the question, and we haven't already asked them to elaborate on it
      if (matchedQuestionObj && !wasElaborationRequest) {
        const textLower = newMessage.toLowerCase();
        const words = textLower.split(/\s+/).filter(Boolean);

        // Escape and match keywords safely
        const matchedKeywords = matchedQuestionObj.keywords.filter(k => {
          const escaped = k.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          const regex = new RegExp(`(?<![a-zA-Z0-9])${escaped}(?![a-zA-Z0-9])`, 'i');
          return regex.test(textLower);
        });

        // Trigger follow-up if answer is empty, too short, or lacks required keywords
        if (matchedKeywords.length === 0 || words.length < 5) {
          isFollowUpPrompt = true;
          aiResponse = `I notice you didn't quite cover key concepts (like ${matchedQuestionObj.hint}) in your response. Could you elaborate on this for the ${role} position?`;
        }
      }
    }

    // If it isn't a follow-up request, fetch the next question from the bank
    if (!aiResponse) {
      const assistantCount = assistantMessages.length;

      if (assistantCount === 0) {
        // Welcome introduction
        aiResponse = `Hello! Welcome to your mock interview for the ${role} position. I will be conducting your technical assessment today. To start us off, could you please introduce yourself and walk me through your background and technical experience?`;
      } else {
        // Find standard questions that haven't been asked yet
        const remainingQuestions = questions.filter(q => 
          !askedQuestionsText.some(asked => asked.includes(q.question))
        );

        const standardAskedCount = questions.filter(q => 
          askedQuestionsText.some(asked => asked.includes(q.question))
        ).length;

        if (standardAskedCount >= questions.length) {
          aiResponse = 'Great, that concludes our interview! Click "Disconnect Call" or "End & Score" to see your evaluation and score.';
        } else if (recruiterMode && assistantCount > 0 && assistantCount % 2 === 1) {
          // In recruiter mode, every other question is a tough follow-up
          const idx = Math.floor(Math.random() * recruiterFollowUps.length);
          aiResponse = recruiterFollowUps[idx];
        } else {
          if (remainingQuestions.length > 0) {
            const idx = Math.floor(Math.random() * remainingQuestions.length);
            const nextQuestion = remainingQuestions[idx].question;
            
            if (assistantCount === 1) {
              // Transition from introduction to technical question
              aiResponse = `Thank you for sharing that. Let's transition into the technical assessment. To begin, ${nextQuestion}`;
            } else {
              aiResponse = nextQuestion;
            }
          } else {
            aiResponse = 'Great, that concludes our interview! Click "Disconnect Call" or "End & Score" to see your evaluation and score.';
          }
        }
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

    const userMessages = history.filter(m => m.role === 'user');
    let totalScore = 0;
    let totalWords = 0;
    let totalFillerWords = 0;
    
    const fillerWordsList = ['like', 'basically', 'actually', 'um', 'uh', 'so', 'literally', 'you know'];

    userMessages.forEach(msg => {
      const text = msg.content.toLowerCase();
      const words = text.split(/\s+/).filter(Boolean);
      totalWords += words.length;
      
      words.forEach(w => {
        const cleanWord = w.replace(/[^a-z]/g, '');
        if (fillerWordsList.includes(cleanWord)) {
          totalFillerWords++;
        }
      });

      let msgScore = 0;

      // Length score (up to 40 pts)
      msgScore += Math.min(40, Math.round((words.length / 50) * 40));

      // Technical depth (up to 30 pts)
      const techTerms = ['api', 'database', 'server', 'frontend', 'backend', 'react', 'node', 'component', 'algorithm', 'performance', 'security', 'testing', 'deploy', 'architecture', 'cache', 'async', 'promise', 'state', 'query', 'index'];
      const techCount = techTerms.filter(t => text.includes(t)).length;
      msgScore += Math.min(30, techCount * 6);

      // Clarity (up to 30 pts)
      const hasExample = /for example|such as|like|instance|e\.g\./i.test(text);
      const hasNumbers = /\d+/.test(text);
      if (hasExample) msgScore += 15;
      if (hasNumbers) msgScore += 15;

      totalScore += Math.min(100, msgScore);
    });

    const avgScore = userMessages.length > 0 ? Math.round(totalScore / userMessages.length) : 0;
    const finalScore = Math.min(100, avgScore);

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
