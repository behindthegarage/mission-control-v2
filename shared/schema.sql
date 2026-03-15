-- Mission Control v2 Database Schema
-- Phase 1: Foundation

-- Tasks table: Kanban board tasks
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK(status IN ('backlog', 'in_progress', 'review', 'done')) DEFAULT 'backlog',
    assignee TEXT CHECK(assignee IN ('human', 'agent')) DEFAULT 'human',
    priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    category TEXT,
    
    -- Relations
    project_id INTEGER,
    session_id TEXT,
    
    -- Metadata
    tags TEXT, -- JSON array
    metadata TEXT, -- JSON object
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    
    -- Position within column (for drag-drop ordering)
    position INTEGER DEFAULT 0
);

-- Projects table: Project tracking linked to BTG Queue
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK(status IN ('active', 'pending', 'stalled', 'completed', 'archived')) DEFAULT 'pending',
    
    -- BTG Queue integration
    btg_queue_item TEXT, -- Reference to BTG_QUEUE.md item
    btg_status TEXT CHECK(btg_status IN ('⏳', '✅', '~~archived~~')) DEFAULT '⏳',
    
    -- Progress tracking
    progress_percent INTEGER DEFAULT 0,
    last_activity_at DATETIME,
    
    -- Relations
    repo_url TEXT,
    docs_path TEXT,
    
    -- Metadata
    tags TEXT, -- JSON array
    metadata TEXT, -- JSON object
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table: OpenClaw session tracking
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_key TEXT UNIQUE NOT NULL,
    label TEXT,
    status TEXT CHECK(status IN ('active', 'completed', 'failed', 'idle')) DEFAULT 'active',
    
    -- Model info
    model TEXT,
    model_requested TEXT,
    
    -- Timing
    started_at DATETIME,
    ended_at DATETIME,
    duration_ms INTEGER,
    
    -- Activity
    message_count INTEGER DEFAULT 0,
    tool_calls INTEGER DEFAULT 0,
    
    -- Relations
    project_id INTEGER,
    task_id INTEGER,
    
    -- Metadata
    channel TEXT,
    metadata TEXT, -- JSON object
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
);

-- Sub-agents table: Spawned agent tracking
CREATE TABLE IF NOT EXISTS subagents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_key TEXT UNIQUE NOT NULL,
    parent_session TEXT NOT NULL,
    label TEXT,
    
    -- Model info
    model TEXT,
    model_requested TEXT,
    
    -- Status
    status TEXT CHECK(status IN ('active', 'completed', 'failed', 'cancelled', 'pending')) DEFAULT 'pending',
    category TEXT,
    
    -- Work summary
    prompt_summary TEXT,
    result_summary TEXT,
    error_message TEXT,
    
    -- Timing
    started_at DATETIME,
    completed_at DATETIME,
    duration_ms INTEGER,
    
    -- Token usage
    total_tokens INTEGER DEFAULT 0,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    
    -- Metadata
    metadata TEXT, -- JSON object
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parent_session) REFERENCES sessions(session_key) ON DELETE CASCADE
);

-- Activity log: Real-time activity stream
CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL, -- 'task_created', 'task_moved', 'session_started', 'subagent_spawned', etc.
    
    -- Actor
    actor_type TEXT CHECK(actor_type IN ('human', 'agent', 'system')) NOT NULL,
    actor_id TEXT,
    
    -- Target entity
    entity_type TEXT, -- 'task', 'session', 'subagent', 'project'
    entity_id TEXT,
    
    -- Details
    title TEXT,
    description TEXT,
    metadata TEXT, -- JSON object
    
    -- Session context
    session_key TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Documents table: Document metadata
CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    path TEXT NOT NULL,
    content_type TEXT, -- 'markdown', 'pdf', 'txt', etc.
    
    -- Relations
    project_id INTEGER,
    session_key TEXT,
    
    -- Metadata
    file_size INTEGER,
    tags TEXT, -- JSON array
    metadata TEXT, -- JSON object
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- Memories table: Indexed memory references
CREATE TABLE IF NOT EXISTS memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    memory_date DATE NOT NULL, -- The date from filename YYYY-MM-DD
    path TEXT NOT NULL,
    
    -- Extracted content summary
    title TEXT,
    summary TEXT,
    key_topics TEXT, -- JSON array
    
    -- Relations
    project_ids TEXT, -- JSON array of project IDs
    session_keys TEXT, -- JSON array of session keys
    
    -- Full-text search content
    content_preview TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Cron jobs table: Scheduled tasks
CREATE TABLE IF NOT EXISTS cron_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    schedule TEXT NOT NULL, -- Cron expression
    command TEXT NOT NULL,
    
    -- Status
    enabled BOOLEAN DEFAULT 1,
    last_run_at DATETIME,
    next_run_at DATETIME,
    last_run_status TEXT, -- 'success', 'failed', null
    last_run_output TEXT,
    
    -- Metadata
    description TEXT,
    metadata TEXT, -- JSON object
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_position ON tasks(status, position);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_btg ON projects(btg_queue_item);

CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_model ON sessions(model);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions(started_at);

CREATE INDEX IF NOT EXISTS idx_subagents_status ON subagents(status);
CREATE INDEX IF NOT EXISTS idx_subagents_parent ON subagents(parent_session);
CREATE INDEX IF NOT EXISTS idx_subagents_model ON subagents(model);

CREATE INDEX IF NOT EXISTS idx_activity_type ON activity_log(type);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_session ON activity_log(session_key);

CREATE INDEX IF NOT EXISTS idx_memories_date ON memories(memory_date);
CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id);

-- Trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS tasks_updated_at 
AFTER UPDATE ON tasks
BEGIN
    UPDATE tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS projects_updated_at 
AFTER UPDATE ON projects
BEGIN
    UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS sessions_updated_at 
AFTER UPDATE ON sessions
BEGIN
    UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
