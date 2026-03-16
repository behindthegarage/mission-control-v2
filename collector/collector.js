/**
 * Mission Control v2 Data Collector
 * 
 * Polls OpenClaw CLI and local files to populate the database.
 * Simplified from v1 - local only, no VPS/tunnel concerns.
 * 
 * Polling intervals:
 *   - Sessions: 30 seconds
 *   - BTG Queue: 60 seconds
 *   - Memory files: 5 minutes
 *   - Documents: 10 minutes
 */

const { exec } = require('child_process');
const util = require('util');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const execAsync = util.promisify(exec);

// Configuration
const CONFIG = {
  dbPath: process.env.MC_DB_PATH || path.join(__dirname, '..', 'api', 'data', 'mc_v2.db'),
  workspacePath: path.join(process.env.HOME, '.openclaw', 'workspace'),
  pollIntervals: {
    sessions: 30000,    // 30 seconds
    btgQueue: 60000,    // 60 seconds
    memories: 300000,   // 5 minutes
    documents: 600000   // 10 minutes
  }
};

let db = null;

// Promise wrapper for db methods
function promisifyDB(database) {
  return {
    get: (sql, params = []) => new Promise((resolve, reject) => {
      database.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
    }),
    all: (sql, params = []) => new Promise((resolve, reject) => {
      database.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
    }),
    run: (sql, params = []) => new Promise((resolve, reject) => {
      database.run(sql, params, function(err) {
        err ? reject(err) : resolve({ lastID: this.lastID, changes: this.changes });
      });
    })
  };
}

/**
 * Initialize database connection
 */
async function initDB() {
  const dataDir = path.dirname(CONFIG.dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(CONFIG.dbPath, (err) => {
      if (err) {
        reject(err);
      } else {
        db.run('PRAGMA foreign_keys = ON');
        console.log('[Collector] Connected to database');
        resolve(promisifyDB(db));
      }
    });
  });
}

/**
 * Run OpenClaw CLI command and return parsed JSON
 */
async function runOpenClawCommand(command) {
  try {
    const { stdout } = await execAsync(`openclaw ${command} --json`);
    return JSON.parse(stdout);
  } catch (error) {
    // If --json fails, try without
    try {
      const { stdout } = await execAsync(`openclaw ${command}`);
      return { raw: stdout.trim() };
    } catch (fallbackError) {
      console.error(`[Collector] Command failed: openclaw ${command}`, error.message);
      return null;
    }
  }
}

/**
 * Collect sessions from OpenClaw
 */
