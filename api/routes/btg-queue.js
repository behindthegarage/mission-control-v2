/**
 * BTG Queue API Routes
 * Parses and serves BTG_QUEUE.md content
 */
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const BTG_QUEUE_PATH = path.join(process.env.HOME || '/home/openclaw', '.openclaw', 'workspace', 'BTG_QUEUE.md');

/**
 * Parse BTG Queue markdown file
 */
function parseBTGQueue(content) {
  const items = [];
  const lines = content.split('\n');
  
  let inActiveQueue = false;
  let lineNumber = 0;
  
  for (const line of lines) {
    lineNumber++;
    
    // Detect active queue section
    if (line.includes('## 📋 Active Queue') || line.includes('## Active Queue')) {
      inActiveQueue = true;
      continue;
    }
    
    // Detect end of active queue
    if (line.startsWith('## ') && inActiveQueue && !line.includes('Active Queue')) {
      inActiveQueue = false;
      continue;
    }
    
    // Parse table rows (skip header and separator)
    if (inActiveQueue && line.startsWith('|') && !line.includes('---') && !line.includes('Topic')) {
      const parts = line.split('|').map(p => p.trim()).filter(p => p);
      
      if (parts.length >= 4) {
        const [num, topic, source, added, ...statusParts] = parts;
        const statusText = statusParts.join(' ');
        
        // Determine status
        let status = '⏳'; // Default pending
        let isArchived = false;
        let isResolved = false;
        
        if (statusText.includes('✅') || statusText.toLowerCase().includes('resolved') || 
            statusText.toLowerCase().includes('completed') || statusText.toLowerCase().includes('moved to')) {
          status = '✅';
          isResolved = true;
        } else if (statusText.includes('~~') || statusText.toLowerCase().includes('archived') ||
                   statusText.toLowerCase().includes('parked')) {
          status = '~~archived~~';
          isArchived = true;
        }
        
        // Extract topic text (remove bold/strikethrough markers)
        let cleanTopic = topic.replace(/\*\*/g, '').replace(/~~/g, '').trim();
        
        // Extract topic ID if referenced
        const topicIdMatch = topic.match(/#(\d+)/);
        const topicId = topicIdMatch ? parseInt(topicIdMatch[1]) : null;
        
        items.push({
          id: parseInt(num) || lineNumber,
          topic: cleanTopic,
          source,
          added,
          status,
          isResolved,
          isArchived,
          rawStatus: statusText,
          linkedTopics: topicId ? [topicId] : []
        });
      }
    }
  }
  
  return items;
}

// GET /api/btg-queue - List BTG queue items
router.get('/', async (req, res) => {
  try {
    const { status, filter } = req.query;
    
    // Read BTG_QUEUE.md
    if (!fs.existsSync(BTG_QUEUE_PATH)) {
      return res.json({ 
        count: 0, 
        items: [],
        message: 'BTG_QUEUE.md not found'
      });
    }
    
    const content = fs.readFileSync(BTG_QUEUE_PATH, 'utf8');
    let items = parseBTGQueue(content);
    
    // Apply status filter
    if (status) {
      items = items.filter(item => {
        if (status === 'active') return !item.isResolved && !item.isArchived;
        if (status === 'resolved') return item.isResolved && !item.isArchived;
        if (status === 'archived') return item.isArchived;
        if (status === 'pending') return !item.isResolved && !item.isArchived;
        return true;
      });
    }
    
    // Apply text filter
    if (filter) {
      const filterLower = filter.toLowerCase();
      items = items.filter(item => 
        item.topic.toLowerCase().includes(filterLower) ||
        item.source.toLowerCase().includes(filterLower)
      );
    }
    
    res.json({ 
      count: items.length,
      lastUpdated: fs.statSync(BTG_QUEUE_PATH).mtime,
      items 
    });
  } catch (error) {
    console.error('[BTG Queue API] Error:', error);
    res.status(500).json({ error: 'Failed to parse BTG queue' });
  }
});

// GET /api/btg-queue/stats - Get queue statistics
router.get('/stats', async (req, res) => {
  try {
    if (!fs.existsSync(BTG_QUEUE_PATH)) {
      return res.json({ 
        total: 0,
        active: 0,
        resolved: 0,
        archived: 0
      });
    }
    
    const content = fs.readFileSync(BTG_QUEUE_PATH, 'utf8');
    const items = parseBTGQueue(content);
    
    const stats = {
      total: items.length,
      active: items.filter(i => !i.isResolved && !i.isArchived).length,
      resolved: items.filter(i => i.isResolved && !i.isArchived).length,
      archived: items.filter(i => i.isArchived).length
    };
    
    res.json(stats);
  } catch (error) {
    console.error('[BTG Queue API] Stats error:', error);
    res.status(500).json({ error: 'Failed to get queue stats' });
  }
});

module.exports = router;