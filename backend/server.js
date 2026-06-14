const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const resumeRoutes = require('./routes/resume');
const interviewRoutes = require('./routes/interview');

dotenv.config();

const app = express();

// Diagnostic log capture
const debugLogs = [];
const originalError = console.error;
const originalLog = console.log;

console.log = (...args) => {
  debugLogs.push(`[LOG] ${new Date().toISOString()} - ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')}`);
  if (debugLogs.length > 300) debugLogs.shift();
  originalLog.apply(console, args);
};

console.error = (...args) => {
  debugLogs.push(`[ERR] ${new Date().toISOString()} - ${args.map(a => {
    if (a instanceof Error) return a.stack || a.message;
    if (typeof a === 'object') {
      try {
        return JSON.stringify(a);
      } catch (e) {
        return '[Circular Object]';
      }
    }
    return a;
  }).join(' ')}`);
  if (debugLogs.length > 300) debugLogs.shift();
  originalError.apply(console, args);
};

app.get('/api/debug/logs', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send(debugLogs.join('\n'));
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/interview', interviewRoutes);

// Basic route
app.get('/', (req, res) => {
    res.send('CareerForge AI API is running...');
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/careerforgeai')
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });
