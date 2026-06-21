const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resumeScore: { type: Number, default: 0 },
  atsScore: { type: Number, default: 0 },
  fileUrl: { type: String },
  extractedSkills: [{ type: String }],
  feedback: { type: String },
  strengths: [{ type: String }],
  improvements: [{ type: String }],
  suggestions: [{ type: String }],
  candidateProfile: { type: String },
  warnings: [{ type: String }],
  highlightedLines: [{
    text: { type: String },
    status: { type: String },
    reason: { type: String }
  }],
  aiFeedback: {
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    suggestions: [{ type: String }],
    missingSkills: [{ type: String }],
    improvementPlan: [{ type: String }]
  },
  learningRoadmap: [{
    week: { type: String },
    topic: { type: String },
    description: { type: String }
  }],
  structureAnalysis: {
    score: { type: Number, default: 0 },
    sections: [{
      name: { type: String },
      found: { type: Boolean },
      score: { type: Number },
      feedback: { type: String }
    }],
    chronologicalAudit: {
      isDescending: { type: Boolean },
      feedback: { type: String }
    },
    contactInfoAudit: {
      hasEmail: { type: Boolean },
      hasPhone: { type: Boolean },
      hasLinkedIn: { type: Boolean },
      hasGitHub: { type: Boolean },
      isAtTop: { type: Boolean },
      feedback: { type: String }
    },
    formattingAudit: {
      hasBulletPoints: { type: Boolean },
      hasTablesColumns: { type: Boolean },
      hasVisualRatings: { type: Boolean },
      feedback: { type: String }
    }
  },
  jdMatch: {
    matchPercentage: { type: Number },
    missingKeywords: [{ type: String }],
    recommendedImprovements: [{ type: String }],
    jobDescriptionText: { type: String }
  }
}, { timestamps: true });

module.exports = mongoose.model('Resume', resumeSchema);
