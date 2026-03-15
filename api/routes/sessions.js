/**
 * Sessions API Routes - Enhanced for Phase 3
 */
const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const fs = require('fs');
const path = require('path');

const SESSIONS_DIR = process.env.OPENCLAW_SESSIONS_DIR || path.join(process.env.HOME || '/home/openclaw', '.openclaw', 'agents', 'main', 'sessions');

// GET /api/sessions - List sessions with filtering
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const { 
      status, 
      limit = 50, 
      offset = 0,
      filter = 'all', // all, active, recent24h, recent7d, recent30d
      search,
      model
    } = req.query;
    
    let query = 'SELECT * FROM sessions WHERE 1=1';
    const params = [];
    
    // Status filter
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    // Time-based filters
    if (filter === 'active') {
      query += ' AND status = \'active\'';
    } else if (filter === 'recent24h') {
      query += ' AND started_at >= datetime(\'now\', \'-1 day\')';
    } else if (filter === 'recent7d') {
      query += ' AND started_at >= datetime(\'now\', \'-7 days\')';
    } else if (filter === 'recent30d') {
      query += ' AND started_at >= datetime(\'now\', \'-30 days\')';
    }
    
    // Model filter
    if (model) {
      query += ' AND model = ?';
      params.push(model);
    }
    
    // Search filter (session_key or label)
    if (search) {
      query += ' AND (session_key LIKE ? OR label LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
    const { count } = await db.get(countQuery, params) || { count: 0 };
    
    // Add ordering and pagination
    query += ' ORDER BY started_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const sessions = await db.all(query, params);
    
    // Parse JSON metadata
    const parsedSessions = sessions.map(s => ({
      ...s,
      metadata: s.metadata ? JSON.parse(s.metadata) : {}
    }));
    
    res.json({ 
      count: parsedSessions.length,
      total: count,
      sessions: parsedSessions 
    });
  } catch (error) {
    console.error('[Sessions API] Error:', error);
    res.status(500).json({ error: 'Failed to retrieve sessions' });
  }
});

// GET /api/sessions/models - Get list of models used
router.get('/models/list', async (req, res) => {
  try {
    const db = getDB();
    const models = await db.all(
      'SELECT DISTINCT model FROM sessions WHERE model IS NOT NULL ORDER BY model'
    );
    res.json({ models: models.map(m => m.model) });
  } catch (error) {
    console.error('[Sessions API] Error:', error);
    res.status(500).json({ error: 'Failed to retrieve models' });
  }
});

// GET /api/sessions/:id - Get session detail
router.get('/:id', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    
    const session = await db.get(
      'SELECT * FROM sessions WHERE id = ? OR session_key = ?', 
      [id, id]
    );
    
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

// GET /api/sessions/:id/messages - Parse JSONL for messages
router.get('/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 100, offset = 0 } = req.query;
    
    // Find the JSONL file
    const possiblePaths = [
      path.join(SESSIONS_DIR, `${id}.jsonl`),
      path.join(SESSIONS_DIR, `${id}.json`)
    ];
    
    let filePath = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        filePath = p;
        break;
      }
    }
    
    if (!filePath) {
      // Try to find by session_key pattern
      const files = fs.readdirSync(SESSIONS_DIR).filter(f => f.endsWith('.jsonl'));
      const matchingFile = files.find(f => f.startsWith(id));
      if (matchingFile) {
        filePath = path.join(SESSIONS_DIR, matchingFile);
      }
    }
    
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Session file not found' });
    }
    
    // Read and parse JSONL
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.trim().split('\n');
    
    const messages = [];
    const metadata = { session: null, models: [], toolCalls: [] };
    
    for (let i = 0; i < lines.length; i++) {
      try {
        const line = JSON.parse(lines[i]);
        
        // Extract session metadata
        if (line.type === 'session') {
          metadata.session = line;
        }
        
        // Extract model changes
        if (line.type === 'model_change') {
          metadata.models.push({
            timestamp: line.timestamp,
            provider: line.provider,
            modelId: line.modelId
          });
        }
        
        // Extract messages
        if (line.type === 'message' && line.message) {
          messages.push({
            id: line.id,
            parentId: line.parentId,
            timestamp: line.timestamp,
            role: line.message.role,
            content: line.message.content,
            model: line.message.model || line.message.provider,
            api: line.message.api,
            usage: line.message.usage,
            stopReason: line.message.stopReason,
            errorMessage: line.message.errorMessage,
            toolCalls: line.message.toolCalls || [],
            toolResults: line.message.toolResults || []
          });
        }
        
        // Extract tool calls
        if (line.type === 'toolCall' || (line.message?.toolCalls && line.message.toolCalls.length > 0)) {
          const toolCalls = line.type === 'toolCall' 
            ? [line]
            : line.message.toolCalls;
          
          for (const tc of toolCalls) {
            metadata.toolCalls.push({
              id: tc.id || tc.toolCallId,
              name: tc.name,
              arguments: tc.arguments,
              timestamp: line.timestamp
            });
          }
        }
      } catch (e) {
        // Skip invalid lines
        console.warn(`[Sessions API] Failed to parse line ${i}:`, e.message);
      }
    }
    
    // Paginate messages
    const totalMessages = messages.length;
    const paginatedMessages = messages.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
    
    res.json({
      sessionId: id,
      filePath,
      total: totalMessages,
      limit: parseInt(limit),
      offset: parseInt(offset),
      metadata,
      messages: paginatedMessages
    });
  } catch (error) {
    console.error('[Sessions API] Messages Error:', error);
    res.status(500).json({ error: 'Failed to retrieve session messages' });
  }
});

module.exports = router;
