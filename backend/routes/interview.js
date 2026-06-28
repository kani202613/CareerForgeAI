const express = require('express');
const router = express.Router();
const InterviewResult = require('../models/InterviewResult');
const { authMiddleware } = require('./user');
const ai = require('../utils/ai');

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

// Helper to check if a single word is gibberish
function isWordGibberish(w) {
  // Strip punctuation and special characters, keep only letters
  const cleanW = w.toLowerCase().replace(/[^a-z]/gi, '');
  
  // If the word had no letters (e.g. "3", "100", "+", etc.), it is not text gibberish
  if (cleanW.length === 0) return false;
  
  const len = cleanW.length;
  
  const allowedShortWords = [
    'a', 'an', 'the', 'is', 'am', 'are', 'in', 'on', 'at', 'to', 'for', 'by', 'of', 'and', 'but', 'or', 'so', 'if', 
    'we', 'i', 'you', 'he', 'she', 'it', 'go', 'do', 'no', 'not', 'var', 'let', 'sql', 'git', 'api', 'id', 'db', 'ok', 
    'yes', 'hi', 'hello', 'npm', 'dom', 'css', 'xml', 'csv', 'aws', 'jwt', 'url', 'uri', 'cli', 'ssh', 'ssl', 'tls', 'dns'
  ];
  if (allowedShortWords.includes(cleanW)) return false;

  // 1-4 letters with no vowels (excluding 'y')
  if (len <= 4 && !/[aeiouy]/i.test(cleanW)) return true;

  // Longer than 4 letters with no vowels at all (e.g. "klhgvhb")
  if (len > 4 && !/[aeiouy]/i.test(cleanW)) return true;

  // High consonant repetition: 5 or more consonants in a row (e.g. "ghvbh", "jjklk")
  if (/[bcdfghjklmnpqrstvwxz]{5,}/i.test(cleanW)) return true;

  // Common keyboard sequences
  const keyboardSequences = ['asdf', 'sdfg', 'dfgh', 'fghj', 'ghjk', 'hjkl', 'qwer', 'wert', 'erty', 'rtyu', 'tyui', 'yuio', 'uiop', 'zxcv', 'xcvb', 'cvbn', 'vbnm'];
  if (keyboardSequences.some(seq => cleanW.includes(seq))) return true;

  return false;
}

// Helper to detect if a message is uncooperative, spam, or gibberish
function isUncooperative(messageText, isIntroduction = false) {
  if (!messageText) return true;
  const textLower = messageText.trim().toLowerCase();
  
  if (textLower.startsWith('[system:')) {
    return true;
  }
  
  // 1. Explicit disinterest or refusal phrases
  const uncooperativePhrases = [
    'not interested', 'no interest', 'dont care', "don't care",
    'blah blah', 'blahblah', 'blah', 'no idea', 'dont know', "don't know",
    'i pass', 'skip', 'exit', 'stop', 'quit', 'nonsense', 'whatever',
    'acting foolish', 'foolish', 'stupid', 'garbage', 'idiot', 'useless',
    'i don\'t know', 'i dont know', 'no idea', 'dont care'
  ];
  
  const hasUncooperativePhrase = uncooperativePhrases.some(phrase => textLower.includes(phrase));
  if (hasUncooperativePhrase) return true;

  // 2. Gibberish patterns: keyboard bashes, repetitive single letters
  const words = textLower.split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;

  const hasGibberishWord = words.some(isWordGibberish);
  if (hasGibberishWord) return true;

  // Repetitive words (e.g. "test test test test")
  const uniqueWords = new Set(words);
  if (words.length >= 3 && uniqueWords.size === 1) return true;

  // Very short response under 3 words - only check if it is NOT the welcome step
  if (!isIntroduction && words.length < 3) {
    return true;
  }

  return false;
}

