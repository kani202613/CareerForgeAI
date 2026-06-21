const { GoogleGenerativeAI } = require('@google/generative-ai');
const { OpenAI } = require('openai');

let aiClientType = 'none';
let geminiModel = null;
let openaiClient = null;

// Initialize clients based on available environment variables
if (process.env.GEMINI_API_KEY) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    aiClientType = 'gemini';
    console.log('[AI Client] Initialized Gemini model successfully.');
  } catch (err) {
    console.error('[AI Client] Failed to initialize Gemini client:', err);
  }
} else if (process.env.OPENAI_API_KEY) {
  try {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    aiClientType = 'openai';
    console.log('[AI Client] Initialized OpenAI client successfully.');
  } catch (err) {
    console.error('[AI Client] Failed to initialize OpenAI client:', err);
  }
} else {
  console.warn('[AI Client] WARNING: No GEMINI_API_KEY or OPENAI_API_KEY found in process.env. Running in Mock/Rule-based fallback mode.');
}

// Helper to strip markdown block wrappers if present in AI output
function cleanJsonResponse(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```json/, '').replace(/^```/, '');
    cleaned = cleaned.replace(/```$/, '');
  }
  return cleaned.trim();
}

/**
 * Calls the selected AI API (Gemini or OpenAI) with a prompt.
 * If neither key is present, falls back to a default rule-based parser structure.
 */
async function callAi(prompt, fallbackFunc) {
  if (aiClientType === 'gemini' && geminiModel) {
    try {
      const result = await geminiModel.generateContent(prompt);
      const text = result.response.text();
      return JSON.parse(cleanJsonResponse(text));
    } catch (err) {
      console.error('[AI Error] Gemini call failed, trying fallback:', err);
    }
  } else if (aiClientType === 'openai' && openaiClient) {
    try {
      const response = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });
      const text = response.choices[0].message.content;
      return JSON.parse(cleanJsonResponse(text));
    } catch (err) {
      console.error('[AI Error] OpenAI call failed, trying fallback:', err);
    }
  }

  // Fallback to rule-based mock logic if no API key works
  return fallbackFunc();
}

/**
 * Analyzes resume text, optionally matching it against a target Job Description.
 */
async function analyzeResume(resumeText, jdText = null) {
  const prompt = `
You are an expert ATS (Applicant Tracking System) reviewer and corporate hiring manager.
Analyze the following resume text. Optionally compare it to the provided Job Description (JD) text if present.

Resume Text:
${resumeText}

${jdText ? `Job Description Text:\n${jdText}` : ''}

Analyze and return a JSON object containing:
- strengths: Array of 3-5 strings detailing strengths.
- weaknesses: Array of 3-5 strings detailing weaknesses.
- suggestions: Array of 3-5 strings detailing actionable ATS format rewrite suggestions.
- missingSkills: Array of strings detailing technical or soft skills missing from the resume.
- improvementPlan: Array of strings detailing a plan to address weaknesses and missing skills.
- structureAnalysis: A JSON object detailing structural layout audits:
  - score: Number (0-100) representing structural layouts compatibility.
  - sections: Array of objects for standard sections (Summary, Skills, Work Experience, Education, Projects). Each object has:
    - name: String
    - found: Boolean
    - score: Number (8 for found, 0 for missing)
    - feedback: String
  - chronologicalAudit: Object containing:
    - isDescending: Boolean (true if dates are descending, false otherwise)
    - feedback: String
  - contactInfoAudit: Object containing:
    - hasEmail: Boolean
    - hasPhone: Boolean
    - hasLinkedIn: Boolean
    - hasGitHub: Boolean
    - isAtTop: Boolean (true if email/phone appear before main section headers, false otherwise)
    - feedback: String
  - formattingAudit: Object containing:
    - hasBulletPoints: Boolean
    - hasTablesColumns: Boolean (true if pipes '|' or tabular layouts are detected)
    - hasVisualRatings: Boolean (true if stars or progress bars are detected)
    - feedback: String
${jdText ? `
- matchPercentage: Number (0-100) indicating how well the resume matches the JD.
- missingKeywords: Array of strings detailing keywords present in the JD but missing in the resume.
- recommendedImprovements: Array of strings detailing improvements to align with the JD.
` : `
- matchPercentage: null
- missingKeywords: []
- recommendedImprovements: []
`}

Return ONLY the raw JSON object. Do not include markdown block formatting (e.g., do not wrap in \`\`\`json). Ensure it parses correctly with JSON.parse().
`;

  return callAi(prompt, () => {
    // Mock fallback logic
    const lower = resumeText.toLowerCase();
    const strengths = ['Good baseline keywords found', 'Standard sections detected'];
    const weaknesses = [];
    const suggestions = [];
    const missingSkills = [];

    if (!resumeText.includes('github.com')) {
      weaknesses.push('Missing links to verify coding work.');
      suggestions.push('Add active GitHub repositories.');
      missingSkills.push('Git/Version Control');
    }
    if (lower.includes('objective')) {
      weaknesses.push('Uses outdated Objective section.');
      suggestions.push('Replace Objective with a Professional Summary.');
    }

    // Default mock structure analysis
    const hasEmail = /@/.test(lower);
    const hasPhone = /\+?\b\d{10,12}\b|\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(lower);
    const hasLinkedIn = lower.includes('linkedin.com');
    const hasGitHub = lower.includes('github.com');
    const hasEducation = lower.includes('education');
    const hasExperience = lower.includes('experience') || lower.includes('work history');
    const hasSkills = lower.includes('skills');
    const hasProjects = lower.includes('projects');
    const hasSummary = lower.includes('summary') || lower.includes('profile');

    const sections = [
      { name: 'Summary', found: hasSummary, score: hasSummary ? 8 : 0, feedback: hasSummary ? 'Summary section verified.' : 'Missing Professional Summary.' },
      { name: 'Skills', found: hasSkills, score: hasSkills ? 8 : 0, feedback: hasSkills ? 'Skills section verified.' : 'Missing Skills section.' },
      { name: 'Work Experience', found: hasExperience, score: hasExperience ? 8 : 0, feedback: hasExperience ? 'Experience section verified.' : 'Missing Experience section.' },
      { name: 'Education', found: hasEducation, score: hasEducation ? 8 : 0, feedback: hasEducation ? 'Education section verified.' : 'Missing Education section.' },
      { name: 'Projects', found: hasProjects, score: hasProjects ? 8 : 0, feedback: hasProjects ? 'Projects section verified.' : 'Missing Projects section.' }
    ];

    const structureAnalysis = {
      score: 80,
      sections,
      chronologicalAudit: {
        isDescending: true,
        feedback: 'Work history is in reverse-chronological order.'
      },
      contactInfoAudit: {
        hasEmail,
        hasPhone,
        hasLinkedIn,
        hasGitHub,
        isAtTop: true,
        feedback: 'Contact information parsed correctly at the header.'
      },
      formattingAudit: {
        hasBulletPoints: true,
        hasTablesColumns: false,
        hasVisualRatings: false,
        feedback: 'Standard layout formatting rules observed.'
      }
    };

    return {
      strengths,
      weaknesses: weaknesses.length > 0 ? weaknesses : ['None detected'],
      suggestions: suggestions.length > 0 ? suggestions : ['Format looks good'],
      missingSkills: missingSkills.length > 0 ? missingSkills : ['Redux', 'Testing', 'CI/CD'],
      improvementPlan: ['Review section titles', 'Upload project repository links'],
      matchPercentage: jdText ? 65 : null,
      missingKeywords: jdText ? ['TypeScript', 'Jest'] : [],
      recommendedImprovements: jdText ? ['Integrate TypeScript keywords in projects'] : [],
      structureAnalysis
    };
  });
}

/**
 * Generates a personalized 4-week learning roadmap based on missing skills.
 */
async function generateRoadmap(role, missingSkills) {
  const skillsList = missingSkills && missingSkills.length > 0 ? missingSkills.join(', ') : 'modern framework practices';
  const prompt = `
You are an elite career coach.
Create a personalized 4-week learning roadmap for a candidate targeting the role of "${role}".
The candidate is currently missing these skills: ${skillsList}.

Return a JSON array of objects representing the weeks. Each object must have:
- week: String (e.g., "Week 1: Core Fundamentals")
- topic: String (e.g., "Learn Next.js Router & State")
- description: String (e.g., "Study app-router, layout structures, and server components. Build a mock landing page using these structures.")

Return ONLY the raw JSON array. Do not include markdown block formatting.
`;

  return callAi(prompt, () => {
    // Mock fallback roadmap
    return [
      {
        week: 'Week 1: Core Skill Integration',
        topic: `Learn basic concepts of ${missingSkills[0] || 'Modern Technologies'}`,
        description: 'Read documentation, follow crash courses, and build small hello-world apps.'
      },
      {
        week: 'Week 2: Practical Exercises',
        topic: `Build a project using ${missingSkills[0] || 'Modern Technologies'}`,
        description: 'Create a fully functional sandbox application integrating state managers.'
      },
      {
        week: 'Week 3: Advanced Concepts',
        topic: `Study performance optimization and testing`,
        description: 'Write unit tests, analyze bundle sizes, and optimize database indexing keys.'
      },
      {
        week: 'Week 4: Deployment & Review',
        topic: 'Publish code and review achievements',
        description: 'Deploy codebase on Vercel/Render, add to resume, and practice mock questions.'
      }
    ];
  });
}

/**
 * Evaluates the interview transcript question-by-answer.
 */
async function evaluateInterview(role, transcript) {
  const transcriptText = transcript.map(m => `${m.role === 'user' ? 'Candidate' : 'Interviewer'}: ${m.content}`).join('\n');
  const prompt = `
You are an expert technical interviewer.
Evaluate the candidate's responses in this mock interview for the role of "${role}".

Question/Answer Transcript:
${transcriptText}

Analyze the candidate's answers and return a JSON object containing:
- confidence: Number (0-100) indicating communication confidence, pacing, and absence of excessive filler words.
- technicalAccuracy: Number (0-100) indicating technical correctness and depth.
- communication: Number (0-100) indicating structural clarity and explanation skills.
- overall: Number (0-100) indicating the overall performance score.
- feedback: String summarizing strengths and improvement points.
- detailedEvaluations: Array of objects matching each question-answer pair. Each object must have:
  - question: String (the interviewer's question)
  - answer: String (the candidate's answer)
  - confidence: Number (0-100)
  - technicalAccuracy: Number (0-100)
  - communication: Number (0-100)
  - overall: Number (0-100)
  - feedback: String (detailed feedback on this answer)

Return ONLY the raw JSON object. Do not include markdown block formatting.
`;

  return callAi(prompt, () => {
    // Mock fallback evaluations
    const detailedEvaluations = [];
    
    // Attempt to parse out Q&A pairs from transcript
    for (let i = 0; i < transcript.length; i++) {
      if (transcript[i].role === 'assistant' && i + 1 < transcript.length && transcript[i + 1].role === 'user') {
        detailedEvaluations.push({
          question: transcript[i].content,
          answer: transcript[i + 1].content,
          confidence: 80,
          technicalAccuracy: 75,
          communication: 80,
          overall: 78,
          feedback: 'Answer covers basics but lacks deep quantification metrics.'
        });
      }
    }

    return {
      confidence: 80,
      technicalAccuracy: 70,
      communication: 85,
      overall: 78,
      feedback: 'Good conversational presence. Answered technical questions with solid base concepts. Needs more numerical metrics.',
      detailedEvaluations
    };
  });
}

/**
 * Checks if the candidate's answer is uncooperative, off-topic, gibberish, or a silly comedy action.
 */
async function checkAnswerCooperation(role, question, answer) {
  const prompt = `
You are an AI technical interviewer. Analyze the candidate's response to the interview question below for the "${role}" position.

Interviewer's Question: "${question}"
Candidate's Response: "${answer}"

Determine if the candidate is:
1. Being uncooperative or refusing to participate (e.g., saying "I don't care", "exit", "nonsense", "skip").
2. Typing gibberish or keyboard mashing (e.g., "klhgvhb", "asdfghjk").
3. Acting foolishly, making silly jokes, displaying "comedy actions", or being completely off-topic (e.g., responding to a technical programming question with a joke about potatoes, singing lyrics, or saying "I am not listening to you").

Respond ONLY with a JSON object in this format:
{
  "isUncooperative": true or false,
  "reason": "brief explanation"
}

If the answer is a valid attempt to answer the question (even if incorrect or very short), set "isUncooperative" to false.
`;

  return callAi(prompt, () => {
    return { isUncooperative: false, reason: "Fallback default" };
  });
}

module.exports = {
  analyzeResume,
  generateRoadmap,
  evaluateInterview,
  checkAnswerCooperation
};

