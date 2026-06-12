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
  suggestions: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Resume', resumeSchema);