// Start an interview session or get next question
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { role, history, newMessage, recruiterMode } = req.body;
    const messages = [...history];

    // Check if session has already been terminated (case-insensitive check)
    if (history.length > 0) {
      const lastAssistantMsg = history[history.length - 1];
      if (lastAssistantMsg && lastAssistantMsg.role === 'assistant' && lastAssistantMsg.content.toLowerCase().includes("this interview session has been terminated")) {
        return res.json({ 
          messages: [
            ...history,
            { role: 'assistant', content: "This interview session has been terminated. Please click 'End & Score' to see your evaluation." }
          ] 
        });
      }
    }

    if (newMessage) {
      messages.push({ role: 'user', content: newMessage });
    }

    const questions = getQuestions(role);
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    const askedQuestionsText = assistantMessages.map(m => m.content);

    const standardAskedCount = questions.filter(q => 
      askedQuestionsText.some(asked => asked.includes(q.question))
    ).length;

    const isIntro = (standardAskedCount === 0);

    let aiResponse = null;
    let isFollowUpPrompt = false;

    // --- COOPERATION / UNCOOPERATIVE DETECTION FLOW ---
    if (newMessage && assistantMessages.length > 0) {
      let isSpam = isUncooperative(newMessage, isIntro);

      if (!isSpam) {
        try {
          const lastQText = assistantMessages[assistantMessages.length - 1].content;
          const coopResult = await ai.checkAnswerCooperation(role, lastQText, newMessage);
          if (coopResult && coopResult.isUncooperative) {
            isSpam = true;
          }
        } catch (err) {
          console.error("AI cooperation check failed:", err);
        }
      }

      // Check if it was an elaboration request, and they STILL failed keywords validation
      const lastQText = assistantMessages[assistantMessages.length - 1].content;
      const wasElaborationRequest = lastQText.includes("I notice you didn't quite cover") || lastQText.includes("Could you elaborate");

      if (!isSpam && wasElaborationRequest) {
        const matchedQuestionObj = questions.find(q => 
          lastQText.includes(q.question) || 
          (wasElaborationRequest && lastQText.includes(q.keywords[0]))
        );
        if (matchedQuestionObj) {
          const textLower = newMessage.toLowerCase();
          const matchedKeywords = matchedQuestionObj.keywords.filter(k => {
            const escaped = k.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const regex = new RegExp(`(?<![a-zA-Z0-9])${escaped}(?![a-zA-Z0-9])`, 'i');
            return regex.test(textLower);
          });
          if (matchedKeywords.length === 0) {
            isSpam = true;
          }
        }
      }

      if (isSpam) {
        // Count total uncooperative user messages in the entire history
        let totalUncooperativeCount = 1;
        for (let i = 0; i < history.length; i++) {
          const msg = history[i];
          if (msg.role === 'user') {
            const histIntro = (i <= 2);
            let histSpam = isUncooperative(msg.content, histIntro);
            
            // Check if history message was elaboration response
            const histLastAssistantMsg = history[i - 1];
            if (!histSpam && histLastAssistantMsg && histLastAssistantMsg.role === 'assistant') {
              const histLastQText = histLastAssistantMsg.content;
              const histWasElaboration = histLastQText.includes("I notice you didn't quite cover") || histLastQText.includes("Could you elaborate");
              if (histWasElaboration) {
                const histMatchedQ = questions.find(q => 
                  histLastQText.includes(q.question) || 
                  (histWasElaboration && histLastQText.includes(q.keywords[0]))
                );
                if (histMatchedQ) {
                  const histTextLower = msg.content.toLowerCase();
                  const histMatchedKeywords = histMatchedQ.keywords.filter(k => {
                    const escaped = k.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                    const regex = new RegExp(`(?<![a-zA-Z0-9])${escaped}(?![a-zA-Z0-9])`, 'i');
                    return regex.test(histTextLower);
                  });
                  if (histMatchedKeywords.length === 0) {
                    histSpam = true;
                  }
                }
              }
            }

            // Check if subsequent assistant response was a warning
            const nextAssistantMsg = history[i + 1];
            if (!histSpam && nextAssistantMsg && nextAssistantMsg.role === 'assistant') {
              const wasWarning = nextAssistantMsg.content.includes("This is a professional interview assessment") ||
                                 nextAssistantMsg.content.includes("I notice you are not engaging with the assessment questions") ||
                                 nextAssistantMsg.content.includes("Due to continued lack of cooperation") ||
                                 nextAssistantMsg.content.includes("Excuse me, I notice you are making") ||
                                 nextAssistantMsg.content.includes("This is your final warning") ||
                                 nextAssistantMsg.content.includes("Making funny gestures");
              if (wasWarning) {
                histSpam = true;
              }
            }

            if (histSpam) {
              totalUncooperativeCount++;
            }
          }
        }

        if (newMessage.startsWith('[SYSTEM:')) {
          if (totalUncooperativeCount === 1) {
            aiResponse = `Excuse me, I notice you are making unprofessional gestures/faces in front of the camera. Please stop immediately and maintain a professional posture. This behavior is unacceptable for an interview.`;
          } else if (totalUncooperativeCount === 2) {
            aiResponse = `This is your final warning. Your visual behavior is highly unprofessional. If you make any further inappropriate gestures or fail to take this seriously, I will terminate this session immediately.`;
          } else {
            aiResponse = `Due to continued lack of cooperation and unprofessional visual gestures, this interview session has been terminated. Generating your final report now...`;
          }
        } else {
          if (totalUncooperativeCount === 1) {
            aiResponse = `This is a professional interview assessment. Please provide a relevant technical response or description of your experience for the ${role} position.`;
          } else if (totalUncooperativeCount === 2) {
            aiResponse = `I notice you are not engaging with the assessment questions. If you wish to continue the interview, please answer the questions professionally. Otherwise, we will have to terminate the session.`;
          } else {
            aiResponse = `Due to continued lack of cooperation, this interview session has been terminated. Generating your final report now...`;
          }
        }
      }
    }

    // --- ANSWER VALIDATION LOGIC ---
    if (!aiResponse && newMessage && assistantMessages.length > 0) {
      const lastQText = assistantMessages[assistantMessages.length - 1].content;
      const wasElaborationRequest = lastQText.includes("I notice you didn't quite cover") || lastQText.includes("Could you elaborate");

      if (isIntro && !wasElaborationRequest) {
        // Validate introduction response
        const textLower = newMessage.toLowerCase();
        const words = textLower.split(/\s+/).filter(Boolean);
        
        const introKeywords = ['experience', 'project', 'skill', 'develop', 'career', 'stud', 'interest', 'work', 'background', 'engineer', 'learn', 'education', 'degree', 'university', 'tech', 'myself', 'resume'];
        const matchedKeywords = introKeywords.filter(k => {
          const regex = new RegExp(`(?<![a-zA-Z0-9])${k}(?![a-zA-Z0-9])`, 'i');
          return regex.test(textLower);
        });
        
        if (matchedKeywords.length === 0 || words.length < 8) {
          isFollowUpPrompt = true;
          aiResponse = `I notice you didn't quite cover your background and technical experience. Could you please introduce yourself and walk me through your experience for the ${role} position?`;
        }
      } else if (!wasElaborationRequest) {
        // Find which standard question in the bank corresponds to this discussion
        const matchedQuestionObj = questions.find(q => 
          lastQText.includes(q.question) || 
          (wasElaborationRequest && lastQText.includes(q.keywords[0]))
        );

        // If we found the question, and we haven't already asked them to elaborate on it
        if (matchedQuestionObj) {
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
            
            if (isIntro) {
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
    const isTerminated = aiResponse.toLowerCase().includes('terminated');
    res.json({ messages, terminated: isTerminated });

  } catch (error) {
    console.error('Interview Error:', error);
    res.status(500).json({ message: 'Interview failed' });
  }
});

// End interview route
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
    const ruleScore = Math.min(100, avgScore);

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

    // Call unified AI to evaluate transcript
    let aiEvaluation = null;
    try {
      aiEvaluation = await ai.evaluateInterview(role, history);
    } catch (aiErr) {
      console.error('AI transcript evaluation failed, using fallback:', aiErr);
    }

    let finalScore = aiEvaluation ? aiEvaluation.overall : ruleScore;
    let confidence = aiEvaluation ? aiEvaluation.confidence : Math.round(finalScore * 0.9);
    let technicalAccuracy = aiEvaluation ? aiEvaluation.technicalAccuracy : Math.round(finalScore * 0.85);
    let communication = aiEvaluation ? aiEvaluation.communication : Math.round(finalScore * 0.95);
    let feedback = aiEvaluation ? aiEvaluation.feedback : 'Good performance overall. Consider detailing your tech terms with active verbs.';
    const detailedEvaluations = aiEvaluation ? aiEvaluation.detailedEvaluations : [];

    const hasTerminationMsg = history.some(m => 
      m.role === 'assistant' && 
      m.content.toLowerCase().includes('terminated')
    );

    if (hasTerminationMsg) {
      finalScore = 0;
      confidence = 0;
      technicalAccuracy = 0;
      communication = 0;
      feedback = "This mock interview was terminated early due to continued lack of cooperation, keyboard spam, or unprofessional visual gestures (such as sticking tongue out or making funny faces). The candidate receives a zero readiness score for failing to meet professional and communication guidelines.";
    }

    const newInterview = new InterviewResult({
      userId: req.user.userId,
      role: role,
      score: finalScore,
      feedback: feedback,
      transcript: history,
      fillerWordsCount: totalFillerWords,
      averageWordCount: averageWordCount,
      clarityGrade: clarityGrade,
      confidence,
      technicalAccuracy,
      communication,
      detailedEvaluations
    });

    await newInterview.save();
    
    res.json({ 
      message: 'Interview completed', 
      result: { 
        score: finalScore, 
        feedback,
        fillerWordsCount: totalFillerWords,
        averageWordCount,
        clarityGrade,
        confidence,
        technicalAccuracy,
        communication,
        detailedEvaluations
      } 
    });
  } catch (error) {
    console.error('Interview End Error:', error);
    res.status(500).json({ message: 'Failed to end interview' });
  }
});

module.exports = router;
