import React, { useState, useCallback } from 'react';
import FileUpload from './components/FileUpload';
import TranscriptViewer from './components/TranscriptViewer';
import TicketReview from './components/TicketReview';
import TrelloConfig from './components/TrelloConfig';
import './App.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Processing stages
const STAGES = {
  UPLOAD: 'upload',
  TRANSCRIBING: 'transcribing',
  TRANSCRIPT_REVIEW: 'transcript_review',
  ANALYZING: 'analyzing',
  TICKET_REVIEW: 'ticket_review',
  PUBLISHING: 'publishing',
  COMPLETE: 'complete'
};

function App() {
  const [stage, setStage] = useState(STAGES.UPLOAD);
  const [file, setFile] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [trelloConfig, setTrelloConfig] = useState(null);
  const [publishResults, setPublishResults] = useState(null);

  // Handle file upload
  const handleFileUpload = useCallback(async (uploadedFile) => {
    setError(null);
    setFile(uploadedFile);
    setStage(STAGES.TRANSCRIBING);

    try {
      // Upload file
      const formData = new FormData();
      formData.append('audio', uploadedFile);

      const uploadRes = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || 'Upload failed. Please check your file and try again.');
      }
      const uploadData = await uploadRes.json();

      // Transcribe
      const transcribeRes = await fetch(`${API_BASE}/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: uploadData.file.path,
          fileId: uploadData.file.id
        })
      });

      if (!transcribeRes.ok) {
        const errData = await transcribeRes.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || 'Transcription failed. Please try again with a different file.');
      }
      const transcribeData = await transcribeRes.json();

      setTranscript(transcribeData.transcription);
      setStage(STAGES.TRANSCRIPT_REVIEW);
    } catch (err) {
      setError(err.message);
      setStage(STAGES.UPLOAD);
    }
  }, []);

  // Proceed to analysis
  const handleAnalyze = useCallback(async () => {
    setError(null);
    setStage(STAGES.ANALYZING);

    try {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcript.text,
          options: { includeUserStories: true }
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || 'Analysis failed. Please try again.');
      }
      const data = await res.json();

      if (!data.tickets || data.tickets.length === 0) {
        setError('No action items were found in this transcript. This could mean the meeting did not contain clear tasks, assignments, or deadlines. Try a recording with more explicit action items.');
        setStage(STAGES.TRANSCRIPT_REVIEW);
        return;
      }

      // Count low confidence tickets
      const lowConfidenceCount = data.tickets.filter(t => t.confidence && t.confidence < 0.7).length;
      if (lowConfidenceCount > 0) {
        setError(`${lowConfidenceCount} ticket(s) have low confidence scores. Please review them carefully before publishing.`);
      }

      setTickets(data.tickets);
      setStats(data.stats);
      setStage(STAGES.TICKET_REVIEW);
    } catch (err) {
      setError(err.message);
      setStage(STAGES.TRANSCRIPT_REVIEW);
    }
  }, [transcript]);

  // Update a ticket
  const handleTicketUpdate = useCallback((ticketId, updates) => {
    setTickets(prev => prev.map(t => 
      t.id === ticketId ? { ...t, ...updates } : t
    ));
  }, []);

  // Remove a ticket
  const handleTicketRemove = useCallback((ticketId) => {
    setTickets(prev => prev.filter(t => t.id !== ticketId));
  }, []);

  // Publish to Trello
  const handlePublish = useCallback(async () => {
    if (!trelloConfig?.listId) {
      setError('Please select a Trello board and list');
      return;
    }

    setError(null);
    setStage(STAGES.PUBLISHING);

    const approvedTickets = tickets.filter(t => t.status !== 'rejected');

    try {
      const res = await fetch(`${API_BASE}/trello/cards/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tickets: approvedTickets,
          listId: trelloConfig.listId,
          boardId: trelloConfig.boardId
        })
      });

      if (!res.ok) throw new Error('Publishing failed');
      const data = await res.json();

      setPublishResults(data.results);
      setStage(STAGES.COMPLETE);
    } catch (err) {
      setError(err.message);
      setStage(STAGES.TICKET_REVIEW);
    }
  }, [tickets, trelloConfig]);

  // Reset to start
  const handleReset = useCallback(() => {
    setStage(STAGES.UPLOAD);
    setFile(null);
    setTranscript(null);
    setTickets([]);
    setStats(null);
    setError(null);
    setPublishResults(null);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>🔄 SyncBoard</h1>
        <p className="tagline">Meeting → Tickets in 60 seconds</p>
      </header>

      {/* Progress indicator */}
      <div className="progress-bar">
        <div className={`step ${stage === STAGES.UPLOAD ? 'active' : ''} ${[STAGES.TRANSCRIBING, STAGES.TRANSCRIPT_REVIEW, STAGES.ANALYZING, STAGES.TICKET_REVIEW, STAGES.PUBLISHING, STAGES.COMPLETE].includes(stage) ? 'done' : ''}`}>
          <span className="step-number">1</span>
          <span className="step-label">Upload</span>
        </div>
        <div className={`step ${[STAGES.TRANSCRIBING, STAGES.TRANSCRIPT_REVIEW].includes(stage) ? 'active' : ''} ${[STAGES.ANALYZING, STAGES.TICKET_REVIEW, STAGES.PUBLISHING, STAGES.COMPLETE].includes(stage) ? 'done' : ''}`}>
          <span className="step-number">2</span>
          <span className="step-label">Transcribe</span>
        </div>
        <div className={`step ${[STAGES.ANALYZING, STAGES.TICKET_REVIEW].includes(stage) ? 'active' : ''} ${[STAGES.PUBLISHING, STAGES.COMPLETE].includes(stage) ? 'done' : ''}`}>
          <span className="step-number">3</span>
          <span className="step-label">Extract</span>
        </div>
        <div className={`step ${[STAGES.PUBLISHING, STAGES.COMPLETE].includes(stage) ? 'active' : ''} ${stage === STAGES.COMPLETE ? 'done' : ''}`}>
          <span className="step-number">4</span>
          <span className="step-label">Publish</span>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Main content */}
      <main className="app-content">
        {stage === STAGES.UPLOAD && (
          <FileUpload onUpload={handleFileUpload} />
        )}

        {stage === STAGES.TRANSCRIBING && (
          <div className="loading-state">
            <div className="spinner"></div>
            <h2>Transcribing your meeting...</h2>
            <p>This may take a few minutes for longer recordings.</p>
          </div>
        )}

        {stage === STAGES.TRANSCRIPT_REVIEW && transcript && (
          <div className="section">
            <TranscriptViewer transcript={transcript} />
            <div className="action-buttons">
              <button className="btn-secondary" onClick={handleReset}>
                Start Over
              </button>
              <button className="btn-primary" onClick={handleAnalyze}>
                Extract Action Items →
              </button>
            </div>
          </div>
        )}

        {stage === STAGES.ANALYZING && (
          <div className="loading-state">
            <div className="spinner"></div>
            <h2>Extracting action items...</h2>
            <p>AI is analyzing your transcript for tasks and commitments.</p>
          </div>
        )}

        {stage === STAGES.TICKET_REVIEW && (
          <div className="section">
            <TicketReview
              tickets={tickets}
              stats={stats}
              onUpdate={handleTicketUpdate}
              onRemove={handleTicketRemove}
            />
            <TrelloConfig
              onConfigChange={setTrelloConfig}
              apiBase={API_BASE}
            />
            <div className="action-buttons">
              <button className="btn-secondary" onClick={() => setStage(STAGES.TRANSCRIPT_REVIEW)}>
                ← Back to Transcript
              </button>
              <button 
                className="btn-primary" 
                onClick={handlePublish}
                disabled={!trelloConfig?.listId || tickets.filter(t => t.status !== 'rejected').length === 0}
              >
                Publish to Trello ({tickets.filter(t => t.status !== 'rejected').length} tickets)
              </button>
            </div>
          </div>
        )}

        {stage === STAGES.PUBLISHING && (
          <div className="loading-state">
            <div className="spinner"></div>
            <h2>Publishing to Trello...</h2>
            <p>Creating your cards now.</p>
          </div>
        )}

        {stage === STAGES.COMPLETE && publishResults && (
          <div className="section complete-state">
            <div className="success-icon">✅</div>
            <h2>Successfully Published!</h2>
            <div className="results-summary">
              <div className="stat">
                <span className="stat-value">{publishResults.created}</span>
                <span className="stat-label">Cards Created</span>
              </div>
              {publishResults.failed > 0 && (
                <div className="stat error">
                  <span className="stat-value">{publishResults.failed}</span>
                  <span className="stat-label">Failed</span>
                </div>
              )}
            </div>
            <div className="card-links">
              {publishResults.cards.slice(0, 5).map(card => (
                <a key={card.cardId} href={card.cardUrl} target="_blank" rel="noopener noreferrer">
                  View Card →
                </a>
              ))}
            </div>
            <button className="btn-primary" onClick={handleReset}>
              Process Another Meeting
            </button>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>SyncBoard MVP • AIPD Course Project • FAST-NUCES</p>
      </footer>
    </div>
  );
}

export default App;