async function collectSessions() {
  try {
    console.log('[Collector] Collecting sessions...');
    
    const result = await runOpenClawCommand('sessions --json');
    if (!result || !result.sessions) {
      console.log('[Collector] No sessions found');
      return;
    }
    
    const sessions = Array.isArray(result) ? result : result.sessions || [];
    
    for (const session of sessions) {
      // Map OpenClaw session format to our database format
      const sessionKey = session.key;
      const label = sessionKey?.split(':').pop() || 'Untitled';
      const status = session.abortedLastRun ? 'aborted' : 'active';
      const model = session.modelProvider ? `${session.modelProvider}/${session.model}` : session.model;
      const modelRequested = session.modelProvider ? `${session.modelProvider}/${session.model}` : session.model;
      const startedAt = session.updatedAt ? new Date(session.updatedAt).toISOString() : new Date().toISOString();
      const channel = session.kind || 'unknown';
      
      // Check if session exists
      const existing = await db.get(
        'SELECT id FROM sessions WHERE session_key = ?',
        [sessionKey]
      );
      
      if (existing) {
        await db.run(
          `UPDATE sessions SET 
            label = ?, status = ?, model = ?, model_requested = ?, channel = ?,
            updated_at = CURRENT_TIMESTAMP
           WHERE session_key = ?`,
          [label, status, model, modelRequested, channel, sessionKey]
        );
      } else {
        await db.run(
          `INSERT INTO sessions (session_key, label, status, model, model_requested, started_at, channel)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [sessionKey, label, status, model, modelRequested, startedAt, channel]
        );
        
        console.log(`[Collector] New session: ${label}`);
      }
    }
    
    console.log(`[Collector] Processed ${sessions.length} sessions`);
  } catch (error) {
    console.error('[Collector] Error collecting sessions:', error.message);
  }
}

/**
 * Collect subagents from sessions
 */
async function collectSubagents() {
  try {
    console.log('[Collector] Collecting subagents...');
    
    // Get active sessions
    const sessions = await db.all(
      "SELECT session_key FROM sessions WHERE status = 'active'"
    );
    
    for (const session of sessions) {
      const result = await runOpenClawCommand(`sessions info ${session.session_key}`);
      if (!result) continue;
      
      // Look for subagents in session data
      const subagents = result.subagents || result.spawns || [];
      
      for (const subagent of subagents) {
        const existing = await db.get(
          'SELECT id FROM subagents WHERE session_key = ?',
          [subagent.id || subagent.session_key]
        );
        
        const subagentData = {
          key: subagent.id || subagent.session_key,
          parent: session.session_key,
          label: subagent.label || subagent.name || 'Untitled',
          status: subagent.status || 'pending',
          model: subagent.model,
          model_requested: subagent.model_requested,
          category: subagent.category,
          prompt_summary: subagent.prompt_summary,
          started_at: subagent.started_at
        };
        
        if (existing) {
          await db.run(
            `UPDATE subagents SET 
              status = ?, model = ?, prompt_summary = ?, updated_at = CURRENT_TIMESTAMP
             WHERE session_key = ?`,
            [subagentData.status, subagentData.model, subagentData.prompt_summary, subagentData.key]
          );
        } else {
          await db.run(
            `INSERT INTO subagents (session_key, parent_session, label, status, model, model_requested, category, prompt_summary, started_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [subagentData.key, subagentData.parent, subagentData.label, subagentData.status,
             subagentData.model, subagentData.model_requested, subagentData.category,
             subagentData.prompt_summary, subagentData.started_at]
          );
        }
      }
    }
  } catch (error) {
    console.error('[Collector] Error collecting subagents:', error.message);
  }
}

/**
 * Collect BTG Queue items
 */
async function collectBTGQueue() {
  try {
    console.log('[Collector] Collecting BTG Queue...');
    
    const btgPath = path.join(CONFIG.workspacePath, 'BTG_QUEUE.md');
    if (!fs.existsSync(btgPath)) {
      console.log('[Collector] BTG_QUEUE.md not found');
      return;
    }
    
    const content = fs.readFileSync(btgPath, 'utf8');
    
    // Parse markdown table
    const lines = content.split('\n');
    let inTable = false;
    const items = [];
    
    for (const line of lines) {
      if (line.startsWith('| Item |')) {
        inTable = true;
        continue;
      }
      if (inTable && line.startsWith('|')) {
        const cells = line.split('|').map(c => c.trim()).filter(Boolean);
        if (cells.length >= 3 && cells[0] !== 'Item') {
          items.push({
            name: cells[0],
            status: cells[1],
            notes: cells[2] || ''
          });
        }
      }
    }
    
    // Sync with projects
    for (const item of items) {
      const existing = await db.get(
        'SELECT id FROM projects WHERE btg_queue_item = ?',
        [item.name]
      );
      
      const btgStatus = item.status.includes('✅') ? '✅' : 
                        item.status.includes('⏳') ? '⏳' : '~~archived~~';
      
      if (existing) {
        await db.run(
          'UPDATE projects SET btg_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [btgStatus, existing.id]
        );
      } else if (!item.status.includes('~~')) {
        // Create new project for non-archived items
        await db.run(
          `INSERT INTO projects (name, status, btg_queue_item, btg_status, description)
           VALUES (?, 'pending', ?, ?, ?)`,
          [item.name, item.name, btgStatus, item.notes]
        );
        console.log(`[Collector] New project from BTG: ${item.name}`);
      }
    }
    
    console.log(`[Collector] Processed ${items.length} BTG items`);
  } catch (error) {
    console.error('[Collector] Error collecting BTG Queue:', error.message);
  }
}

/**
 * Collect memory files
 */
