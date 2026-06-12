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

  // 1. SECTION COMPLETENESS CHECK (Max 25 pts)
  const sectionDefinitions = {
    contact: ['contact', 'email', 'phone', 'linkedin', 'github', 'address', 'website'],
    education: ['education', 'degree', 'university', 'college', 'school', 'gpa', 'academic'],
    experience: ['experience', 'employment', 'work history', 'professional history', 'career', 'work experience'],
    skills: ['skills', 'technologies', 'technical skills', 'core competencies', 'expertise'],
    projects: ['projects', 'personal projects', 'academic projects', 'portfolio'],
    summary: ['summary', 'objective', 'about me', 'profile', 'professional summary'],
    certifications: ['certifications', 'awards', 'certificates', 'achievements']
  };

  let sectionScore = 0;
  const sectionsFound = [];

  // Check contact details (vital for recruiters)
  const hasContactInfo = ['email', 'phone', 'linkedin', 'github'].some(keyword => lower.includes(keyword)) || /@/.test(lower) || /\d{10}/.test(lower);
  if (hasContactInfo) {
    sectionScore += 5;
    sectionsFound.push('Contact Information');
    strengths.push('Contact details (email, phone, or professional profiles) were successfully detected.');
  } else {
    improvements.push('Contact details are missing or unrecognized. Ensure your email, phone, and professional profiles are easy to find.');
    suggestions.push('Add a clear "Contact Information" section at the top of your resume containing your email, phone number, LinkedIn link, and GitHub portfolio.');
  }

  // Check education
  const hasEducation = sectionDefinitions.education.some(keyword => lower.includes(keyword));
  if (hasEducation) {
    sectionScore += 5;
    sectionsFound.push('Education');
    strengths.push('Education details were successfully identified.');
  } else {
    improvements.push('No standard Education section detected.');
    suggestions.push('Create a dedicated "Education" section outlining your degrees, major, institution name, and graduation year.');
  }

  // Check experience
  const hasExperience = sectionDefinitions.experience.some(keyword => lower.includes(keyword));
  if (hasExperience) {
    sectionScore += 5;
    sectionsFound.push('Work Experience');
    strengths.push('Work experience or professional history section detected.');
  } else {
    improvements.push('Missing standard Work Experience section.');
    suggestions.push('Add an "Experience" section detailing your past roles, company names, employment duration, and bullet points showing your achievements.');
  }

  // Check skills
  const hasSkills = sectionDefinitions.skills.some(keyword => lower.includes(keyword));
  if (hasSkills) {
    sectionScore += 5;
    sectionsFound.push('Skills');
    strengths.push('Skills inventory section identified.');
  } else {
    improvements.push('Missing a dedicated Skills section.');
    suggestions.push('Add a "Skills" or "Technical Skills" section listing your programming languages, frameworks, databases, and tools.');
  }

  // Check other supportive sections (Projects, Summary, Certifications)
  let supportiveCount = 0;
  if (sectionDefinitions.projects.some(keyword => lower.includes(keyword))) {
    supportiveCount++;
    sectionsFound.push('Projects');
  }
  if (sectionDefinitions.summary.some(keyword => lower.includes(keyword))) {
    supportiveCount++;
    sectionsFound.push('Summary');
  }
  if (sectionDefinitions.certifications.some(keyword => lower.includes(keyword))) {
    supportiveCount++;
    sectionsFound.push('Certifications/Awards');
  }

  sectionScore += Math.min(5, supportiveCount * 2.5);
  if (supportiveCount > 0) {
    strengths.push(`Found supplementary sections: ${sectionsFound.filter(s => ['Projects', 'Summary', 'Certifications/Awards'].includes(s)).join(', ')}.`);
  } else {
    improvements.push('Missing helpful sections like Projects, a Professional Summary, or Certifications.');
    suggestions.push('Boost your resume relevance by adding a "Projects" section to highlight hands-on work, and a brief "Summary" at the top.');
  }

  sectionScore = Math.min(25, sectionScore);

  // 2. STRUCTURE & WORD COUNT SCORE (Max 15 pts)
  let structureScore = 0;
  if (wordCount >= 400 && wordCount <= 900) {
    structureScore = 15;
    strengths.push(`Ideal resume word count (${wordCount} words) for a 1-2 page layout, ensuring high scan readability.`);
  } else if (wordCount >= 250 && wordCount < 400) {
    structureScore = 10;
    improvements.push(`Resume word count (${wordCount} words) is a bit low. It might lack detail.`);
    suggestions.push('Expand your experience and project descriptions. Elaborate on the technologies and methodologies you used.');
  } else if (wordCount > 900 && wordCount <= 1200) {
    structureScore = 10;
    improvements.push(`Resume word count (${wordCount} words) is slightly high. It might exceed the ideal 2-page limit.`);
    suggestions.push('Consolidate your descriptions. Ensure your experiences are concise and focus strictly on high-impact points.');
  } else {
    structureScore = 5;
    improvements.push(`Resume is either extremely short or extremely long (${wordCount} words).`);
    suggestions.push('Aim for a balanced word count between 400 and 800 words. Remove fluff or add detailed work experience bullet points.');
  }

  // 3. KEYWORD & SKILLS MATCH SCORE (Max 35 pts)
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

  let keywordScore = 0;

  if (techFound.length >= 8) {
    keywordScore += 20;
    strengths.push(`Excellent technical keyword density (${techFound.length} tools/skills identified).`);
  } else if (techFound.length >= 4) {
    keywordScore += 15;
    strengths.push(`Good representation of technical skills (${techFound.length} keywords found).`);
  } else if (techFound.length >= 1) {
    keywordScore += 8;
    improvements.push(`Low density of technical keywords (${techFound.length} found). Modern ATS filters look for specific tech stacks.`);
    suggestions.push('Include names of specific tools, libraries, and frameworks you worked with (e.g. Git, REST APIs, Tailwind, Node.js).');
  } else {
    improvements.push('No core technical keywords detected in your resume.');
    suggestions.push('List the programming languages, software, and packages you know. Be specific rather than generic.');
  }

  if (softFound.length >= 3) {
    keywordScore += 15;
    strengths.push('Good incorporation of industry-valued soft skills.');
  } else if (softFound.length >= 1) {
    keywordScore += 10;
    suggestions.push('Incorporate some additional soft skills like "Agile", "Collaboration", "Problem Solving", or "Leadership" to balance technical skills.');
  } else {
    keywordScore += 5;
    improvements.push('No soft skills or professional methodologies detected.');
  }

  const extractedSkills = Array.from(new Set(techFound.concat(softFound)));

  // 4. ACTION VERBS & IMPACT SCORE (Max 25 pts)
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

  if (verbsFound.length >= 6) {
    impactScore += 15;
    strengths.push('Excellent use of action-oriented verbs, showing high initiative.');
  } else if (verbsFound.length >= 3) {
    impactScore += 10;
    strengths.push(`Good action verbs usage (${verbsFound.length} unique verbs).`);
  } else if (verbsFound.length >= 1) {
    impactScore += 5;
    improvements.push('Passive language detected. Your resume uses very few strong action verbs.');
    suggestions.push('Start your experience bullet points with strong action verbs like "Spearheaded", "Optimized", "Designed", or "Automated" instead of "Responsible for".');
  } else {
    improvements.push('No action verbs identified. Resume seems descriptive rather than achievement-oriented.');
  }

  if (numbersFound.length >= 3) {
    impactScore += 10;
    strengths.push('Strong quantification! You included metrics and numbers to back up your achievements.');
  } else if (numbersFound.length >= 1) {
    impactScore += 5;
    suggestions.push('Add more numbers and metrics. Quantifying achievements (e.g., "reduced latency by 15%", "managed 3 projects") helps establish credibility.');
  } else {
    improvements.push('Lacks quantifiable achievements. No metrics, percentages, or numbers found in your bullet points.');
    suggestions.push('Quantify the results of your work. Add details like: % speed increases, % revenue changes, number of users served, or time saved.');
  }

  // 5. SCORE INTEGRATION & CALIBRATION
  const atsScore = Math.round(sectionScore + structureScore + keywordScore + impactScore);

  let resumeScore = atsScore;
  if (atsScore > 0 && atsScore < 50) {
    resumeScore = Math.min(60, Math.round(atsScore + 15));
  } else if (atsScore >= 50 && atsScore < 85) {
    resumeScore = Math.min(88, Math.round(atsScore + 5));
  }

  const feedbackSummary = `Your resume scored ${resumeScore}/100. It contains standard sections like ${sectionsFound.slice(0, 3).join(', ')}. To optimize further for ATS compliance, aim to increase technical keywords (current: ${techFound.length}) and include quantifiable achievements.`;

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
