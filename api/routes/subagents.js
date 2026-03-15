/**
 * Subagents API Routes - Phase 3
 */
const express = require('express');
const router = express.Router();
const { getDB } = require('../db');

// GET /api/subagents - List subagents with filtering
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const { 
      status, 
      model,
      parent_session,
      limit = 50, 
      offset = 0,
      date_from,
      date_to
    } = req.query;
    
    let query = 'SELECT * FROM subagents WHERE 1=1';
    const params = [];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    if (model) {
      query += ' AND model = ?';
      params.push(model);
    }
    
    if (parent_session) {
      query += ' AND parent_session = ?';
      params.push(parent_session);
    }
    
    if (date_from) {
      query += ' AND started_at >= ?';
      params.push(date_from);
    }
    
    if (date_to) {
      query += ' AND started_at <= ?';
      params.push(date_to);
    }
    
    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
    const { count } = await db.get(countQuery, params) || { count: 0 };
    
    query += ' ORDER BY started_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const subagents = await db.all(query, params);
    
    // Parse JSON metadata
    const parsedSubagents = subagents.map(s => ({
      ...s,
      metadata: s.metadata ? JSON.parse(s.metadata) : {}
    }));
    
    res.json({ 
      count: parsedSubagents.length,
      total: count,
      subagents: parsedSubagents 
    });
  } catch (error) {
    console.error('[Subagents API] Error:', error);
    res.status(500).json({ error: 'Failed to retrieve subagents' });
  }
});

// GET /api/subagents/stats - Get subagent statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const db = getDB();
    
    const stats = await db.all(`
      SELECT 
        status,
        COUNT(*) as count
      FROM subagents
      GROUP BY status
    `);
    
    const modelStats = await db.all(`
      SELECT 
        model,
        COUNT(*) as count
      FROM subagents
      WHERE model IS NOT NULL
      GROUP BY model
      ORDER BY count DESC
    `);
    
    const totalTokens = await db.get(`
      SELECT 
        COALESCE(SUM(total_tokens), 0) as total,
        COALESCE(SUM(input_tokens), 0) as input,
        COALESCE(SUM(output_tokens), 0) as output
      FROM subagents
    `);
    
    res.json({
      statusCounts: stats,
      modelCounts: modelStats,
      tokenUsage: totalTokens || { total: 0, input: 0, output: 0 }
    });
  } catch (error) {
    console.error('[Subagents API] Stats Error:', error);
    res.status(500).json({ error: 'Failed to retrieve subagent stats' });
  }
});

// GET /api/subagents/:id - Get subagent detail
router.get('/:id', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    
    const subagent = await db.get(
      'SELECT * FROM subagents WHERE id = ? OR session_key = ?', 
      [id, id]
    );
    
    if (!subagent) {
      return res.status(404).json({ error: 'Subagent not found' });
    }
    
    // Get parent session info
    const parentSession = await db.get(
      'SELECT id, session_key, label, status FROM sessions WHERE session_key = ?',
      [subagent.parent_session]
    );
    
    // Get siblings (other subagents from same parent)
    const siblings = await db.all(
      'SELECT session_key, label, status, started_at FROM subagents WHERE parent_session = ? AND session_key != ? ORDER BY started_at DESC',
      [subagent.parent_session, subagent.session_key]
    );
    
    res.json({
      ...subagent,
      metadata: subagent.metadata ? JSON.parse(subagent.metadata) : {},
      parentSession,
      siblings
    });
  } catch (error) {
    console.error('[Subagents API] Error:', error);
    res.status(500).json({ error: 'Failed to retrieve subagent' });
  }
});

module.exports = router;
