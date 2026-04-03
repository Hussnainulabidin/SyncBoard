const Groq = require('groq-sdk');
const { ACTION_ITEM_PROMPT, USER_STORY_PROMPT } = require('../utils/prompts');

// Groq client for analysis
const client = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

/**
 * Extract action items from meeting transcript
 * @param {string} transcript - Full meeting transcript
 * @param {Array} segments - Transcript segments with timestamps (optional)
 * @returns {Promise<Object>} Extracted action items
 */
async function extractActionItems(transcript, segments = []) {
  try {
    console.log('[Groq] Starting action item extraction...');
    const startTime = Date.now();

    const response = await client.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: ACTION_ITEM_PROMPT
        },
        {
          role: 'user',
          content: `Meeting Transcript:\n\n${transcript}\n\nExtract all action items as a JSON array.`
        }
      ],
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: 'json_object' }
    });

    const duration = (Date.now() - startTime) / 1000;
    console.log(`[Groq] Extraction completed in ${duration.toFixed(2)}s`);

    const content = response.choices[0].message.content;
    const parsed = JSON.parse(content);

    const inputTokens = response.usage.prompt_tokens;
    const outputTokens = response.usage.completion_tokens;

    return {
      success: true,
      actionItems: parsed.action_items || parsed.actionItems || [],
      tokensUsed: {
        input: inputTokens,
        output: outputTokens,
        total: inputTokens + outputTokens
      },
      estimatedCost: '0.0000', // Groq is free tier
      processingTime: duration
    };
  } catch (error) {
    console.error('[Groq] Extraction error:', error);
    throw new Error(`Action item extraction failed: ${error.message}`);
  }
}

/**
 * Convert action items to user story format
 * @param {Array} actionItems - Raw action items
 * @returns {Promise<Array>} User stories in agile format
 */
async function convertToUserStories(actionItems) {
  try {
    console.log('[Groq] Converting to user stories...');

    const response = await client.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: USER_STORY_PROMPT
        },
        {
          role: 'user',
          content: `Convert these action items to user stories:\n\n${JSON.stringify(actionItems, null, 2)}`
        }
      ],
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: 'json_object' }
    });

    const parsed = JSON.parse(response.choices[0].message.content);
    return parsed.user_stories || parsed.userStories || [];
  } catch (error) {
    console.error('[Groq] User story conversion error:', error);
    throw new Error(`User story conversion failed: ${error.message}`);
  }
}

/**
 * Parse deadline from natural language
 * @param {string} deadline - Natural language deadline (e.g., "by Friday")
 * @returns {string|null} ISO date string or null
 */
function parseDeadline(deadline) {
  if (!deadline) return null;

  const today = new Date();
  const lowerDeadline = deadline.toLowerCase();

  const daysMap = {
    'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4,
    'friday': 5, 'saturday': 6, 'sunday': 0
  };

  for (const [day, num] of Object.entries(daysMap)) {
    if (lowerDeadline.includes(day)) {
      const daysUntil = (num - today.getDay() + 7) % 7 || 7;
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + daysUntil);
      return targetDate.toISOString().split('T')[0];
    }
  }

  if (lowerDeadline.includes('tomorrow')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  if (lowerDeadline.includes('next week')) {
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  }

  if (lowerDeadline.includes('end of week')) {
    const endOfWeek = new Date(today);
    const daysUntilFriday = (5 - today.getDay() + 7) % 7 || 7;
    endOfWeek.setDate(today.getDate() + daysUntilFriday);
    return endOfWeek.toISOString().split('T')[0];
  }

  if (lowerDeadline.includes('end of month')) {
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return endOfMonth.toISOString().split('T')[0];
  }

  const parsed = new Date(deadline);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return null;
}

/**
 * Infer priority from context
 * @param {Object} item - Action item
 * @returns {string} Priority level: high, medium, low
 */
function inferPriority(item) {
  const text = `${item.task || ''} ${item.description || ''} ${item.context || ''}`.toLowerCase();

  const highPriorityIndicators = [
    'urgent', 'asap', 'critical', 'blocker', 'blocking', 'immediately',
    'high priority', 'must', 'need to', 'crucial', 'important', 'first thing'
  ];

  const lowPriorityIndicators = [
    'nice to have', 'eventually', 'when you have time', 'low priority',
    'backlog', 'future', 'someday', 'maybe', 'consider'
  ];

  if (highPriorityIndicators.some(ind => text.includes(ind))) {
    return 'high';
  }

  if (lowPriorityIndicators.some(ind => text.includes(ind))) {
    return 'low';
  }

  return 'medium';
}

/**
 * Full analysis pipeline: transcript → structured tickets
 * @param {string} transcript
 * @param {Object} options
 * @returns {Promise<Object>}
 */
async function analyzeTranscript(transcript, options = {}) {
  const { includeUserStories = true } = options;

  const extraction = await extractActionItems(transcript);

  if (!extraction.success || extraction.actionItems.length === 0) {
    return {
      success: true,
      tickets: [],
      message: 'No action items found in the transcript',
      stats: extraction
    };
  }

  let tickets = extraction.actionItems.map(item => ({
    ...item,
    deadline: item.deadline ? parseDeadline(item.deadline) : null,
    deadlineRaw: item.deadline || null,
    priority: item.priority || inferPriority(item),
    status: 'pending_review'
  }));

  if (includeUserStories) {
    try {
      const userStories = await convertToUserStories(extraction.actionItems);
      tickets = tickets.map((ticket, index) => ({
        ...ticket,
        userStory: userStories[index] || null
      }));
    } catch (e) {
      console.warn('[Groq] User story conversion failed, continuing without:', e.message);
    }
  }

  return {
    success: true,
    tickets,
    stats: {
      totalExtracted: tickets.length,
      withDeadlines: tickets.filter(t => t.deadline).length,
      withAssignees: tickets.filter(t => t.assignee).length,
      highPriority: tickets.filter(t => t.priority === 'high').length,
      tokensUsed: extraction.tokensUsed,
      estimatedCost: extraction.estimatedCost,
      processingTime: extraction.processingTime
    }
  };
}

module.exports = {
  extractActionItems,
  convertToUserStories,
  parseDeadline,
  inferPriority,
  analyzeTranscript
};
