import React, { useState } from 'react';
import './TicketCard.css';

function TicketCard({ ticket, onUpdate, onRemove }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    task: ticket.task || ticket.title || '',
    description: ticket.description || '',
    assignee: ticket.assignee || '',
    deadline: ticket.deadline || '',
    priority: ticket.priority || 'medium',
    labels: ticket.labels || []
  });

  const priorityColors = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#22c55e'
  };

  const handleSave = () => {
    onUpdate(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      task: ticket.task || ticket.title || '',
      description: ticket.description || '',
      assignee: ticket.assignee || '',
      deadline: ticket.deadline || '',
      priority: ticket.priority || 'medium',
      labels: ticket.labels || []
    });
    setIsEditing(false);
  };

  const handleApprove = () => {
    onUpdate({ status: 'approved' });
  };

  const handleReject = () => {
    onUpdate({ status: 'rejected' });
  };

  const isRejected = ticket.status === 'rejected';

  return (
    <div className={`ticket-card ${isRejected ? 'rejected' : ''} priority-${ticket.priority}`}>
      {/* Status indicator */}
      <div 
        className="priority-indicator"
        style={{ backgroundColor: priorityColors[ticket.priority] }}
      />

      {isEditing ? (
        /* Edit mode */
        <div className="ticket-edit">
          <div className="edit-field">
            <label>Task</label>
            <input
              type="text"
              value={editData.task}
              onChange={(e) => setEditData({ ...editData, task: e.target.value })}
            />
          </div>
          <div className="edit-field">
            <label>Description</label>
            <textarea
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="edit-row">
            <div className="edit-field half">
              <label>Assignee</label>
              <input
                type="text"
                value={editData.assignee}
                onChange={(e) => setEditData({ ...editData, assignee: e.target.value })}
                placeholder="Name"
              />
            </div>
            <div className="edit-field half">
              <label>Deadline</label>
              <input
                type="date"
                value={editData.deadline}
                onChange={(e) => setEditData({ ...editData, deadline: e.target.value })}
              />
            </div>
          </div>
          <div className="edit-field">
            <label>Priority</label>
            <select
              value={editData.priority}
              onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="edit-actions">
            <button className="btn-small btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
            <button className="btn-small btn-primary" onClick={handleSave}>
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        /* View mode */
        <>
          <div className="ticket-header">
            <h3 className="ticket-title">{ticket.task || ticket.title}</h3>
            <div className="ticket-actions">
              <button 
                className="action-btn edit" 
                onClick={() => setIsEditing(true)}
                title="Edit"
              >
                ✏️
              </button>
              <button 
                className="action-btn remove" 
                onClick={onRemove}
                title="Remove"
              >
                🗑️
              </button>
            </div>
          </div>

          {ticket.description && (
            <p className="ticket-description">{ticket.description}</p>
          )}

          {ticket.userStory?.story && (
            <div className="user-story">
              <span className="story-label">User Story:</span>
              <p>{ticket.userStory.story}</p>
            </div>
          )}

          {ticket.context && (
            <p className="ticket-context">
              <span className="context-label">Context:</span> {ticket.context}
            </p>
          )}

          <div className="ticket-meta">
            {ticket.assignee && (
              <span className="meta-item assignee">
                👤 {ticket.assignee}
              </span>
            )}
            {ticket.deadline && (
              <span className="meta-item deadline">
                📅 {new Date(ticket.deadline).toLocaleDateString()}
              </span>
            )}
            <span className="meta-item priority" style={{ color: priorityColors[ticket.priority] }}>
              ⚡ {ticket.priority}
            </span>
          </div>

          {ticket.labels && ticket.labels.length > 0 && (
            <div className="ticket-labels">
              {ticket.labels.map((label, idx) => (
                <span key={idx} className="label">{label}</span>
              ))}
            </div>
          )}

          {ticket.confidence && (
            <div className={`confidence-section ${ticket.confidence < 0.7 ? 'low-confidence' : ''}`}>
              {ticket.confidence < 0.7 && (
                <div className="confidence-warning">
                  <span className="warning-icon">&#9888;</span>
                  <span className="warning-text">
                    Low confidence ({Math.round(ticket.confidence * 100)}%) — Review this ticket carefully before approving
                  </span>
                </div>
              )}
              <div className="confidence-bar">
                <div
                  className={`confidence-fill ${ticket.confidence < 0.7 ? 'warning' : ticket.confidence < 0.85 ? 'moderate' : ''}`}
                  style={{ width: `${ticket.confidence * 100}%` }}
                />
                <span className="confidence-text">
                  {Math.round(ticket.confidence * 100)}% confidence
                </span>
              </div>
            </div>
          )}

          {/* Approval buttons */}
          <div className="approval-actions">
            {isRejected ? (
              <button className="btn-small btn-restore" onClick={handleApprove}>
                ↩️ Restore
              </button>
            ) : (
              <>
                <button 
                  className={`btn-small btn-approve ${ticket.status === 'approved' ? 'active' : ''}`}
                  onClick={handleApprove}
                >
                  ✓ Approve
                </button>
                <button className="btn-small btn-reject" onClick={handleReject}>
                  ✕ Reject
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default TicketCard;
