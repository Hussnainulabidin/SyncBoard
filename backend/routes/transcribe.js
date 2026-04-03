// routes/transcribe.js
const express = require('express');
const router = express.Router();
const { transcribeAudio, formatSegments } = require('../services/whisperService');
const assemblyService = require('../services/assemblyService');
const fs = require('fs');
const path = require('path');

router.post('/', async (req, res) => {
  try {
    const { filePath, fileId, useDiarization = true } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    // Verify file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found. It may have been deleted or moved.' });
    }

    // Check file size - reject empty files
    const fileStats = fs.statSync(filePath);
    if (fileStats.size === 0) {
      return res.status(400).json({
        error: 'Empty audio file',
        message: 'The uploaded file is empty (0 bytes). Please upload a valid audio file.'
      });
    }

    // If file is too small (< 1KB), it's likely corrupted
    if (fileStats.size < 1024) {
      return res.status(400).json({
        error: 'Invalid audio file',
        message: 'The uploaded file is too small to contain valid audio data. Please check your file and try again.'
      });
    }

    console.log(`[Transcribe] Starting transcription for: ${filePath}`);

    let result;
    let provider;

    // Try AssemblyAI first (for speaker diarization), fallback to Whisper
    if (useDiarization && assemblyService.isConfigured()) {
      try {
        console.log('[Transcribe] Using AssemblyAI (speaker diarization enabled)');
        result = await assemblyService.transcribeWithDiarization(filePath);
        provider = 'assemblyai';
      } catch (assemblyError) {
        console.warn('[Transcribe] AssemblyAI failed, falling back to Whisper:', assemblyError.message);
        // Fallback to Whisper
        result = await transcribeAudio(filePath);
        result.segments = formatSegments(result.segments);
        provider = 'azure-whisper-fallback';
      }
    } else {
      console.log('[Transcribe] Using Azure Whisper');
      result = await transcribeAudio(filePath);
      result.segments = formatSegments(result.segments);
      provider = 'azure-whisper';
    }

    // Validate transcription result
    if (!result.text || result.text.trim().length === 0) {
      return res.status(422).json({
        error: 'No speech detected',
        message: 'The audio file was processed but no speech was detected. Please ensure the file contains clear spoken audio.'
      });
    }

    res.json({
      success: true,
      transcription: {
        id: fileId || Date.now().toString(),
        text: result.text,
        segments: result.segments || [],
        language: result.language,
        duration: result.duration,
        processingTime: result.processingTime,
        estimatedCost: result.estimatedCost,
        provider: provider,
        speakerCount: result.speakerCount || null,
        hasSpeakerLabels: provider === 'assemblyai'
      }
    });
  } catch (error) {
    console.error('[Transcribe] Error:', error);

    // Provide user-friendly error messages
    let userMessage = 'Transcription failed. Please try again.';
    if (error.message.includes('rate limit')) {
      userMessage = 'API rate limit reached. Please wait a minute and try again.';
    } else if (error.message.includes('timeout')) {
      userMessage = 'Transcription timed out. Try a shorter audio file.';
    } else if (error.message.includes('format') || error.message.includes('codec')) {
      userMessage = 'Unsupported audio format. Please use MP3, WAV, MP4, or WebM.';
    }

    res.status(500).json({
      error: 'Transcription failed',
      message: userMessage
    });
  }
});

// Get transcription status (for async processing)
router.get('/status/:id', (req, res) => {
  res.json({
    id: req.params.id,
    status: 'not_implemented',
    message: 'Transcription is processed synchronously in MVP'
  });
});

module.exports = router;
