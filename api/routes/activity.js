/**
 * Activity Log API Routes
 */
const express = require('express');
const router = express.Router();
const { getDB } = require('../db');

// GET /api/activity - Get recent activity
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const { limit = 50, type } = req.query;
    
    let query = 'SELECT * FROM activity_log WHERE 1=1';
    const params = [];
    
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const activities = await db.all(query, params);
    
    // Parse JSON metadata
    const parsedActivities = activities.map(a => ({
      ...a,
      metadata: a.metadata ? JSON.parse(a.metadata) : {}
    }));
    
    res.json({ count: parsedActivities.length, activities: parsedActivities });
  } catch (error) {
    console.error('[Activity API] Error:', error);
    res.status(500).json({ error: 'Failed to retrieve activity' });
  }
});

module.exports = router;
