/**
 * Memories API Routes
 * Reads memory files from filesystem
 */
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const MEMORY_DIR = path.join(process.env.HOME || '/home/openclaw', '.openclaw', 'workspace', 'memory');

/**
 * Parse memory filename to extract date
 */
function parseMemoryFilename(filename) {
  // Match patterns like 2026-02-15.md or 2026-02-15-session-notes.md
  const match = filename.match(/^(\d{4}-\d{2}-\d{2})(?:-(.+))?\.md$/);
  if (!match) return null;
  
  return {
    date: match[1],
    suffix: match[2] || null,
    filename
  };
}

/**
 * Extract preview content from markdown
 */
function extractPreview(content, maxLength = 300) {
  // Remove frontmatter if present
  let cleanContent = content.replace(/^---\n[\s\S]*?\n---\n/, '');
  
  // Remove markdown headers and formatting for preview
  cleanContent = cleanContent
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*|__/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n+/g, ' ')
    .trim();
  
  if (cleanContent.length <= maxLength) return cleanContent;
  return cleanContent.substring(0, maxLength) + '...';
}

/**
 * Extract key topics from memory content
 */
function extractTopics(content) {
  const topics = [];
  
  // Look for tags like #topic or [topic]
  const tagMatches = content.match(/#\w+/g);
  if (tagMatches) {
    topics.push(...tagMatches.map(t => t.slice(1)));
  }
  
  // Look for project references
  const projectMatches = content.match(/(?:project|#)\s*[:\-]?\s*([A-Za-z][A-Za-z0-9\s-]+)/gi);
  if (projectMatches) {
    topics.push(...projectMatches.map(m => m.replace(/project|#/gi, '').trim()));
  }
  
  return [...new Set(topics)].slice(0, 10);
}

// GET /api/memories - List memories from filesystem
router.get('/', async (req, res) => {
  try {
    const { date_from, date_to, search, limit = 50 } = req.query;
    
    // Check if memory directory exists
    if (!fs.existsSync(MEMORY_DIR)) {
      return res.json({ 
        count: 0, 
        memories: [],
        message: 'Memory directory not found'
      });
    }
    
    // Read all files from memory directory
    const files = fs.readdirSync(MEMORY_DIR)
      .filter(f => f.endsWith('.md'))
      .map(parseMemoryFilename)
      .filter(Boolean);
    
    // Sort by date descending
    files.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    let memories = [];
    
    for (const fileInfo of files.slice(0, parseInt(limit))) {
      const filePath = path.join(MEMORY_DIR, fileInfo.filename);
      
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const stats = fs.statSync(filePath);
        
        // Extract title (first h1 or filename)
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1] : fileInfo.filename.replace('.md', '');
        
        memories.push({
          date: fileInfo.date,
          filename: fileInfo.filename,
          title,
          preview: extractPreview(content),
          topics: extractTopics(content),
          size: stats.size,
          modifiedAt: stats.mtime,
          hasSuffix: !!fileInfo.suffix,
          suffix: fileInfo.suffix
        });
      } catch (e) {
        console.warn(`[Memories API] Could not read ${fileInfo.filename}:`, e.message);
      }
    }
    
    // Apply date filters
    if (date_from) {
      memories = memories.filter(m => m.date >= date_from);
    }
    if (date_to) {
      memories = memories.filter(m => m.date <= date_to);
    }
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      memories = memories.filter(m => 
        m.title.toLowerCase().includes(searchLower) ||
        m.preview.toLowerCase().includes(searchLower) ||
        m.topics.some(t => t.toLowerCase().includes(searchLower))
      );
    }
    
    res.json({ 
      count: memories.length,
      memories 
    });
  } catch (error) {
    console.error('[Memories API] Error:', error);
    res.status(500).json({ error: 'Failed to retrieve memories' });
  }
});

// GET /api/memories/:date - Get specific memory content
router.get('/:date', async (req, res) => {
  try {
    const { date } = req.params;
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    // Find file matching this date
    if (!fs.existsSync(MEMORY_DIR)) {
      return res.status(404).json({ error: 'Memory directory not found' });
    }
    
    const files = fs.readdirSync(MEMORY_DIR)
      .filter(f => f.startsWith(date) && f.endsWith('.md'));
    
    if (files.length === 0) {
      return res.status(404).json({ error: 'Memory not found for this date' });
    }
    
    // Read the first matching file (or all if multiple)
    const filePath = path.join(MEMORY_DIR, files[0]);
    const content = fs.readFileSync(filePath, 'utf8');
    const stats = fs.statSync(filePath);
    
    // Parse frontmatter if present
    let frontmatter = {};
    let body = content;
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (fmMatch) {
      const fmLines = fmMatch[1].split('\n');
      for (const line of fmLines) {
        const [key, ...valParts] = line.split(':');
        if (key && valParts.length > 0) {
          frontmatter[key.trim()] = valParts.join(':').trim();
        }
      }
      body = fmMatch[2];
    }
    
    res.json({
      date,
      filename: files[0],
      content: body,
      frontmatter,
      size: stats.size,
      modifiedAt: stats.mtime
    });
  } catch (error) {
    console.error('[Memories API] Get by date error:', error);
    res.status(500).json({ error: 'Failed to retrieve memory' });
  }
});

module.exports = router;