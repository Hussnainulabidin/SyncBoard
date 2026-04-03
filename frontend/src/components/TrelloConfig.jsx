import React, { useState, useEffect } from 'react';
import './TrelloConfig.css';

function TrelloConfig({ onConfigChange, apiBase }) {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [boards, setBoards] = useState([]);
  const [lists, setLists] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState('');
  const [selectedList, setSelectedList] = useState('');
  const [error, setError] = useState(null);

  // Check connection on mount
  useEffect(() => {
    checkConnection();
  }, []);

  // Load lists when board changes
  useEffect(() => {
    if (selectedBoard) {
      loadLists(selectedBoard);
    }
  }, [selectedBoard]);

  // Notify parent of config changes
  useEffect(() => {
    onConfigChange({
      boardId: selectedBoard,
      listId: selectedList,
      connected
    });
  }, [selectedBoard, selectedList, connected, onConfigChange]);

  const checkConnection = async () => {
    try {
      const res = await fetch(`${apiBase}/trello/verify`);
      const data = await res.json();
      
      if (data.connected) {
        setConnected(true);
        loadBoards();
      } else {
        setConnected(false);
        setError('Trello not connected. Please configure API keys.');
      }
    } catch (err) {
      setConnected(false);
      setError('Failed to connect to Trello');
    } finally {
      setLoading(false);
    }
  };

  const loadBoards = async () => {
    try {
      const res = await fetch(`${apiBase}/trello/boards`);
      const data = await res.json();
      
      if (data.success) {
        setBoards(data.boards);
        // Auto-select first board if available
        if (data.boards.length > 0) {
          setSelectedBoard(data.boards[0].id);
        }
      }
    } catch (err) {
      setError('Failed to load boards');
    }
  };

  const loadLists = async (boardId) => {
    try {
      const res = await fetch(`${apiBase}/trello/boards/${boardId}/lists`);
      const data = await res.json();
      
      if (data.success) {
        setLists(data.lists);
        // Try to auto-select "To Do" or first list
        const todoList = data.lists.find(l => 
          l.name.toLowerCase().includes('to do') || 
          l.name.toLowerCase().includes('todo') ||
          l.name.toLowerCase().includes('backlog')
        );
        setSelectedList(todoList?.id || data.lists[0]?.id || '');
      }
    } catch (err) {
      setError('Failed to load lists');
    }
  };

  if (loading) {
    return (
      <div className="trello-config loading">
        <div className="spinner-small"></div>
        <span>Connecting to Trello...</span>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="trello-config disconnected">
        <div className="config-header">
          <span className="status-icon">⚠️</span>
          <h3>Trello Connection Required</h3>
        </div>
        <p className="config-message">
          {error || 'Please configure your Trello API credentials to publish tickets.'}
        </p>
        <div className="config-help">
          <p>Add these to your <code>.env</code> file:</p>
          <pre>
{`TRELLO_API_KEY=your_api_key
TRELLO_TOKEN=your_token`}
          </pre>
          <a 
            href="https://trello.com/power-ups/admin" 
            target="_blank" 
            rel="noopener noreferrer"
            className="help-link"
          >
            Get API Key →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="trello-config connected">
      <div className="config-header">
        <span className="status-icon">✅</span>
        <h3>Publish to Trello</h3>
      </div>

      {error && (
        <div className="config-error">
          {error}
        </div>
      )}

      <div className="config-fields">
        <div className="config-field">
          <label htmlFor="board-select">Board</label>
          <select
            id="board-select"
            value={selectedBoard}
            onChange={(e) => setSelectedBoard(e.target.value)}
          >
            <option value="">Select a board...</option>
            {boards.map(board => (
              <option key={board.id} value={board.id}>
                {board.name}
              </option>
            ))}
          </select>
        </div>

        <div className="config-field">
          <label htmlFor="list-select">List</label>
          <select
            id="list-select"
            value={selectedList}
            onChange={(e) => setSelectedList(e.target.value)}
            disabled={!selectedBoard || lists.length === 0}
          >
            <option value="">Select a list...</option>
            {lists.map(list => (
              <option key={list.id} value={list.id}>
                {list.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedBoard && selectedList && (
        <div className="config-preview">
          <span className="preview-label">Cards will be created in:</span>
          <span className="preview-path">
            {boards.find(b => b.id === selectedBoard)?.name} → {lists.find(l => l.id === selectedList)?.name}
          </span>
        </div>
      )}
    </div>
  );
}

export default TrelloConfig;
