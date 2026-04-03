// routes/upload.js
const express = require('express');
const router = express.Router();
const path = require('path');

router.post('/', (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const fileInfo = {
      id: Date.now().toString(),
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedAt: new Date().toISOString()
    };
    
    console.log(`[Upload] File received: ${fileInfo.originalName} (${(fileInfo.size / 1024 / 1024).toFixed(2)} MB)`);
    
    res.json({
      success: true,
      file: fileInfo,
      message: 'File uploaded successfully. Ready for transcription.'
    });
  } catch (error) {
    console.error('[Upload] Error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

module.exports = router;
