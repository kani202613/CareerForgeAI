const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, required: true },
  score: { type: Number, default: 0 },
  feedback: { type: String },
  transcript: [{ role: String, content: String }],
  fillerWordsCount: { type: Number, default: 0 },
  averageWordCount: { type: Number, default: 0 },
  clarityGrade: { type: String, default: 'B' }
}, { timestamps: true });

module.exports = mongoose.model('InterviewResult', interviewSchema);
