import React, { useCallback, useState } from 'react';
import './FileUpload.css';

function FileUpload({ onUpload }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateFile = (file) => {
    setFileError(null);

    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'video/mp4', 'audio/webm'];
    const maxSize = 500 * 1024 * 1024; // 500MB

    // Check file type
    if (!validTypes.includes(file.type)) {
      const ext = file.name.split('.').pop().toUpperCase();
      setFileError(
        `Unsupported file format (.${ext}). Please upload one of: MP3, WAV, MP4, or WebM.`
      );
      return false;
    }

    // Check for empty file
    if (file.size === 0) {
      setFileError('This file is empty (0 bytes). Please select a valid audio file.');
      return false;
    }

    // Check file too small (likely corrupted)
    if (file.size < 1024) {
      setFileError('This file is too small to contain valid audio. It may be corrupted.');
      return false;
    }

    // Check file size limit
    if (file.size > maxSize) {
      setFileError(
        `File is too large (${(file.size / 1024 / 1024).toFixed(0)}MB). Maximum size is 500MB. Try compressing or trimming your recording.`
      );
      return false;
    }

    return true;
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  }, []);

  const handleChange = useCallback((e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  }, []);

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="file-upload-container">
      <div
        className={`drop-zone ${dragActive ? 'active' : ''} ${selectedFile ? 'has-file' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-input"
          accept=".mp3,.wav,.mp4,.webm,audio/*,video/mp4"
          onChange={handleChange}
          className="file-input"
        />
        
        {selectedFile ? (
          <div className="selected-file">
            <div className="file-icon">🎵</div>
            <div className="file-info">
              <span className="file-name">{selectedFile.name}</span>
              <span className="file-size">{formatFileSize(selectedFile.size)}</span>
            </div>
            <button 
              className="remove-file"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFile(null);
              }}
            >
              ✕
            </button>
          </div>
        ) : (
          <label htmlFor="file-input" className="drop-label">
            <div className="upload-icon">📁</div>
            <p className="drop-text">
              <strong>Drop your meeting recording here</strong>
              <br />
              or click to browse
            </p>
            <p className="file-types">MP3, WAV, MP4, WebM • Max 500MB</p>
          </label>
        )}
      </div>

      {fileError && (
        <div className="file-error">
          <span className="error-icon">&#9888;</span>
          <span>{fileError}</span>
          <button className="error-dismiss" onClick={() => setFileError(null)}>&#10005;</button>
        </div>
      )}

      {selectedFile && (
        <button className="btn-primary upload-btn" onClick={handleUpload}>
          Start Processing →
        </button>
      )}

      <div className="upload-tips">
        <h3>Tips for best results:</h3>
        <ul>
          <li>✓ Use clear audio without background noise</li>
          <li>✓ Ensure speakers announce their names or use speaker identification</li>
          <li>✓ Explicitly state action items during the meeting</li>
          <li>✓ Mention deadlines clearly (e.g., "by Friday")</li>
        </ul>
      </div>
    </div>
  );
}

export default FileUpload;
