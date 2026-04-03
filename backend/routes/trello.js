// routes/trello.js
const express = require('express');
const router = express.Router();
const trelloService = require('../services/trelloService');

// Verify Trello connection
router.get('/verify', async (req, res) => {
  try {
    const status = await trelloService.verifyConnection();
    res.json(status);
  } catch (error) {
    res.status(500).json({
      connected: false,
      error: error.message
    });
  }
});

// Get user's boards
router.get('/boards', async (req, res) => {
  try {
    const boards = await trelloService.getBoards();
    const activeBoards = boards.filter(b => !b.closed);
    res.json({
      success: true,
      boards: activeBoards
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch boards',
      message: error.message
    });
  }
});

// Get lists for a board
router.get('/boards/:boardId/lists', async (req, res) => {
  try {
    const lists = await trelloService.getLists(req.params.boardId);
    const activeLists = lists.filter(l => !l.closed);
    res.json({
      success: true,
      lists: activeLists
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch lists',
      message: error.message
    });
  }
});

// Get board members
router.get('/boards/:boardId/members', async (req, res) => {
  try {
    const members = await trelloService.getBoardMembers(req.params.boardId);
    res.json({
      success: true,
      members
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch members',
      message: error.message
    });
  }
});

// Get board labels
router.get('/boards/:boardId/labels', async (req, res) => {
  try {
    const labels = await trelloService.getLabels(req.params.boardId);
    res.json({
      success: true,
      labels
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch labels',
      message: error.message
    });
  }
});

// Create single card
router.post('/cards', async (req, res) => {
  try {
    const { ticket, listId } = req.body;
    
    if (!ticket || !listId) {
      return res.status(400).json({
        error: 'Ticket and listId are required'
      });
    }
    
    const card = await trelloService.createCard(ticket, listId);
    
    res.json({
      success: true,
      card: {
        id: card.id,
        name: card.name,
        url: card.url,
        shortUrl: card.shortUrl
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create card',
      message: error.message
    });
  }
});

// Bulk create cards
router.post('/cards/bulk', async (req, res) => {
  try {
    const { tickets, listId, boardId } = req.body;
    
    if (!tickets || !Array.isArray(tickets) || tickets.length === 0) {
      return res.status(400).json({
        error: 'Tickets array is required'
      });
    }
    
    if (!listId) {
      return res.status(400).json({
        error: 'listId is required'
      });
    }
    
    console.log(`[Trello] Creating ${tickets.length} cards...`);
    console.log(`[Trello] listId received: "${listId}" (type: ${typeof listId})`);
    console.log(`[Trello] boardId received: "${boardId}" (type: ${typeof boardId})`);
    console.log(`[Trello] First ticket sample:`, JSON.stringify(tickets[0], null, 2));

    const results = await trelloService.bulkCreateCards(tickets, listId, boardId);
    
    res.json({
      success: true,
      results: {
        total: tickets.length,
        created: results.created.length,
        failed: results.failed.length,
        cards: results.created,
        errors: results.failed
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Bulk creation failed',
      message: error.message
    });
  }
});

// Match assignee name to member
router.post('/match-assignee', async (req, res) => {
  try {
    const { name, boardId } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const memberId = await trelloService.matchAssignee(name, boardId);
    
    res.json({
      success: true,
      match: memberId ? { id: memberId, found: true } : { found: false }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Matching failed',
      message: error.message
    });
  }
});

module.exports = router;
