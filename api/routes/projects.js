/**
 * Projects API Routes
 */
const express = require('express');
const router = express.Router();
const { getDB } = require('../db');

// GET /api/projects - List projects
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const { status } = req.query;
    
    let query = 'SELECT * FROM projects WHERE 1=1';
    const params = [];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY updated_at DESC';
    
    const projects = await db.all(query, params);
    
    // Parse JSON fields
    const parsedProjects = projects.map(p => ({
      ...p,
      tags: p.tags ? JSON.parse(p.tags) : [],
      metadata: p.metadata ? JSON.parse(p.metadata) : {}
    }));
    
    res.json({ count: parsedProjects.length, projects: parsedProjects });
  } catch (error) {
    console.error('[Projects API] Error:', error);
    res.status(500).json({ error: 'Failed to retrieve projects' });
  }
});

// POST /api/projects - Create project
router.post('/', async (req, res) => {
  try {
    const db = getDB();
    const { name, description, status = 'pending', btg_queue_item, repo_url, docs_path, tags } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const result = await db.run(
      `INSERT INTO projects (name, description, status, btg_queue_item, repo_url, docs_path, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, description, status, btg_queue_item, repo_url, docs_path, tags ? JSON.stringify(tags) : '[]']
    );
    
    const project = await db.get('SELECT * FROM projects WHERE id = ?', [result.lastID]);
    res.status(201).json({
      ...project,
      tags: project.tags ? JSON.parse(project.tags) : [],
      metadata: project.metadata ? JSON.parse(project.metadata) : {}
    });
  } catch (error) {
    console.error('[Projects API] Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

module.exports = router;
