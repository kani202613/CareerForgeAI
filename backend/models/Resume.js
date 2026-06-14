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
  }]
}, { timestamps: true });

module.exports = mongoose.model('Resume', resumeSchema);
