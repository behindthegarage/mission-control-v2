/**
 * Memories API Routes
 */
const express = require('express');
const router = express.Router();
const { getDB } = require('../db');

// GET /api/memories - List memories
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const { date_from, date_to, limit = 50 } = req.query;
    
    let query = 'SELECT * FROM memories WHERE 1=1';
    const params = [];
    
    if (date_from) {
      query += ' AND memory_date >= ?';
      params.push(date_from);
    }
    
    if (date_to) {
      query += ' AND memory_date <= ?';
      params.push(date_to);
    }
    
    query += ' ORDER BY memory_date DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const memories = await db.all(query, params);
    
    // Parse JSON fields
    const parsedMemories = memories.map(m => ({
      ...m,
      key_topics: m.key_topics ? JSON.parse(m.key_topics) : [],
      project_ids: m.project_ids ? JSON.parse(m.project_ids) : [],
      session_keys: m.session_keys ? JSON.parse(m.session_keys) : []
    }));
    
    res.json({ count: parsedMemories.length, memories: parsedMemories });
  } catch (error) {
    console.error('[Memories API] Error:', error);
    res.status(500).json({ error: 'Failed to retrieve memories' });
  }
});

module.exports = router;
