const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

// Import routes
const uploadRoutes = require('./routes/upload');
const transcribeRoutes = require('./routes/transcribe');
const analyzeRoutes = require('./routes/analyze');
const trelloRoutes = require('./routes/trello');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'video/mp4', 'audio/webm'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only MP3, WAV, MP4, and WebM are allowed.'));
    }
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0-mvp'
  });
});

// Routes
app.use('/api/upload', upload.single('audio'), uploadRoutes);
app.use('/api/transcribe', transcribeRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/trello', trelloRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'Maximum file size is 500MB. Please compress or trim your recording.'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Unexpected file field',
        message: 'Please upload using the correct file input.'
      });
    }
    return res.status(400).json({ error: err.message });
  }

  // Handle file type validation errors from multer fileFilter
  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({
      error: 'Invalid file type',
      message: 'Only audio and video files are accepted: MP3, WAV, MP4, WebM. Please upload a supported file format.'
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong. Please try again.'
  });
});

// Create uploads directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                    SYNCBOARD MVP SERVER                    ║
╠═══════════════════════════════════════════════════════════╣
║  Status:  Running                                          ║
║  Port:    ${PORT}                                             ║
║  Mode:    ${process.env.NODE_ENV || 'development'}                                    ║
║                                                            ║
║  Endpoints:                                                ║
║    POST /api/upload      - Upload meeting recording        ║
║    POST /api/transcribe  - Transcribe audio                ║
║    POST /api/analyze     - Extract action items            ║
║    POST /api/trello      - Create Trello cards             ║
║                                                            ║
║  Health: GET /api/health                                   ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
