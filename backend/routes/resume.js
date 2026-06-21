const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const Resume = require('../models/Resume');
const { authMiddleware } = require('./user');
const ai = require('../utils/ai');

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
  const warnings = [];
  const sectionsFound = [];

  // --- CANDIDATE TYPE AUTO-DETECTION ---
  let experienceSectionText = '';
  const expIndex = lower.indexOf('experience');
  const workIndex = lower.indexOf('work history');
  const empIndex = lower.indexOf('employment');
  
  let startIndex = -1;
  if (expIndex !== -1) startIndex = expIndex;
  else if (workIndex !== -1) startIndex = workIndex;
  else if (empIndex !== -1) startIndex = empIndex;

  if (startIndex !== -1) {
    const headers = ['education', 'skills', 'projects', 'summary', 'certifications', 'awards', 'languages'];
    let endIndex = lower.length;
    headers.forEach(h => {
      const hIndex = lower.indexOf(h, startIndex + 10);
      if (hIndex !== -1 && hIndex < endIndex) {
        endIndex = hIndex;
      }
    });
    experienceSectionText = lower.substring(startIndex, endIndex);
  }

  const expYears = (experienceSectionText.match(/\b(20\d{2}|19\d{2})\b/g) || []).map(Number);
  let expSpan = 0;
  if (expYears.length > 1) {
    const minYear = Math.min(...expYears);
    const maxYear = Math.max(...expYears);
    expSpan = maxYear - minYear;
  }

  const experiencedRegexes = [
    /\b(senior|sr\.|principal|director|architect|manager)\b/i,
    /\blead\s+(engineer|developer|architect|analyst|programmer|specialist|consultant|manager|designer)\b/i,
    /\b(3|4|5|6|7|8|9|10)\+\s*yrs?\b/i,
    /\b(3|4|5|6|7|8|9|10)\+\s*years?\b/i,
    /\b(3|4|5|6|7|8|9|10)\s*yrs?\s+(of\s+)?experience\b/i,
    /\b(3|4|5|6|7|8|9|10)\s*years?\s+(of\s+)?experience\b/i
  ];
  const hasExperiencedTerm = experiencedRegexes.some(rx => rx.test(text));
  const isExperienced = hasExperiencedTerm || expSpan >= 3;
  const candidateProfile = isExperienced ? 'Experienced (3+ years)' : 'Fresher (0-2 years)';

  // --- 1. SECTION COMPLETENESS & CONTACT VERIFICATION ---
  const standardSections = {
    summary: { keywords: ['summary', 'professional summary', 'profile', 'about me'], title: 'Summary' },
    skills: { keywords: ['skills', 'technical skills', 'core competencies', 'expertise'], title: 'Skills' },
    experience: { keywords: ['experience', 'employment history', 'work history', 'professional experience'], title: 'Work Experience' },
    education: { keywords: ['education', 'academic background', 'qualification'], title: 'Education' },
    projects: { keywords: ['projects', 'personal projects', 'academic projects'], title: 'Projects' }
  };

  const sectionsAudit = Object.keys(standardSections).map(key => {
    const sec = standardSections[key];
    const found = sec.keywords.some(k => lower.includes(k));
    if (found) sectionsFound.push(sec.title);
    return {
      name: sec.title,
      found,
      score: found ? 8 : 0,
      feedback: found 
        ? `Standard '${sec.title}' section verified and parsed correctly.` 
        : `Missing '${sec.title}' section header. Real ATS systems will penalize this omission.`
    };
  });

  // Enforce Section Header Strictness
  let nonStandardHeaderCount = 0;
  if (lower.includes('technical qualification')) {
    nonStandardHeaderCount++;
    warnings.push("Non-standard section header 'Technical Qualification' detected. ATS scanners may fail to parse your skills/education. Rename this section to 'Skills' or 'Education'.");
    improvements.push("Uses non-standard section title 'Technical Qualification'.");
  }
  if (lower.includes('academic details') || lower.includes('academic profile')) {
    nonStandardHeaderCount++;
    warnings.push("Non-standard section header 'Academic Details' detected. Rename this section to 'Education'.");
    improvements.push("Uses non-standard section title 'Academic Details'.");
  }

  // Verify Contact Details
  const hasEmail = /@/.test(lower);
  const hasPhone = /\+?\b\d{10,12}\b|\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(lower);
  const hasLinkedIn = lower.includes('linkedin.com');
  const hasGitHub = lower.includes('github.com');

  // Verify placement of Contact details
  let firstHeaderIndex = -1;
  Object.keys(standardSections).forEach(key => {
    const sec = standardSections[key];
    sec.keywords.forEach(k => {
      const idx = lower.indexOf(k);
      if (idx !== -1 && (firstHeaderIndex === -1 || idx < firstHeaderIndex)) {
        firstHeaderIndex = idx;
      }
    });
  });

  let isAtTop = true;
  const emailIndex = lower.indexOf('@');
  if (emailIndex !== -1 && firstHeaderIndex !== -1 && emailIndex > firstHeaderIndex) {
    isAtTop = false;
  }

  let contactFeedback = "Contact information is complete and correctly positioned at the top header.";
  if (!isAtTop) {
    contactFeedback = "Contact details should be placed at the very top of your resume, before any section headers, to ensure parsers can index them.";
    warnings.push("Contact information is positioned below section headers. Real ATS systems require contact info in the top header.");
  } else if (!hasEmail || !hasPhone) {
    contactFeedback = "Incomplete contact details. A professional resume must contain an email and a phone number.";
  } else if (!hasLinkedIn || !hasGitHub) {
    contactFeedback = "Complete base contact details, but missing professional links (LinkedIn or GitHub) which are standard for modern resumes.";
    improvements.push('Contact details found, but missing professional links (LinkedIn or GitHub).');
    suggestions.push('Add your LinkedIn and GitHub links to your contact header.');
  }

  const contactInfoAudit = {
    hasEmail,
    hasPhone,
    hasLinkedIn,
    hasGitHub,
    isAtTop,
    feedback: contactFeedback
  };

  // --- 2. CHRONOLOGICAL DATE AUDIT ---
  let entries = experienceSectionText.split(/(?:[•\*⁃‣]|\n\s*[-–—])+/).map(e => e.trim()).filter(e => e.length > 2);
  if (entries.length <= 1) {
    entries = experienceSectionText.split('\n').map(e => e.trim()).filter(e => e.length > 2);
  }

  const currentYear = new Date().getFullYear();
  const entryYears = entries.map(entry => {
    const years = (entry.match(/\b(20\d{2}|19\d{2})\b/g) || []).map(Number);
    if (entry.includes('present') || entry.includes('current')) {
      years.push(currentYear);
    }
    return years.length > 0 ? Math.max(...years) : null;
  }).filter(y => y !== null);

  let isDescending = true;
  for (let i = 0; i < entryYears.length - 1; i++) {
    if (entryYears[i] < entryYears[i + 1]) {
      isDescending = false;
      break;
    }
  }

  let chronologicalFeedback = "Work history follows the reverse-chronological standard (most recent first).";
  if (entryYears.length > 1) {
    if (!isDescending) {
      chronologicalFeedback = "Work experience dates are not in reverse-chronological order. Real ATS parsers and recruiters expect your most recent experience first.";
      warnings.push("Work experience is not in reverse-chronological order. Ensure your most recent job is listed first.");
      improvements.push("Experience dates are out of chronological order.");
    }
  } else {
    chronologicalFeedback = "Standard chronological structure detected (single or no dates found).";
  }

  const chronologicalAudit = {
    isDescending: entryYears.length > 1 ? isDescending : true,
    feedback: chronologicalFeedback
  };

  // --- 3. LAYOUT & FORMATTING CHECKS ---
  const bulletSymbols = /[•\-*⁃‣○▪▫]/;
  const hasBulletPoints = bulletSymbols.test(text);
  const hasTablesColumns = text.includes('|') || (text.match(/\t{2,}/g) || []).length > 2;
  const hasVisualRatings = /[●○★☆■□]/.test(text) || lower.includes('5/5') || lower.includes('10/10') || /\b\d{2}%\b/.test(text);

  let formattingFeedback = "Layout and formatting conform to single-column, standard ATS-friendly styles.";
  const formattingIssues = [];
  
  if (!hasBulletPoints && (sectionsFound.includes('Projects') || sectionsFound.includes('Work Experience'))) {
    warnings.push("Paragraph format detected instead of list structure. ATS parsers cannot extract details from long paragraphs. Rewrite your experience/projects using short, standard bullet points (•).");
    improvements.push('Experience or Projects sections use paragraph formatting instead of bullet lists.');
    formattingIssues.push("missing bullet points");
  } else if (hasBulletPoints) {
    strengths.push('Clean bullet-point layout detected.');
  }

  if (hasVisualRatings) {
    warnings.push("Avoid visual skill ratings (e.g. stars, circles, progress bars). ATS scanners read them as garbled characters or visual noise.");
    formattingIssues.push("visual rating progress icons/stars");
  }

  if (hasTablesColumns) {
    warnings.push("Potential table structure or vertical separators (|) detected. Tables and complex multi-column layouts confuse older ATS parsers, merging text in the wrong order.");
    formattingIssues.push("tables/columns separator '|' symbols");
  }

  if (formattingIssues.length > 0) {
    formattingFeedback = `Layout flags: ${formattingIssues.join(', ')}. These can cause parser alignment errors.`;
  }

  const formattingAudit = {
    hasBulletPoints,
    hasTablesColumns,
    hasVisualRatings,
    feedback: formattingFeedback
  };

  // Check for "Objective" vs "Summary"
  if (lower.includes('objective')) {
    warnings.push("Career 'Objective' detected. Objective statements are outdated. Replace your objective with a 2-line professional summary reflecting your skills.");
    improvements.push("Resume contains an 'Objective' statement instead of a 'Summary'.");
  }

  // Check for missing project links
  const projectSectionIndex = lower.indexOf('project');
  if (projectSectionIndex !== -1) {
    const projectText = lower.substring(projectSectionIndex);
    const hasProjectLinks = projectText.includes('github.com') || projectText.includes('live') || projectText.includes('demo') || projectText.includes('http') || projectText.includes('↗');
    if (!hasProjectLinks) {
      warnings.push("Missing project repositories or live links. Add GitHub URLs or live demo links (e.g. ↗) to verify your projects.");
      improvements.push('Projects lack verification links (GitHub/Live Demo).');
    }
  }

  // Verify LinkedIn & GitHub link completeness
  if (!hasLinkedIn && !hasGitHub) {
    warnings.push("Missing professional profile links. Modern tech resumes must include active links to LinkedIn and GitHub profiles for recruiter verification.");
    improvements.push("Missing professional profile links (LinkedIn/GitHub).");
  }

  // --- 4. KEYWORD & SKILLS MATCH ---
  const techKeywords = [
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust',
    'html', 'css', 'sql', 'postgresql', 'mongodb', 'mysql', 'redis', 'graphql', 'rest', 'api',
    'react', 'vue', 'angular', 'svelte', 'next.js', 'express', 'node.js', 'django', 'flask',
    'spring boot', 'springboot', 'laravel', 'rails', 'aws', 'docker', 'kubernetes', 'git', 'github', 'gitlab',
    'ci/cd', 'jenkins', 'devops', 'linux', 'cloud', 'serverless', 'microservices', 'firebase',
    'tailwind', 'bootstrap', 'webpack', 'redux', 'npm', 'yarn', 'jquery', 'sass', 'sqlite', 'jdbc'
  ];
  const softKeywords = [
    'leadership', 'communication', 'team', 'collaboration', 'problem solving', 'agile', 'scrum',
    'project management', 'critical thinking', 'adaptability', 'creativity', 'mentoring',
    'time management', 'flexibility', 'organization', 'negotiation', 'oop', 'object oriented'
  ];

  const techFound = techKeywords.filter(k => lower.includes(k));
  const softFound = softKeywords.filter(k => lower.includes(k));
  const extractedSkills = Array.from(new Set(techFound.concat(softFound)));

  // Keyword stuffing check
  const stuffedKeywords = [];
  techKeywords.forEach(k => {
    const escaped = k.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(?<![a-zA-Z0-9])${escaped}(?![a-zA-Z0-9])`, 'gi');
    const matches = (text.match(regex) || []).length;
    if (matches > 5) {
      stuffedKeywords.push(k);
    }
  });

  // Keyword Score calculation
  let keywordScore = 0;
  if (isExperienced) {
    if (techFound.length >= 15) keywordScore += 35;
    else if (techFound.length >= 10) keywordScore += 25;
    else if (techFound.length >= 5) keywordScore += 15;
    else keywordScore += 5;

    if (softFound.length >= 3) keywordScore += 5;
    else keywordScore += 2;
  } else {
    if (techFound.length >= 10) keywordScore += 25;
    else if (techFound.length >= 5) keywordScore += 15;
    else keywordScore += 5;

    if (softFound.length >= 4) keywordScore += 15;
    else if (softFound.length >= 2) keywordScore += 10;
    else keywordScore += 5;
  }

  // --- 5. EDUCATION & CERTIFICATIONS ---
  const hasEducation = sectionsFound.includes('Education');
  let educationScore = 0;
  if (hasEducation) {
    educationScore += 10;
    const hasGPA = /gpa|cgpa|\b\d\.\d{1,2}\b|\b\d{2}%\b/.test(lower);
    if (hasGPA) educationScore += 5;
    
    const hasDegree = /bachelor|master|b\.s|b\.tech|m\.s|m\.tech|b.e|degree/i.test(lower);
    if (hasDegree) educationScore += 5;
  }
  const hasCert = /certification|certifications|certified|nptel|credential/i.test(lower);
  if (hasCert) educationScore += 5;
  educationScore = Math.min(20, educationScore);

  // --- 6. WORK HISTORY / PROJECTS ---
  const hasExperience = sectionsFound.includes('Work Experience');
  const hasProjects = sectionsFound.includes('Projects');
  let projectScore = 0;
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

  if (isExperienced) {
    if (hasExperience) projectScore += 10;
    if (numbersFound.length >= 5) projectScore += 10;
    else if (numbersFound.length >= 3) projectScore += 6;
    else if (numbersFound.length >= 1) projectScore += 3;
    
    if (verbsFound.length >= 8) projectScore += 10;
    else if (verbsFound.length >= 4) projectScore += 6;
    else if (verbsFound.length >= 1) projectScore += 3;
  } else {
    if (hasProjects) projectScore += 10;
    if (techFound.length >= 8) projectScore += 5;
    if (verbsFound.length >= 5) projectScore += 5;
    else if (verbsFound.length >= 2) projectScore += 3;
    if (numbersFound.length >= 3) projectScore += 5;
    else if (numbersFound.length >= 1) projectScore += 2;
  }

  // Section completeness base score
  const sectionScore = sectionsAudit.reduce((acc, s) => acc + s.score, 0);
  const contactScore = (hasEmail ? 3 : 0) + (hasPhone ? 3 : 0) + (hasLinkedIn ? 2 : 0) + (hasGitHub ? 2 : 0);
  const finalSectionScore = Math.min(isExperienced ? 20 : 30, sectionScore + contactScore);

  // Structure Score (Max 10)
  let structureScore = 0;
  if (wordCount >= 400 && wordCount <= 800) structureScore = 10;
  else if (wordCount >= 250 && wordCount < 400) structureScore = 6;
  else if (wordCount > 800 && wordCount <= 1000) structureScore = 6;
  else structureScore = 2;

  const formattingWeight = Math.round(( (25 - nonStandardHeaderCount * 5) / 25) * 6 + (structureScore / 10) * 4);

  // 1. Overall Rating
  let overallScore = 0;
  if (isExperienced) {
    overallScore = Math.round(keywordScore + projectScore + finalSectionScore + formattingWeight);
  } else {
    overallScore = Math.round(keywordScore + finalSectionScore + educationScore + formattingWeight);
  }
  
  let penaltyScore = (nonStandardHeaderCount * 10) + (hasVisualRatings ? 20 : 0) + (!hasBulletPoints ? 15 : 0) + (!isDescending ? 15 : 0) + (hasTablesColumns ? 20 : 0);
  overallScore -= Math.round(penaltyScore * 0.5);
  overallScore = Math.max(0, Math.min(100, overallScore));
  const resumeScore = overallScore;

  // 2. Strict ATS Match
  let strictProjectScore = 0;
  if (hasExperience) strictProjectScore += 10;
  if (numbersFound.length >= 5) strictProjectScore += 10;
  else if (numbersFound.length >= 3) strictProjectScore += 6;
  else if (numbersFound.length >= 1) strictProjectScore += 3;
  
  if (verbsFound.length >= 8) strictProjectScore += 10;
  else if (verbsFound.length >= 4) strictProjectScore += 6;
  else if (verbsFound.length >= 1) strictProjectScore += 3;

  let strictKeywordScore = 0;
  if (techFound.length >= 15) strictKeywordScore += 35;
  else if (techFound.length >= 10) strictKeywordScore += 25;
  else if (techFound.length >= 5) strictKeywordScore += 15;
  else strictKeywordScore += 5;

  if (softFound.length >= 3) strictKeywordScore += 5;
  else strictKeywordScore += 2;

  const strictSectionScore = Math.min(20, sectionScore + contactScore);

  let strictAtsScore = Math.round(strictKeywordScore + strictProjectScore + strictSectionScore + formattingWeight);
  strictAtsScore -= penaltyScore;
  const atsScore = Math.max(0, Math.min(100, strictAtsScore));

  const feedbackSummary = `Your resume parsed profile is classified as: ${candidateProfile}. Overall Rating: ${overallScore}/100, Strict ATS Match: ${atsScore}%. It contains standard sections like ${sectionsFound.slice(0, 3).join(', ')}.`;

  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const highlightedLines = lines.map(line => {
    const lineLower = line.toLowerCase();
    
    // Check contact info
    if (lineLower.includes('@') || lineLower.includes('linkedin.com') || lineLower.includes('github.com')) {
      return { text: line, status: 'strength', reason: 'Verified Contact Info: includes critical communication channels.' };
    }
    
    // Check non-standard headers
    if (lineLower === 'technical qualification') {
      return { text: line, status: 'warning', reason: "Non-standard section header. Rename this section to 'Skills' or 'Education' to pass ATS parsers." };
    }
    if (lineLower === 'academic details' || lineLower === 'academic profile') {
      return { text: line, status: 'warning', reason: "Non-standard section header. Rename this section to 'Education'." };
    }
    
    // Check standard headers
    const standardHeaders = ['education', 'experience', 'work experience', 'skills', 'projects', 'summary', 'certifications'];
    if (standardHeaders.includes(lineLower)) {
      return { text: line, status: 'header', reason: 'Standard Section Header: easily parsed by ATS.' };
    }
    
    // Check weak passive words
    const weakWords = ['assisted', 'helped', 'responsible for', 'worked on', 'participated in', 'tasked with'];
    const foundWeak = weakWords.find(w => lineLower.includes(w));
    if (foundWeak) {
      return { 
        text: line, 
        status: 'weakness', 
        reason: `Passive tone: uses weak phrase '${foundWeak}'. Replace with active verbs showing ownership (e.g. 'Engineered', 'Orchestrated', 'Optimized').` 
      };
    }
    
    // Check metrics
    const numbers = (line.match(/\b\d+(?:%|\s*percent|x|\s*multiplier|\+)?\b/g) || [])
      .filter(n => {
        const val = parseInt(n, 10);
        return val > 0 && val !== 1 && (val < 1900 || val > 2100);
      });
    if (numbers.length > 0) {
      return { text: line, status: 'strength', reason: `Quantified Metric: demonstrates clear impact with numbers (${numbers.join(', ')}).` };
    }
    
    // Check visual skill ratings
    if (/[●○★☆■□]/.test(line) || lineLower.includes('5/5') || lineLower.includes('10/10')) {
      return { text: line, status: 'warning', reason: 'Visual skill rating: ATS scanners read circles/stars/bars as visual noise. Use text-only lists.' };
    }
    
    return { text: line, status: 'neutral', reason: '' };
  });

  // Calculate Structure Score out of 100
  let structureScoreCalculated = 0;
  sectionsAudit.forEach(s => { if (s.found) structureScoreCalculated += 8; });
  if (hasEmail) structureScoreCalculated += 3;
  if (hasPhone) structureScoreCalculated += 3;
  if (hasLinkedIn) structureScoreCalculated += 2;
  if (hasGitHub) structureScoreCalculated += 2;
  if (isAtTop) structureScoreCalculated += 10;
  if (chronologicalAudit.isDescending) structureScoreCalculated += 20;
  else structureScoreCalculated += 5;
  
  let formatScore = 20;
  if (!hasBulletPoints) formatScore -= 5;
  if (hasTablesColumns) formatScore -= 10;
  if (hasVisualRatings) formatScore -= 5;
  formatScore = Math.max(0, formatScore);
  structureScoreCalculated += formatScore;

  const structureAnalysis = {
    score: structureScoreCalculated,
    sections: sectionsAudit,
    chronologicalAudit,
    contactInfoAudit,
    formattingAudit
  };

  return {
    resumeScore,
    atsScore,
    extractedSkills,
    candidateProfile,
    warnings,
    highlightedLines,
    feedback: feedbackSummary,
    strengths: strengths.slice(0, 4),
    improvements: improvements.slice(0, 4),
    suggestions: suggestions.slice(0, 5),
    structureAnalysis
  };
}

router.post('/upload', authMiddleware, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const jobDescription = req.body.jobDescription || null;

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

    // Call unified AI to parse deep metrics
    let aiAnalysis = null;
    try {
      aiAnalysis = await ai.analyzeResume(text, jobDescription);
    } catch (aiErr) {
      console.error('AI resume analysis failed:', aiErr);
      aiAnalysis = {
        strengths: analysis.strengths,
        weaknesses: ['Failed to query AI parser'],
        suggestions: analysis.suggestions,
        missingSkills: ['Redux', 'Next.js'],
        improvementPlan: ['Verify network keys in environment properties'],
        matchPercentage: jobDescription ? 50 : null,
        missingKeywords: jobDescription ? ['Skills'] : [],
        recommendedImprovements: []
      };
    }

    // Generate Personalized Career Coach Roadmap based on missing skills
    let learningRoadmap = [];
    try {
      learningRoadmap = await ai.generateRoadmap(analysis.candidateProfile, aiAnalysis.missingSkills);
    } catch (roadmapErr) {
      console.error('AI roadmap generation failed:', roadmapErr);
    }

    // Strict ATS Match is overwritten by JD match percentage if JD is provided!
    const finalAtsScore = (jobDescription && aiAnalysis.matchPercentage !== null) 
      ? aiAnalysis.matchPercentage 
      : analysis.atsScore;

    const newResume = new Resume({
      userId: req.user.userId,
      resumeScore: analysis.resumeScore,
      atsScore: finalAtsScore,
      extractedSkills: analysis.extractedSkills,
      feedback: analysis.feedback,
      strengths: analysis.strengths,
      improvements: analysis.improvements,
      suggestions: analysis.suggestions,
      candidateProfile: analysis.candidateProfile,
      warnings: analysis.warnings,
      highlightedLines: analysis.highlightedLines,
      aiFeedback: {
        strengths: aiAnalysis.strengths,
        weaknesses: aiAnalysis.weaknesses,
        suggestions: aiAnalysis.suggestions,
        missingSkills: aiAnalysis.missingSkills,
        improvementPlan: aiAnalysis.improvementPlan
      },
      learningRoadmap,
      structureAnalysis: analysis.structureAnalysis,
      jdMatch: {
        matchPercentage: aiAnalysis.matchPercentage,
        missingKeywords: aiAnalysis.missingKeywords,
        recommendedImprovements: aiAnalysis.recommendedImprovements,
        jobDescriptionText: jobDescription || ''
      }
    });

    await newResume.save();

    // Prepare response result matching the schema structure
    const mergedResult = {
      ...analysis,
      atsScore: finalAtsScore,
      aiFeedback: aiAnalysis,
      learningRoadmap,
      jdMatch: {
        matchPercentage: aiAnalysis.matchPercentage,
        missingKeywords: aiAnalysis.missingKeywords,
        recommendedImprovements: aiAnalysis.recommendedImprovements,
        jobDescriptionText: jobDescription || ''
      }
    };

    res.json({ message: 'Resume analyzed successfully with AI features', result: mergedResult });
  } catch (error) {
    console.error('Resume Analysis Error:', error);
    res.status(500).json({ message: 'Failed to analyze resume' });
  }
});

module.exports = router;
