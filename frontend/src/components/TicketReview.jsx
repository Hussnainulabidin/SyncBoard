import React, { useState } from 'react';
import TicketCard from './TicketCard';
import './TicketReview.css';

function TicketReview({ tickets, stats, onUpdate, onRemove }) {
  const [filter, setFilter] = useState('all'); // 'all', 'high', 'medium', 'low', 'approved', 'rejected'
  const [sortBy, setSortBy] = useState('default'); // 'default', 'priority', 'deadline'

  const filteredTickets = tickets.filter(ticket => {
    if (filter === 'all') return true;
    if (filter === 'approved') return ticket.status === 'approved';
    if (filter === 'rejected') return ticket.status === 'rejected';
    return ticket.priority === filter;
  });

  const sortedTickets = [...filteredTickets].sort((a, b) => {
    if (sortBy === 'priority') {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    if (sortBy === 'deadline') {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    }
    return 0;
  });

  const approvedCount = tickets.filter(t => t.status !== 'rejected').length;

  return (
    <div className="ticket-review">
      <div className="review-header">
        <h2>🎫 Extracted Tickets</h2>
        <p className="review-subtitle">
          Review and edit before publishing to Trello
        </p>
      </div>

      {/* Stats banner */}
      {stats && (
        <div className="stats-banner">
          <div className="stat-item">
            <span className="stat-value">{stats.totalExtracted}</span>
            <span className="stat-label">Extracted</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.withDeadlines}</span>
            <span className="stat-label">With Deadlines</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.withAssignees}</span>
            <span className="stat-label">Assigned</span>
          </div>
          <div className="stat-item highlight">
            <span className="stat-value">{stats.highPriority}</span>
            <span className="stat-label">High Priority</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">${stats.estimatedCost}</span>
            <span className="stat-label">AI Cost</span>
          </div>
        </div>
      )}

      {/* Filters and controls */}
      <div className="review-controls">
        <div className="filter-group">
          <label>Filter:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All ({tickets.length})</option>
            <option value="high">High Priority ({tickets.filter(t => t.priority === 'high').length})</option>
            <option value="medium">Medium Priority ({tickets.filter(t => t.priority === 'medium').length})</option>
            <option value="low">Low Priority ({tickets.filter(t => t.priority === 'low').length})</option>
            <option value="approved">Approved ({tickets.filter(t => t.status === 'approved').length})</option>
            <option value="rejected">Rejected ({tickets.filter(t => t.status === 'rejected').length})</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="default">Default</option>
            <option value="priority">Priority</option>
            <option value="deadline">Deadline</option>
          </select>
        </div>
        <div className="bulk-actions">
          <button 
            className="btn-small"
            onClick={() => tickets.forEach(t => onUpdate(t.id, { status: 'approved' }))}
          >
            ✓ Approve All
          </button>
        </div>
      </div>

      {/* Tickets grid */}
      <div className="tickets-grid">
        {sortedTickets.length > 0 ? (
          sortedTickets.map(ticket => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onUpdate={(updates) => onUpdate(ticket.id, updates)}
              onRemove={() => onRemove(ticket.id)}
            />
          ))
        ) : (
          <div className="no-tickets">
            <p>No tickets match your filter criteria.</p>
          </div>
        )}
      </div>

      {/* Summary footer */}
      <div className="review-summary">
        <span className="summary-text">
          {approvedCount} ticket{approvedCount !== 1 ? 's' : ''} ready to publish
        </span>
      </div>
    </div>
  );
}

export default TicketReview;
