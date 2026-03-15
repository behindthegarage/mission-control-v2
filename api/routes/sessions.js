/**
 * Sessions API Routes
 */
const express = require('express');
const router = express.Router();
const { getDB } = require('../db');

// GET /api/sessions - List sessions
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const { status, limit = 50 } = req.query;
    
    let query = 'SELECT * FROM sessions WHERE 1=1';
    const params = [];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY started_at DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const sessions = await db.all(query, params);
    
    // Parse JSON metadata
    const parsedSessions = sessions.map(s => ({
      ...s,
      metadata: s.metadata ? JSON.parse(s.metadata) : {}
    }));
    
    res.json({ count: parsedSessions.length, sessions: parsedSessions });
  } catch (error) {
    console.error('[Sessions API] Error:', error);
    res.status(500).json({ error: 'Failed to retrieve sessions' });
  }
});

// GET /api/sessions/:id - Get session detail
router.get('/:id', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    
    const session = await db.get('SELECT * FROM sessions WHERE id = ? OR session_key = ?', [id, id]);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Get subagents for this session
    const subagents = await db.all(
      'SELECT * FROM subagents WHERE parent_session = ? ORDER BY started_at DESC',
      [session.session_key]
    );
    
    res.json({
      ...session,
      metadata: session.metadata ? JSON.parse(session.metadata) : {},
      subagents: subagents.map(s => ({
        ...s,
        metadata: s.metadata ? JSON.parse(s.metadata) : {}
      }))
    });
  } catch (error) {
    console.error('[Sessions API] Error:', error);
    res.status(500).json({ error: 'Failed to retrieve session' });
  }
});

module.exports = router;
