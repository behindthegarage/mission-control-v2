/**
 * Documents API Routes
 * Scans workspace for documents
 */
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const WORKSPACE_DIR = path.join(process.env.HOME || '/home/openclaw', '.openclaw', 'workspace');

/**
 * Get document category based on path and content
 */
function categorizeDocument(filePath, content = '') {
  const lowerPath = filePath.toLowerCase();
  
  if (lowerPath.includes('project') || lowerPath.includes('projects/')) return 'project';
  if (lowerPath.includes('plan') || content.toLowerCase().includes('## plan')) return 'plan';
  if (lowerPath.includes('draft') || lowerPath.includes('wip')) return 'draft';
  if (lowerPath.includes('report') || content.toLowerCase().includes('## report')) return 'report';
  if (lowerPath.includes('doc') || lowerPath.includes('docs/')) return 'documentation';
  if (lowerPath.includes('note') || lowerPath.includes('notes/')) return 'notes';
  if (lowerPath.includes('context/')) return 'context';
  if (lowerPath.includes('archive/')) return 'archive';
  
  return 'other';
}

/**
 * Extract title from document content
 */
function extractTitle(filePath, content) {
  // Try to find H1
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) return h1Match[1];
  
  // Try to find title in frontmatter
  const titleMatch = content.match(/^title:\s*(.+)$/m);
  if (titleMatch) return titleMatch[1];
  
  // Fall back to filename
  return path.basename(filePath, path.extname(filePath))
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Recursively scan directory for documents
 */
function scanDirectory(dir, basePath = WORKSPACE_DIR, results = []) {
  if (!fs.existsSync(dir)) return results;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(basePath, fullPath);
    
    // Skip hidden files and common non-doc directories
    if (entry.name.startsWith('.') || 
        entry.name === 'node_modules' ||
        entry.name === '__pycache__' ||
        entry.name === 'memory' ||  // Memories handled separately
        entry.name === '.git') {
      continue;
    }
    
    if (entry.isDirectory()) {
      scanDirectory(fullPath, basePath, results);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      
      // Include markdown, text, and PDF files
      if (['.md', '.txt', '.pdf', '.rst'].includes(ext)) {
        try {
          const stats = fs.statSync(fullPath);
          let content = '';
          let preview = '';
          
          // Read content for text files
          if (ext === '.md' || ext === '.txt') {
            try {
              content = fs.readFileSync(fullPath, 'utf8').substring(0, 5000);
              preview = content
                .replace(/^---[\s\S]*?---/, '')
                .replace(/#{1,6}\s+/g, '')
                .replace(/\*\*|__/g, '')
                .replace(/\n+/g, ' ')
                .trim()
                .substring(0, 200);
            } catch (e) {
              // Binary or unreadable file
            }
          }
          
          results.push({
            path: relativePath,
            filename: entry.name,
            extension: ext,
            size: stats.size,
            modifiedAt: stats.mtime,
            createdAt: stats.birthtime,
            category: categorizeDocument(relativePath, content),
            title: extractTitle(relativePath, content),
            preview: preview || null,
            isBinary: ext === '.pdf'
          });
        } catch (e) {
          console.warn(`[Documents API] Could not stat ${fullPath}:`, e.message);
        }
      }
    }
  }
  
  return results;
}

// GET /api/documents - List documents
router.get('/', async (req, res) => {
  try {
    const { category, search, type, project_id } = req.query;
    
    let documents = scanDirectory(WORKSPACE_DIR);
    
    // Filter by category
    if (category) {
      documents = documents.filter(d => d.category === category);
    }
    
    // Filter by file type
    if (type) {
      documents = documents.filter(d => d.extension === `.${type}`);
    }
    
    // Filter by project (simple path matching)
    if (project_id) {
      documents = documents.filter(d => 
        d.path.toLowerCase().includes(project_id.toLowerCase())
      );
    }
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      documents = documents.filter(d => 
        d.title.toLowerCase().includes(searchLower) ||
        d.filename.toLowerCase().includes(searchLower) ||
        (d.preview && d.preview.toLowerCase().includes(searchLower)) ||
        d.path.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort by modified date
    documents.sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt));
    
    res.json({ 
      count: documents.length,
      documents 
    });
  } catch (error) {
    console.error('[Documents API] Error:', error);
    res.status(500).json({ error: 'Failed to retrieve documents' });
  }
});

// GET /api/documents/categories - Get document categories
router.get('/categories', async (req, res) => {
  try {
    const documents = scanDirectory(WORKSPACE_DIR);
    const categories = {};
    
    for (const doc of documents) {
      categories[doc.category] = (categories[doc.category] || 0) + 1;
    }
    
    res.json({
      categories: Object.entries(categories).map(([name, count]) => ({ name, count }))
    });
  } catch (error) {
    console.error('[Documents API] Categories error:', error);
    res.status(500).json({ error: 'Failed to retrieve categories' });
  }
});

// GET /api/documents/content/:path - Get document content
router.get('/content/*', async (req, res) => {
  try {
    const filePath = req.params[0];
    const fullPath = path.join(WORKSPACE_DIR, filePath);
    
    // Security check - ensure path is within workspace
    if (!fullPath.startsWith(WORKSPACE_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    const stats = fs.statSync(fullPath);
    if (!stats.isFile()) {
      return res.status(400).json({ error: 'Not a file' });
    }
    
    const ext = path.extname(fullPath).toLowerCase();
    
    if (ext === '.pdf') {
      // For PDFs, return metadata only
      res.json({
        path: filePath,
        type: 'pdf',
        size: stats.size,
        message: 'PDF files are not viewable in browser'
      });
    } else {
      // Read text content
      const content = fs.readFileSync(fullPath, 'utf8');
      
      res.json({
        path: filePath,
        type: ext === '.md' ? 'markdown' : 'text',
        content,
        size: stats.size,
        modifiedAt: stats.mtime
      });
    }
  } catch (error) {
    console.error('[Documents API] Content error:', error);
    res.status(500).json({ error: 'Failed to retrieve document content' });
  }
});

module.exports = router;