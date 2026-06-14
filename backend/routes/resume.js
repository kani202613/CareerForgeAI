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
  const warnings = [];
  const sectionsFound = [];

  // --- CANDIDATE TYPE AUTO-DETECTION ---
  // Find years specifically in the "Experience" section to avoid counting school graduation years
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

  const expYears = (experienceSectionText.match(/\b(20\d{2})\b/g) || []).map(Number);
  let expSpan = 0;
  if (expYears.length > 1) {
    const minYear = Math.min(...expYears);
    const maxYear = Math.max(...expYears);
    expSpan = maxYear - minYear;
  }

  // Match experienced terms as whole words or specific phrase patterns to avoid false positives (e.g. "lead" matching "leadership" or verb "lead")
  const experiencedRegexes = [
    /\b(senior|sr\.|principal|director|architect|manager)\b/i,
    /\blead\s+(engineer|developer|architect|analyst|programmer|specialist|consultant|manager|designer)\b/i,
    /\b(3|4|5|6|7|8|9|10)\+\s*yrs?\b/i,
    /\b(3|4|5|6|7|8|9|10)\+\s*years?\b/i,
    /\b(3|4|5|6|7|8|9|10)\s*yrs?\s+(of\s+)?experience\b/i,
    /\b(3|4|5|6|7|8|9|10)\s*years?\s+(of\s+)?experience\b/i
  ];
  const hasExperiencedTerm = experiencedRegexes.some(rx => rx.test(text));
  
  // A candidate is experienced only if they have explicit senior terms or have a work history span of >= 3 years
  const isExperienced = hasExperiencedTerm || expSpan >= 3;
  const candidateProfile = isExperienced ? 'Experienced (3+ years)' : 'Fresher (0-2 years)';

  // --- 1. SECTION COMPLETENESS & CONTACT VERIFICATION ---
  let sectionScore = 0;
  
  const standardSections = {
    education: { keywords: ['education', 'academic background', 'qualification'], title: 'Education' },
    experience: { keywords: ['experience', 'employment history', 'work history', 'professional experience'], title: 'Work Experience' },
    skills: { keywords: ['skills', 'technical skills', 'core competencies', 'expertise'], title: 'Skills' },
    projects: { keywords: ['projects', 'personal projects', 'academic projects'], title: 'Projects' },
    summary: { keywords: ['summary', 'professional summary', 'profile', 'about me'], title: 'Summary' }
  };

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
  
  let contactScore = 0;
  if (hasEmail && hasPhone) {
    contactScore += 3;
    sectionsFound.push('Contact Information');
    if (hasLinkedIn || hasGitHub) {
      contactScore += 2;
      strengths.push('Complete contact information with profile links (LinkedIn/GitHub) detected.');
    } else {
      improvements.push('Contact details found, but missing professional links (LinkedIn or GitHub).');
      suggestions.push('Add your LinkedIn and GitHub links to your contact header.');
    }
  } else {
    improvements.push('Incomplete contact details. Ensure your email and phone number are clearly visible.');
    suggestions.push('Add an email, phone number, and LinkedIn profile link at the top of your resume.');
  }

  // Verify Standard sections
  const hasEducation = standardSections.education.keywords.some(k => lower.includes(k));
  const hasExperience = standardSections.experience.keywords.some(k => lower.includes(k));
  const hasSkills = standardSections.skills.keywords.some(k => lower.includes(k));
  const hasProjects = standardSections.projects.keywords.some(k => lower.includes(k));

  if (hasEducation) {
    sectionScore += 5;
    sectionsFound.push('Education');
  }
  if (hasExperience) {
    sectionScore += 5;
    sectionsFound.push('Work Experience');
  }
  if (hasSkills) {
    sectionScore += 5;
    sectionsFound.push('Skills');
  }
  if (hasProjects) {
    sectionScore += 5;
    sectionsFound.push('Projects');
  }

  // --- 2. LAYOUT & FORMATTING CHECKS ---
  let formattingScore = 25;
  let penaltyScore = 0;

  // Check for bullet points in the Projects/Experience sections
  const bulletSymbols = /[•\-*⁃‣○▪▫]/;
  const hasBulletPoints = bulletSymbols.test(text);
  if (!hasBulletPoints && (hasProjects || hasExperience)) {
    formattingScore -= 10;
    penaltyScore += 15;
    warnings.push("Paragraph format detected instead of list structure. ATS parsers cannot extract details from long paragraphs. Rewrite your experience/projects using short, standard bullet points (•).");
    improvements.push('Experience or Projects sections use paragraph formatting instead of bullet lists.');
  } else {
    strengths.push('Clean bullet-point layout detected.');
  }

  // Check for "Objective" vs "Summary"
  if (lower.includes('objective')) {
    formattingScore -= 5;
    penaltyScore += 10;
    warnings.push("Career 'Objective' detected. Objective statements are outdated. Replace your objective with a 2-line targeted Professional Summary reflecting your skills.");
    improvements.push("Resume contains an 'Objective' statement instead of a 'Summary'.");
  }

  // Check for missing project links
  const projectSectionIndex = lower.indexOf('project');
  if (projectSectionIndex !== -1) {
    const projectText = lower.substring(projectSectionIndex);
    const hasProjectLinks = projectText.includes('github.com') || projectText.includes('live') || projectText.includes('demo') || projectText.includes('http') || projectText.includes('↗');
    if (!hasProjectLinks) {
      formattingScore -= 5;
      penaltyScore += 10;
      warnings.push("Missing project repositories or live links. Add GitHub URLs or live demo links (e.g. ↗) to verify your projects.");
      improvements.push('Projects lack verification links (GitHub/Live Demo).');
    }
  }

  // Verify LinkedIn & GitHub link completeness
  if (!hasLinkedIn && !hasGitHub) {
    penaltyScore += 10;
    warnings.push("Missing professional profile links. Modern tech resumes must include active links to LinkedIn and GitHub profiles for recruiter verification.");
    improvements.push("Missing professional profile links (LinkedIn/GitHub).");
  }

  // Apply non-standard headers penalty
  formattingScore -= (nonStandardHeaderCount * 5);
  formattingScore = Math.max(0, formattingScore);
  penaltyScore += (nonStandardHeaderCount * 10);

  // Formatting warnings (visual noise, tables, unreadable dates) with strict scoring penalties
  if (/[●○★☆■□]/.test(text) || lower.includes('5/5') || lower.includes('10/10') || /\b\d{2}%\b/.test(text)) {
    warnings.push("Avoid visual skill ratings (e.g. stars, circles, progress bars). ATS scanners read them as garbled characters or visual noise.");
    penaltyScore += 20;
  }

  if (/\b(spring|summer|fall|winter|autumn)\s+\d{4}\b/i.test(text)) {
    warnings.push("Seasonal dates (e.g. 'Spring 2022') detected. ATS systems cannot calculate work duration from seasons. Use standard month/year format (e.g. '04/2022' or 'April 2022').");
    penaltyScore += 15;
  }

  if (text.includes('|') || (text.match(/\t{2,}/g) || []).length > 2) {
    warnings.push("Potential table structure or vertical separators (|) detected. Tables and complex multi-column layouts confuse older ATS parsers, merging text in the wrong order.");
    penaltyScore += 20;
  }

  // --- 3. KEYWORD & SKILLS MATCH ---
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
  if (stuffedKeywords.length > 0) {
    formattingScore -= Math.min(15, stuffedKeywords.length * 5);
    penaltyScore += Math.min(25, stuffedKeywords.length * 10);
    warnings.push(`Keyword stuffing detected for terms: ${stuffedKeywords.join(', ')}. Repeating keywords excessively to cheat filters is penalized by modern ATS scanners.`);
  }

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

  // --- 4. EDUCATION & CERTIFICATIONS ---
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

  // --- 5. WORK HISTORY / PROJECTS ---
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
  const finalSectionScore = Math.min(isExperienced ? 20 : 30, sectionScore + contactScore);

  // Structure Score (Max 10)
  let structureScore = 0;
  if (wordCount >= 400 && wordCount <= 800) structureScore = 10;
  else if (wordCount >= 250 && wordCount < 400) structureScore = 6;
  else if (wordCount > 800 && wordCount <= 1000) structureScore = 6;
  else structureScore = 2;

  // --- FINAL SCORE INTEGRATION (STRICT & HONEST) ---
  let atsScore = 0;
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
    
    // Check metrics (numbers excluding years)
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

  const formattingWeight = Math.round((formattingScore / 25) * 6 + (structureScore / 10) * 4);

  // 1. Overall Rating (Role-appropriate score based on candidate profile)
  let overallScore = 0;
  if (isExperienced) {
    overallScore = Math.round(keywordScore + projectScore + finalSectionScore + formattingWeight);
  } else {
    overallScore = Math.round(keywordScore + finalSectionScore + educationScore + formattingWeight);
  }
  
  // Overall rating is slightly more forgiving of structural layout penalties
  overallScore -= Math.round(penaltyScore * 0.5);
  overallScore = Math.max(0, Math.min(100, overallScore));
  const resumeScore = overallScore;

  // 2. Strict ATS Match (Absolute corporate ATS standard - no fresher discounts)
  // Enterprise ATS scanners score all resumes on the same absolute scale of keyword density, work history metrics, and formatting compliance.
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
  atsScore = Math.max(0, Math.min(100, strictAtsScore));

  const feedbackSummary = `Your resume parsed profile is classified as: ${candidateProfile}. Overall Rating: ${overallScore}/100, Strict ATS Match: ${atsScore}%. It contains standard sections like ${sectionsFound.slice(0, 3).join(', ')}.`;

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
      suggestions: analysis.suggestions,
      candidateProfile: analysis.candidateProfile,
      warnings: analysis.warnings,
      highlightedLines: analysis.highlightedLines
    });

    await newResume.save();
    res.json({ message: 'Resume analyzed successfully (free ATS mode)', result: analysis });
  } catch (error) {
    console.error('Resume Analysis Error:', error);
    res.status(500).json({ message: 'Failed to analyze resume' });
  }
});

module.exports = router;
