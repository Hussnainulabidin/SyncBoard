const axios = require('axios');
const fs = require('fs');

const ASSEMBLY_API_URL = 'https://api.assemblyai.com/v2';
const API_KEY = process.env.ASSEMBLYAI_API_KEY;

/**
 * Transcribe audio with speaker diarization using AssemblyAI
 * @param {string} filePath - Path to the audio file
 * @returns {Promise<Object>} Transcription with speaker labels
 */
async function transcribeWithDiarization(filePath) {
  if (!API_KEY || API_KEY === 'your-assemblyai-key-here') {
    throw new Error('AssemblyAI API key not configured');
  }

  try {
    console.log(`[AssemblyAI] Starting transcription with speaker diarization for: ${filePath}`);
    const startTime = Date.now();

    // Step 1: Upload file to AssemblyAI
    console.log('[AssemblyAI] Uploading audio file...');
    const audioData = fs.readFileSync(filePath);

    const uploadRes = await axios.post(`${ASSEMBLY_API_URL}/upload`, audioData, {
      headers: {
        authorization: API_KEY,
        'content-type': 'application/octet-stream',
        'transfer-encoding': 'chunked'
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    const audioUrl = uploadRes.data.upload_url;
    console.log('[AssemblyAI] File uploaded successfully');

    // Step 2: Request transcription with speaker diarization
    console.log('[AssemblyAI] Starting transcription with speaker labels...');
    const transcriptRes = await axios.post(`${ASSEMBLY_API_URL}/transcript`, {
      audio_url: audioUrl,
      speaker_labels: true,
      language_code: 'en',
      speech_models: ['universal-2']
    }, {
      headers: {
        authorization: API_KEY,
        'Content-Type': 'application/json'
      }
    });

    const transcriptId = transcriptRes.data.id;
    console.log(`[AssemblyAI] Transcript ID: ${transcriptId}`);

    // Step 3: Poll for completion
    let result;
    let pollCount = 0;
    const maxPolls = 120; // 10 minutes max (5s intervals)

    while (pollCount < maxPolls) {
      const pollRes = await axios.get(`${ASSEMBLY_API_URL}/transcript/${transcriptId}`, {
        headers: { authorization: API_KEY }
      });

      result = pollRes.data;

      if (result.status === 'completed') {
        console.log('[AssemblyAI] Transcription completed!');
        break;
      } else if (result.status === 'error') {
        throw new Error(`Transcription failed: ${result.error}`);
      }

      console.log(`[AssemblyAI] Status: ${result.status} (poll ${pollCount + 1})...`);
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      pollCount++;
    }

    if (pollCount >= maxPolls) {
      throw new Error('Transcription timed out after 10 minutes');
    }

    const duration = (Date.now() - startTime) / 1000;
    console.log(`[AssemblyAI] Total processing time: ${duration.toFixed(2)}s`);

    // Step 4: Format utterances with speaker labels
    const utterances = result.utterances || [];
    const formattedText = formatWithSpeakers(utterances);
    const segments = formatUtteranceSegments(utterances);

    // Calculate cost estimate (AssemblyAI: ~$0.00025/second)
    const audioDuration = result.audio_duration || 0;
    const estimatedCost = audioDuration * 0.00025;

    return {
      success: true,
      text: formattedText,
      segments: segments,
      utterances: utterances,
      language: result.language_code || 'en',
      duration: audioDuration,
      processingTime: duration,
      estimatedCost: estimatedCost.toFixed(4),
      speakerCount: countSpeakers(utterances),
      provider: 'assemblyai'
    };
  } catch (error) {
    if (error.response) {
      console.error('[AssemblyAI] API error response:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('[AssemblyAI] Error:', error.message);
    throw new Error(`AssemblyAI transcription failed: ${error.message}`);
  }
}

/**
 * Format utterances with speaker labels into readable text
 */
function formatWithSpeakers(utterances) {
  if (!utterances || utterances.length === 0) return '';

  return utterances.map(u => {
    return `Speaker ${u.speaker}: ${u.text}`;
  }).join('\n\n');
}

/**
 * Format utterances into segments with timestamps and speaker info
 */
function formatUtteranceSegments(utterances) {
  if (!utterances || utterances.length === 0) return [];

  return utterances.map(u => ({
    start: formatTime(u.start / 1000), // Convert ms to seconds
    end: formatTime(u.end / 1000),
    text: u.text.trim(),
    speaker: `Speaker ${u.speaker}`,
    startSeconds: u.start / 1000,
    endSeconds: u.end / 1000,
    confidence: u.confidence
  }));
}

/**
 * Count unique speakers
 */
function countSpeakers(utterances) {
  if (!utterances || utterances.length === 0) return 0;
  const speakers = new Set(utterances.map(u => u.speaker));
  return speakers.size;
}

/**
 * Convert seconds to MM:SS format
 */
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Check if AssemblyAI is configured
 */
function isConfigured() {
  return API_KEY && API_KEY !== 'your-assemblyai-key-here';
}

module.exports = {
  transcribeWithDiarization,
  isConfigured
};
