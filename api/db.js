/**
 * Database Connection Module
 * 
 * Provides SQLite database access with promise-based methods.
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

let db = null;

/**
 * Initialize database connection and run schema
 */
function initDB(dbPath) {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }
    
    // Ensure data directory exists
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    db = new sqlite3.Database(dbPath, async (err) => {
      if (err) {
        console.error('[DB] Failed to connect:', err);
        reject(err);
        return;
      }
      
      console.log('[DB] Connected to', dbPath);
      
      // Enable foreign keys
      db.run('PRAGMA foreign_keys = ON');
      
      // Run schema
      try {
        await runSchema();
        resolve(db);
      } catch (schemaErr) {
        reject(schemaErr);
      }
    });
  });
}

/**
 * Run database schema from SQL file
 */
function runSchema() {
  return new Promise((resolve, reject) => {
    const schemaPath = path.join(__dirname, '..', 'shared', 'schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      console.warn('[DB] Schema file not found:', schemaPath);
      resolve();
      return;
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    db.exec(schema, (err) => {
      if (err) {
        console.error('[DB] Failed to run schema:', err);
        reject(err);
      } else {
        console.log('[DB] Schema initialized');
        resolve();
      }
    });
  });
}

/**
 * Get database connection
 */
function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call initDB() first.');
  }
  return db;
}

/**
 * Close database connection
 */
function closeDB() {
  return new Promise((resolve, reject) => {
    if (!db) {
      resolve();
      return;
    }
    
    db.close((err) => {
      if (err) {
        reject(err);
      } else {
        db = null;
        console.log('[DB] Connection closed');
        resolve();
      }
    });
  });
}

// Promise wrapper methods
function promisifyDB(database) {
  return {
    get: (sql, params = []) => {
      return new Promise((resolve, reject) => {
        database.get(sql, params, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    },
    all: (sql, params = []) => {
      return new Promise((resolve, reject) => {
        database.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    },
    run: (sql, params = []) => {
      return new Promise((resolve, reject) => {
        database.run(sql, params, function(err) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID, changes: this.changes });
        });
      });
    }
  };
}

// Export wrapped methods
module.exports = {
  initDB,
  getDB: () => {
    const database = getDB();
    return { ...database, ...promisifyDB(database) };
  },
  closeDB
};
