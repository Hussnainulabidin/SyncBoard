import React, { useState } from 'react';
import './TranscriptViewer.css';

function TranscriptViewer({ transcript }) {
  const [viewMode, setViewMode] = useState('full'); // 'full', 'segments', or 'speakers'

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const hasSpeakerLabels = transcript.hasSpeakerLabels || false;
  const speakerCount = transcript.speakerCount || 0;

  return (
    <div className="transcript-viewer">
      <div className="transcript-header">
        <h2>Meeting Transcript</h2>
        <div className="transcript-meta">
          <span className="meta-item">
            Duration: {formatDuration(transcript.duration)}
          </span>
          <span className="meta-item">
            Language: {transcript.language?.toUpperCase() || 'EN'}
          </span>
          <span className="meta-item">
            Cost: ${transcript.estimatedCost}
          </span>
          {hasSpeakerLabels && (
            <span className="meta-item speaker-badge">
              {speakerCount} Speakers Detected
            </span>
          )}
          <span className="meta-item provider-badge">
            {transcript.provider === 'assemblyai' ? 'AssemblyAI' : 'Azure Whisper'}
          </span>
        </div>
      </div>

      <div className="view-toggle">
        <button
          className={viewMode === 'full' ? 'active' : ''}
          onClick={() => setViewMode('full')}
        >
          Full Text
        </button>
        {hasSpeakerLabels && (
          <button
            className={viewMode === 'speakers' ? 'active' : ''}
            onClick={() => setViewMode('speakers')}
          >
            By Speaker
          </button>
        )}
        <button
          className={viewMode === 'segments' ? 'active' : ''}
          onClick={() => setViewMode('segments')}
        >
          With Timestamps
        </button>
      </div>

      <div className="transcript-content">
        {viewMode === 'full' ? (
          <div className="full-text">
            {transcript.text}
          </div>
        ) : viewMode === 'speakers' ? (
          <div className="segments-list speaker-view">
            {transcript.segments.map((seg, index) => (
              <div key={index} className="segment speaker-segment">
                <div className="segment-speaker-row">
                  <span className="speaker-label">{seg.speaker || 'Unknown'}</span>
                  <span className="segment-time">{seg.start}</span>
                </div>
                <span className="segment-text">{seg.text}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="segments-list">
            {transcript.segments.map((seg, index) => (
              <div key={index} className="segment">
                <span className="segment-time">
                  {seg.start}
                </span>
                {seg.speaker && (
                  <span className="speaker-inline">{seg.speaker}</span>
                )}
                <span className="segment-text">
                  {seg.text}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="transcript-stats">
        <div className="stat">
          <span className="stat-value">{transcript.text.split(/\s+/).length}</span>
          <span className="stat-label">Words</span>
        </div>
        <div className="stat">
          <span className="stat-value">{transcript.segments?.length || 0}</span>
          <span className="stat-label">Segments</span>
        </div>
        {hasSpeakerLabels && (
          <div className="stat">
            <span className="stat-value">{speakerCount}</span>
            <span className="stat-label">Speakers</span>
          </div>
        )}
        <div className="stat">
          <span className="stat-value">{transcript.processingTime?.toFixed(1)}s</span>
          <span className="stat-label">Processing Time</span>
        </div>
      </div>
    </div>
  );
}

export default TranscriptViewer;
