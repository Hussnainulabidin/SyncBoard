const { AzureOpenAI } = require('openai');
const fs = require('fs');

// Azure OpenAI client for Whisper
const client = new AzureOpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview'
});

const WHISPER_DEPLOYMENT = process.env.AZURE_OPENAI_WHISPER_DEPLOYMENT || 'whisper-1';

/**
 * Transcribe audio file using Azure OpenAI Whisper
 * @param {string} filePath - Path to the audio file
 * @returns {Promise<Object>} Transcription result with text and segments
 */
async function transcribeAudio(filePath) {
  try {
    console.log(`[Azure Whisper] Starting transcription for: ${filePath}`);
    const startTime = Date.now();
    
    // Read the file
    const audioFile = fs.createReadStream(filePath);
    
    // Call Azure OpenAI Whisper API
    const response = await client.audio.transcriptions.create({
      file: audioFile,
      model: WHISPER_DEPLOYMENT,  // Your deployment name in Azure
      response_format: 'verbose_json',
      timestamp_granularities: ['segment']
    });
    
    const duration = (Date.now() - startTime) / 1000;
    console.log(`[Azure Whisper] Transcription completed in ${duration.toFixed(2)}s`);
    
    // Calculate estimated cost
    const audioDuration = response.duration || 0;
    const estimatedCost = (audioDuration / 60) * 0.006;
    
    return {
      success: true,
      text: response.text,
      segments: response.segments || [],
      language: response.language,
      duration: audioDuration,
      processingTime: duration,
      estimatedCost: estimatedCost.toFixed(4),
      provider: 'azure-openai'
    };
  } catch (error) {
    console.error('[Azure Whisper] Transcription error:', error);
    throw new Error(`Transcription failed: ${error.message}`);
  }
}

/**
 * Format segments with timestamps for display
 * @param {Array} segments - Whisper segments
 * @returns {Array} Formatted segments
 */
function formatSegments(segments) {
  return segments.map(seg => ({
    start: formatTime(seg.start),
    end: formatTime(seg.end),
    text: seg.text.trim(),
    startSeconds: seg.start,
    endSeconds: seg.end
  }));
}

/**
 * Convert seconds to MM:SS format
 * @param {number} seconds 
 * @returns {string}
 */
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

module.exports = {
  transcribeAudio,
  formatSegments
};
