// routes/analyze.js
const express = require('express');
const router = express.Router();
const { analyzeTranscript, extractActionItems } = require('../services/gptService');

router.post('/', async (req, res) => {
  try {
    const { transcript, options = {} } = req.body;
    
    if (!transcript || transcript.trim().length === 0) {
      return res.status(400).json({ error: 'Transcript is required' });
    }
    
    console.log(`[Analyze] Processing transcript (${transcript.length} chars)`);
    
    // Run full analysis pipeline
    const result = await analyzeTranscript(transcript, options);
    
    // Add unique IDs to tickets for frontend
    const ticketsWithIds = result.tickets.map((ticket, index) => ({
      id: `ticket-${Date.now()}-${index}`,
      ...ticket
    }));
    
    res.json({
      success: true,
      tickets: ticketsWithIds,
      stats: result.stats,
      message: result.message || `Extracted ${ticketsWithIds.length} action items`
    });
  } catch (error) {
    console.error('[Analyze] Error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message
    });
  }
});

// Quick extraction without user stories
router.post('/quick', async (req, res) => {
  try {
    const { transcript } = req.body;
    
    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }
    
    const result = await extractActionItems(transcript);
    
    res.json({
      success: true,
      actionItems: result.actionItems,
      stats: {
        tokensUsed: result.tokensUsed,
        estimatedCost: result.estimatedCost,
        processingTime: result.processingTime
      }
    });
  } catch (error) {
    console.error('[Analyze Quick] Error:', error);
    res.status(500).json({
      error: 'Quick analysis failed',
      message: error.message
    });
  }
});

// Update ticket (user edits before publishing)
router.patch('/ticket/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // In MVP, ticket state is managed in frontend
    // This endpoint validates and returns updated ticket
    
    const allowedFields = [
      'task', 'title', 'description', 'assignee', 
      'deadline', 'priority', 'labels', 'userStory', 'status'
    ];
    
    const filteredUpdates = {};
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = value;
      }
    }
    
    res.json({
      success: true,
      ticketId: id,
      updates: filteredUpdates,
      message: 'Ticket updated'
    });
  } catch (error) {
    res.status(500).json({ error: 'Update failed' });
  }
});

module.exports = router;