async function collectMemories() {
  try {
    console.log('[Collector] Collecting memories...');
    
    const memoryPath = path.join(CONFIG.workspacePath, 'memory');
    if (!fs.existsSync(memoryPath)) {
      console.log('[Collector] Memory directory not found');
      return;
    }
    
    const files = fs.readdirSync(memoryPath)
      .filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.md$/));
    
    for (const file of files) {
      const filePath = path.join(memoryPath, file);
      const date = file.replace('.md', '');
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Extract title (first h1) and summary
      const titleMatch = content.match(/^# (.+)$/m);
      const title = titleMatch ? titleMatch[1] : `Memory ${date}`;
      
      // Check if already indexed
      const existing = await db.get(
        'SELECT id FROM memories WHERE memory_date = ?',
        [date]
      );
      
      if (existing) {
        await db.run(
          'UPDATE memories SET title = ?, content_preview = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [title, content.substring(0, 1000), existing.id]
        );
      } else {
        await db.run(
          `INSERT INTO memories (memory_date, path, title, content_preview)
           VALUES (?, ?, ?, ?)`,
          [date, filePath, title, content.substring(0, 1000)]
        );
        console.log(`[Collector] Indexed memory: ${date}`);
      }
    }
    
    console.log(`[Collector] Processed ${files.length} memory files`);
  } catch (error) {
    console.error('[Collector] Error collecting memories:', error.message);
  }
}

/**
 * Collect documents from workspace
 */
async function collectDocuments() {
  try {
    console.log('[Collector] Collecting documents...');
    
    const docsPath = CONFIG.workspacePath;
    if (!fs.existsSync(docsPath)) {
      return;
    }
    
    const scanDirectory = (dir, relativePath = '') => {
      const items = [];
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const relPath = path.join(relativePath, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
          items.push(...scanDirectory(fullPath, relPath));
        } else if (file.endsWith('.md') || file.endsWith('.txt')) {
          items.push({
            path: fullPath,
            relativePath: relPath,
            title: file.replace(/\.[^/.]+$/, ''),
            content_type: file.endsWith('.md') ? 'markdown' : 'text',
            file_size: stat.size
          });
        }
      }
      
      return items;
    };
    
    const documents = scanDirectory(docsPath);
    
    for (const doc of documents) {
      const existing = await db.get(
        'SELECT id FROM documents WHERE path = ?',
        [doc.path]
      );
      
      if (!existing) {
        await db.run(
          `INSERT INTO documents (title, path, content_type, file_size)
           VALUES (?, ?, ?, ?)`,
          [doc.title, doc.path, doc.content_type, doc.file_size]
        );
      }
    }
    
    console.log(`[Collector] Processed ${documents.length} documents`);
  } catch (error) {
    console.error('[Collector] Error collecting documents:', error.message);
  }
}

/**
 * Main collector loop
 */
async function runCollector() {
  console.log('[Collector] Starting Mission Control v2 Collector...');
  console.log('[Collector] Database:', CONFIG.dbPath);
  
  await initDB();
  
  // Initial collection
  await collectSessions();
  await collectBTGQueue();
  await collectMemories();
  await collectDocuments();
  
  // Schedule recurring collections
  setInterval(collectSessions, CONFIG.pollIntervals.sessions);
  setInterval(collectSubagents, CONFIG.pollIntervals.sessions);
  setInterval(collectBTGQueue, CONFIG.pollIntervals.btgQueue);
  setInterval(collectMemories, CONFIG.pollIntervals.memories);
  setInterval(collectDocuments, CONFIG.pollIntervals.documents);
  
  console.log('[Collector] Running. Press Ctrl+C to stop.');
  console.log('[Collector] Polling intervals:');
  console.log(`  - Sessions: ${CONFIG.pollIntervals.sessions}ms`);
  console.log(`  - BTG Queue: ${CONFIG.pollIntervals.btgQueue}ms`);
  console.log(`  - Memories: ${CONFIG.pollIntervals.memories}ms`);
  console.log(`  - Documents: ${CONFIG.pollIntervals.documents}ms`);
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Collector] Shutting down...');
  if (db) db.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[Collector] Shutting down...');
  if (db) db.close();
  process.exit(0);
});

// Start collector
runCollector().catch(error => {
  console.error('[Collector] Fatal error:', error);
  process.exit(1);
});
