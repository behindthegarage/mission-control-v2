/**
 * Tasks API Routes - Kanban Board
 */
const express = require('express');
const router = express.Router();
const { getDB } = require('../db');

// GET /api/tasks - List all tasks
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const { status, assignee } = req.query;
    
    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params = [];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    if (assignee) {
      query += ' AND assignee = ?';
      params.push(assignee);
    }
    
    query += ' ORDER BY position ASC, created_at DESC';
    
    const tasks = await db.all(query, params);
    
    // Parse JSON fields
    const parsedTasks = tasks.map(t => ({
      ...t,
      tags: t.tags ? JSON.parse(t.tags) : [],
      metadata: t.metadata ? JSON.parse(t.metadata) : {}
    }));
    
    res.json({ count: parsedTasks.length, tasks: parsedTasks });
  } catch (error) {
    console.error('[Tasks API] Error:', error);
    res.status(500).json({ error: 'Failed to retrieve tasks' });
  }
});

// POST /api/tasks - Create new task
router.post('/', async (req, res) => {
  try {
    const db = getDB();
    const {
      title,
      description,
      status = 'backlog',
      assignee = 'human',
      priority = 'medium',
      category,
      project_id,
      tags,
      position = 0
    } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    const result = await db.run(
      `INSERT INTO tasks (title, description, status, assignee, priority, category, project_id, tags, position)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, status, assignee, priority, category, project_id, 
       tags ? JSON.stringify(tags) : '[]', position]
    );
    
    // Log activity
    await db.run(
      `INSERT INTO activity_log (type, actor_type, entity_type, entity_id, title)
       VALUES (?, ?, ?, ?, ?)`,
      ['task_created', assignee, 'task', result.lastID.toString(), title]
    );
    
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [result.lastID]);
    res.status(201).json({
      ...task,
      tags: task.tags ? JSON.parse(task.tags) : [],
      metadata: task.metadata ? JSON.parse(task.metadata) : {}
    });
  } catch (error) {
    console.error('[Tasks API] Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const updates = req.body;
    
    // Get current task for comparison
    const current = await db.get('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!current) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Build update query
    const allowedFields = ['title', 'description', 'status', 'assignee', 'priority', 'category', 'project_id', 'position'];
    const setClauses = [];
    const values = [];
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = ?`);
        values.push(key === 'tags' ? JSON.stringify(value) : value);
      }
    }
    
    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    values.push(id);
    
    await db.run(
      `UPDATE tasks SET ${setClauses.join(', ')} WHERE id = ?`,
      values
    );
    
    // Log status change if applicable
    if (updates.status && updates.status !== current.status) {
      await db.run(
        `INSERT INTO activity_log (type, actor_type, entity_type, entity_id, title, description)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['task_moved', updates.assignee || current.assignee, 'task', id, current.title, 
         `Moved from ${current.status} to ${updates.status}`]
      );
    }
    
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [id]);
    res.json({
      ...task,
      tags: task.tags ? JSON.parse(task.tags) : [],
      metadata: task.metadata ? JSON.parse(task.metadata) : {}
    });
  } catch (error) {
    console.error('[Tasks API] Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    await db.run('DELETE FROM tasks WHERE id = ?', [id]);
    
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    console.error('[Tasks API] Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;
