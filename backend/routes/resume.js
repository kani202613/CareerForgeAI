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
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const strengths = [];
  const improvements = [];
  const suggestions = [];
  const sectionsFound = [];

  // 1. SECTION COMPLETENESS & CONTACT VERIFICATION (Max 20 pts)
  let sectionScore = 0;
  
  // Check Contact Details
  const hasEmail = /@/.test(lower);
  const hasPhone = /\+?\b\d{10,12}\b|\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(lower);
  const hasLinkedIn = lower.includes('linkedin.com');
  const hasGitHub = lower.includes('github.com');
  
  if (hasEmail && hasPhone) {
    if (hasLinkedIn || hasGitHub) {
      sectionScore += 5;
      sectionsFound.push('Contact Information');
      strengths.push('Complete contact information with professional profile links (LinkedIn/GitHub) detected.');
    } else {
      sectionScore += 3;
      sectionsFound.push('Contact Information');
      improvements.push('Contact details found, but missing professional links (LinkedIn or GitHub).');
      suggestions.push('Add your LinkedIn and GitHub links to the contact header. Modern tech screeners require verification of your public work.');
    }
  } else {
    improvements.push('Incomplete contact details. Ensure your email and phone number are clearly visible.');
    suggestions.push('Add a clear "Contact Info" header with your email, phone, and professional profiles at the top.');
  }

  // Check Education
  const educationKeywords = ['education', 'degree', 'university', 'college', 'school', 'academic'];
  const hasEducation = educationKeywords.some(k => lower.includes(k));
  if (hasEducation) {
    sectionScore += 5;
    sectionsFound.push('Education');
    strengths.push('Standard Education section successfully detected.');
  } else {
    improvements.push('No standard Education section detected.');
    suggestions.push('Create a dedicated "Education" section specifying your degree, major, university, and graduation date.');
  }

  // Check Work Experience
  const experienceKeywords = ['experience', 'employment', 'work history', 'professional history', 'career', 'work experience'];
  const hasExperience = experienceKeywords.some(k => lower.includes(k));
  if (hasExperience) {
    sectionScore += 5;
    sectionsFound.push('Work Experience');
    strengths.push('Professional Work Experience section detected.');
  } else {
    improvements.push('Missing a standard Work Experience section.');
    suggestions.push('Add an "Experience" section detailing your professional roles, responsibilities, and achievements.');
  }

  // Check Skills
  const skillsKeywords = ['skills', 'technologies', 'technical skills', 'core competencies', 'expertise'];
  const hasSkills = skillsKeywords.some(k => lower.includes(k));
  if (hasSkills) {
    sectionScore += 5;
    sectionsFound.push('Skills');
    strengths.push('Skills section successfully parsed.');
  } else {
    improvements.push('No dedicated Skills inventory section found.');
    suggestions.push('Add a "Skills" section listing your programming languages, frameworks, databases, and developer tools.');
  }


  // 2. WORD COUNT & DENSITY SCORE (Max 10 pts)
  let structureScore = 0;
  if (wordCount >= 400 && wordCount <= 800) {
    structureScore = 10;
    strengths.push(`Ideal word count (${wordCount} words) for standard single-page screeners.`);
  } else if (wordCount >= 250 && wordCount < 400) {
    structureScore = 6;
    improvements.push(`Resume is slightly brief (${wordCount} words). It may lack the depth required for strict ATS filters.`);
    suggestions.push('Expand your experience and project descriptions. Add details about your technical implementations.');
  } else if (wordCount > 800 && wordCount <= 1000) {
    structureScore = 6;
    improvements.push(`Resume word count (${wordCount} words) is a bit high. Keep it focused and avoid verbose narratives.`);
    suggestions.push('Consolidate experience descriptions. Use concise, high-impact bullet points instead of paragraphs.');
  } else {
    structureScore = 2;
    improvements.push(`Unusual resume length (${wordCount} words). Very short or very long resumes are flagged by screeners.`);
    suggestions.push('Aim for a balanced word count between 450 and 750 words to maintain clean structure.');
  }


  // 3. KEYWORD & SKILLS MATCH SCORE (Max 30 pts)
  const techKeywords = [
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust',
    'html', 'css', 'sql', 'postgresql', 'mongodb', 'mysql', 'redis', 'graphql', 'rest', 'api',
    'react', 'vue', 'angular', 'svelte', 'next.js', 'express', 'node.js', 'django', 'flask',
    'spring boot', 'laravel', 'rails', 'aws', 'docker', 'kubernetes', 'git', 'github', 'gitlab',
    'ci/cd', 'jenkins', 'devops', 'linux', 'cloud', 'serverless', 'microservices', 'firebase',
    'tailwind', 'bootstrap', 'webpack', 'redux', 'npm', 'yarn', 'jquery', 'sass', 'sqlite'
  ];
  const softKeywords = [
    'leadership', 'communication', 'team', 'collaboration', 'problem solving', 'agile', 'scrum',
    'project management', 'critical thinking', 'adaptability', 'creativity', 'mentoring',
    'time management', 'flexibility', 'organization', 'negotiation'
  ];

  const techFound = techKeywords.filter(k => lower.includes(k));
  const softFound = softKeywords.filter(k => lower.includes(k));
  const extractedSkills = Array.from(new Set(techFound.concat(softFound)));

  let keywordScore = 0;
  
  if (techFound.length >= 15) {
    keywordScore += 20;
    strengths.push(`Strong technical keyword matches (${techFound.length} parsed skills).`);
  } else if (techFound.length >= 10) {
    keywordScore += 15;
    strengths.push(`Decent technical vocabulary (${techFound.length} keywords).`);
  } else if (techFound.length >= 5) {
    keywordScore += 10;
    improvements.push(`Moderate tech keyword density (${techFound.length} found). Target role filters look for specific tech stacks.`);
    suggestions.push('Add more specific libraries, packages, and database terms (e.g. Redux, PostgreSQL, Webpack, Git, CI/CD) to pass keyword filters.');
  } else {
    keywordScore += 3;
    improvements.push(`Extremely low tech keyword density (${techFound.length} found). ATS filters will likely auto-reject.`);
    suggestions.push('Detail the tech stacks used in your projects. Mention exact tools, languages, and frameworks.');
  }

  if (softFound.length >= 4) {
    keywordScore += 10;
  } else if (softFound.length >= 2) {
    keywordScore += 7;
  } else {
    keywordScore += 3;
    suggestions.push('Incorporate standard methodologies like "Agile", "Scrum", or "Collaboration" to show team-readiness.');
  }


  // 4. ACTION VERBS & METRICS (Max 25 pts)
  const actionVerbs = [
    'designed', 'developed', 'built', 'led', 'managed', 'optimized', 'engineered', 'launched',
    'implemented', 'automated', 'created', 'increased', 'decreased', 'reduced', 'improved',
    'saved', 'analyzed', 'coordinated', 'established', 'spearheaded', 'formulated', 'generated',
    'drove', 'upgraded', 'solved', 'resolved', 'streamlined', 'pioneered', 'directed'
  ];

  const verbsFound = actionVerbs.filter(v => lower.includes(v));
  const numbersFound = (text.match(/\b\d+(?:%|\s*percent|x|\s*multiplier|\+)?\b/g) || [])
    .filter(n => {
      const val = parseInt(n, 10);
      return val > 0 && val !== 1 && (val < 1900 || val > 2100);
    });

  let impactScore = 0;

  if (verbsFound.length >= 8) {
    impactScore += 15;
    strengths.push('Excellent use of strong action verbs showing direct ownership.');
  } else if (verbsFound.length >= 4) {
    impactScore += 10;
    strengths.push(`Good verb usage (${verbsFound.length} unique action verbs).`);
  } else if (verbsFound.length >= 1) {
    impactScore += 5;
    improvements.push('Limited action verbs found. Resume uses a passive tone.');
    suggestions.push('Start your experience bullet points with strong action verbs like "Spearheaded", "Optimized", "Designed", or "Automated" instead of "Responsible for".');
  } else {
    improvements.push('No strong action verbs identified. Tone is too descriptive.');
  }

  if (numbersFound.length >= 5) {
    impactScore += 10;
    strengths.push('Excellent quantification of achievements with multiple metrics.');
  } else if (numbersFound.length >= 3) {
    impactScore += 6;
    strengths.push('Good inclusion of numbers to support some achievements.');
  } else if (numbersFound.length >= 1) {
    impactScore += 3;
    improvements.push('Insufficient metric details. Only a few numbers or percentages found.');
    suggestions.push('Add more numbers and metrics. Quantify achievements (e.g., "reduced latency by 15%", "managed 3 projects") to establish professional credibility.');
  } else {
    improvements.push('Completely lacks quantifiable achievements. No metrics, percentages, or numbers found.');
    suggestions.push('Quantify the results of your work. Add details like: % speed increases, % revenue changes, number of users served, or time saved.');
  }


  // 5. FORMATTING & ATS BEST PRACTICES (Max 15 pts)
  let formattingScore = 15;

  // Penalty A: Verb Repetition (deduct 3 pts per highly repeated verb, max 6 pts)
  const verbCounts = {};
  words.forEach(w => {
    const word = w.toLowerCase().replace(/[^a-z]/g, '');
    if (actionVerbs.includes(word)) {
      verbCounts[word] = (verbCounts[word] || 0) + 1;
    }
  });
  
  let repeatedVerbsCount = 0;
  Object.keys(verbCounts).forEach(v => {
    if (verbCounts[v] > 3) {
      repeatedVerbsCount++;
      formattingScore -= 3;
    }
  });
  formattingScore = Math.max(9, formattingScore);

  if (repeatedVerbsCount > 0) {
    improvements.push('Action verb repetition detected. Repeating words makes the resume look repetitive.');
    suggestions.push('Avoid repeating action verbs (e.g. using "developed" or "built" multiple times). Use diverse synonyms like "engineered", "implemented", or "crafted".');
  }

  // Penalty B: Weak / Passive Language (deduct 2 pts per occurrence, max 6 pts)
  const weakWords = ['assisted', 'helped', 'responsible for', 'worked on', 'participated in', 'tasked with'];
  let weakPhrasesCount = 0;
  weakWords.forEach(weak => {
    if (lower.includes(weak)) {
      weakPhrasesCount++;
      formattingScore -= 2;
    }
  });
  formattingScore = Math.max(9, formattingScore);

  if (weakPhrasesCount > 0) {
    improvements.push('Passive/weak language detected (e.g. "responsible for", "helped").');
    suggestions.push('Replace weak phrases like "responsible for" or "helped with" with strong active verbs like "executed", "led", "automated", or "engineered".');
  }

  // Penalty C: Missing professional links (deduct 3 pts)
  if (!hasLinkedIn && !hasGitHub) {
    formattingScore -= 3;
  }

  formattingScore = Math.max(0, formattingScore);


  // 6. SCORE INTEGRATION (HONEST & STRICT - NO UPWARD CALIBRATION)
  const atsScore = Math.round(sectionScore + structureScore + keywordScore + impactScore + formattingScore);
  const resumeScore = atsScore;

  const feedbackSummary = `Your resume scored ${atsScore}/100. It contains standard sections like ${sectionsFound.slice(0, 3).join(', ')}. To optimize further for ATS compliance, aim to increase technical keywords (current: ${techFound.length}) and include quantifiable achievements.`;

  return {
    resumeScore,
    atsScore,
    extractedSkills,
    feedback: feedbackSummary,
    strengths: strengths.slice(0, 4),
    improvements: improvements.slice(0, 4),
    suggestions: suggestions.slice(0, 5)
  };
}

router.post('/upload', authMiddleware, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    let text;
    try {
      const data = await pdfParse(req.file.buffer);
      text = data.text;
    } catch (parseError) {
      console.error('PDF parsing error:', parseError);
      return res.status(400).json({ 
        message: 'Could not read text from your PDF file. Please ensure the file is not password-protected, encrypted, or corrupted, and try saving it as a standard PDF again.' 
      });
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ 
        message: 'Your resume seems to contain no readable text. If it is a scanned document or an image-only PDF, please convert it to text format first so our ATS scanner can read it.' 
      });
    }

    // Perform free ATS‑style analysis
    const analysis = atsAnalyze(text);

    const newResume = new Resume({
      userId: req.user.userId,
      resumeScore: analysis.resumeScore,
      atsScore: analysis.atsScore,
      extractedSkills: analysis.extractedSkills,
      feedback: analysis.feedback,
      strengths: analysis.strengths,
      improvements: analysis.improvements,
      suggestions: analysis.suggestions
    });

    await newResume.save();
    res.json({ message: 'Resume analyzed successfully (free ATS mode)', result: analysis });
  } catch (error) {
    console.error('Resume Analysis Error:', error);
    res.status(500).json({ message: 'Failed to analyze resume' });
  }
});

module.exports = router;
