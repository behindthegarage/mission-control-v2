/**
 * Mission Control v2 API Server
 * 
 * Express API with SQLite backend for local Mission Control dashboard.
 * 
 * Environment variables:
 *   - PORT: Server port (default: 3001)
 *   - MC_DB_PATH: Path to SQLite database (default: ./data/mc_v2.db)
 *   - NODE_ENV: 'development' or 'production'
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const { initDB } = require('./db');

// Import routes
const healthRoutes = require('./routes/health');
const tasksRoutes = require('./routes/tasks');
const sessionsRoutes = require('./routes/sessions');
const projectsRoutes = require('./routes/projects');
const activityRoutes = require('./routes/activity');
const documentsRoutes = require('./routes/documents');
const memoriesRoutes = require('./routes/memories');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Mount routes
app.use('/api/health', healthRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/memories', memoriesRoutes);

// Root API endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Mission Control v2 API',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      health: 'GET /api/health',
      tasks: {
        list: 'GET /api/tasks',
        create: 'POST /api/tasks',
        update: 'PUT /api/tasks/:id',
        delete: 'DELETE /api/tasks/:id'
      },
      sessions: 'GET /api/sessions',
      projects: 'GET /api/projects',
      activity: 'GET /api/activity',
      documents: 'GET /api/documents',
      memories: 'GET /api/memories'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.path} does not exist`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[API Error]', err);
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred'
  });
});

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database
    const dbPath = process.env.MC_DB_PATH || path.join(__dirname, 'data', 'mc_v2.db');
    await initDB(dbPath);
    console.log('[Server] Database initialized');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`[Server] Mission Control v2 API running on port ${PORT}`);
      console.log(`[Server] Health check: http://localhost:${PORT}/api/health`);
      console.log(`[Server] API docs: http://localhost:${PORT}/api`);
    });
    
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Server] SIGTERM received, shutting down gracefully');
  const { closeDB } = require('./db');
  await closeDB();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Server] SIGINT received, shutting down gracefully');
  const { closeDB } = require('./db');
  await closeDB();
  process.exit(0);
});

startServer();
