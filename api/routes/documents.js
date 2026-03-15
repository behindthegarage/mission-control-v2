/**
 * Documents API Routes
 */
const express = require('express');
const router = express.Router();
const { getDB } = require('../db');

// GET /api/documents - List documents
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const { project_id } = req.query;
    
    let query = 'SELECT * FROM documents WHERE 1=1';
    const params = [];
    
    if (project_id) {
      query += ' AND project_id = ?';
      params.push(project_id);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const documents = await db.all(query, params);
    
    res.json({ count: documents.length, documents });
  } catch (error) {
    console.error('[Documents API] Error:', error);
    res.status(500).json({ error: 'Failed to retrieve documents' });
  }
});

module.exports = router;
