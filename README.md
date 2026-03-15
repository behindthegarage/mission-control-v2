# Mission Control v2

A unified operational dashboard for OpenClaw - running locally on OptiPlex.

![Mission Control Dashboard](https://img.shields.io/badge/Mission%20Control-v2-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![License](https://img.shields.io/badge/license-MIT-green)

## Overview

Mission Control v2 is a local-only dashboard for monitoring and managing your OpenClaw system. It provides a unified view of tasks, sessions, memories, documents, calendar jobs, and sub-agents.

**Key Features:**
- 📊 **Dashboard Overview** - Real-time stats and activity feed
- 📋 **Task Board** - Kanban board with drag-and-drop
- 📅 **Calendar** - View scheduled cron jobs
- 📁 **Projects** - BTG Queue management
- 🧠 **Memories** - Browse OpenClaw memories
- 📄 **Documents** - Central document repository
- 💻 **Sessions** - Active and historical session tracking
- 🤖 **Sub-Agents** - Spawned agent monitoring

## Architecture

```
OptiPlex (terminus-OptiPlex-7050)
├── OpenClaw Gateway (port 18789)
├── MC API (Express, port 3001)
├── MC Collector (polls OpenClaw → SQLite)
├── MC Frontend (Next.js dev server, port 3000)
└── SQLite DB (single file)
```

**Local only** — No VPS, no tunnel, no public domain.

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- OpenClaw Gateway running on port 18789

### Installation

```bash
# Clone or navigate to the project
cd ~/mission-control-v2-local

# Install all dependencies
npm run install:all

# Start everything (runs all 3 services)
npm run dev
```

Or start services individually:

```bash
# Terminal 1: API
npm run dev:api

# Terminal 2: Collector
npm run dev:collector

# Terminal 3: Web
npm run dev:web
```

### Access

Once running, open your browser:

- **Local:** http://localhost:3000
- **LAN:** http://10.0.0.171:3000
- **API:** http://localhost:3001

## Auto-Start Script

To automatically start Mission Control on boot, use the provided systemd service:

### Systemd Service (Recommended)

```bash
# Copy the service file
sudo cp scripts/mission-control.service /etc/systemd/system/

# Enable and start the service
sudo systemctl daemon-reload
sudo systemctl enable mission-control
sudo systemctl start mission-control

# Check status
sudo systemctl status mission-control

# View logs
sudo journalctl -u mission-control -f
```

### Manual Start Script

```bash
# Use the provided start script
./scripts/start-mission-control.sh

# Or stop it
./scripts/stop-mission-control.sh
```

## Project Structure

```
~/mission-control-v2-local/
├── api/                   # Express backend
│   ├── routes/            # API endpoints
│   ├── db.js              # SQLite setup
│   ├── server.js          # Express app
│   └── package.json
├── collector/             # OpenClaw data collector
│   ├── collector.js       # Main collector logic
│   └── package.json
├── web/                   # Next.js frontend
│   ├── app/               # Next.js app router
│   ├── components/        # React components
│   ├── lib/               # Utilities, API client
│   └── package.json
├── shared/                # Shared types/constants
│   └── schema.sql         # Database schema
├── scripts/               # Helper scripts
│   ├── start-mission-control.sh
│   ├── stop-mission-control.sh
│   └── mission-control.service
└── README.md
```

## Features

### Dashboard
- Real-time stats cards
- Recent memories preview
- Recent documents preview
- Scheduled jobs preview
- Quick action shortcuts

### Task Board
- Kanban with 4 columns: Backlog, In Progress, Review, Done
- Drag-and-drop to move tasks
- Task priorities and assignees (Human/Agent)
- Create new tasks inline

### Sessions
- Filter by status and time period
- Search by session key or label
- View session details with messages
- Sub-agent tracking per session
- Token usage and model attribution

### Calendar
- List view of scheduled cron jobs
- Monthly calendar view
- Job status (active/paused)
- Schedule descriptions

### Documents
- Category-based filtering
- Grid and list view modes
- Document preview
- Search by title or content

### Memories
- Date range filtering
- Full-text search
- Monthly grouping
- Individual memory view

### Sub-Agents
- Status filtering
- Parent session linking
- Token usage tracking
- Duration and completion stats

## API Endpoints

```
GET  /api/health              → System status
GET  /api/tasks               → List tasks
POST /api/tasks               → Create task
PUT  /api/tasks/:id           → Update task
GET  /api/sessions            → List sessions
GET  /api/sessions/:id        → Get session details
GET  /api/sessions/:id/messages → Get session messages
GET  /api/projects            → List projects
GET  /api/activity            → Activity feed
GET  /api/documents           → List documents
GET  /api/memories            → List memories
GET  /api/calendar            → List scheduled jobs
GET  /api/btg-queue           → List BTG queue items
GET  /api/subagents           → List sub-agents
```

## Mobile Support

Mission Control v2 is fully responsive:
- Mobile navigation drawer
- Touch-friendly kanban board
- Horizontal scroll for tables
- Adaptive stat cards
- Optimized for tablets and phones

## Dark Mode

Toggle dark mode using the moon/sun icon in the sidebar footer. Your preference is saved to localStorage.

## Development

### Adding shadcn components

```bash
cd web
npx shadcn add button card sidebar
```

### Database

The SQLite database is stored at `api/data/mc_v2.db`. Schema is in `shared/schema.sql`.

### Collector

The collector polls:
- Sessions: every 30 seconds
- BTG Queue: every 60 seconds
- Memories: every 5 minutes
- Documents: every 10 minutes

Edit `collector/collector.js` to adjust intervals or add new data sources.

### Environment Variables

Create a `.env` file in `web/` for frontend configuration:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Troubleshooting

### API not responding

```bash
# Check if API is running
curl http://localhost:3001/api/health

# Restart API
npm run dev:api
```

### Database issues

```bash
# Reset database (WARNING: deletes all data!)
rm api/data/mc_v2.db
# Then restart the API to recreate
```

### Port conflicts

If ports 3000 or 3001 are in use:

```bash
# Find and kill processes
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

## Design Decisions

- **Local only** — Primary use is at the OptiPlex, eliminates VPS complexity
- **SQLite** — Single file, no separate service needed
- **Polling** — Simpler than WebSocket for v1
- **Next.js** — Modern React with excellent component library
- **shadcn/ui** — Consistent, accessible UI components

## Credits

Based on Alex Finn's Mission Control patterns, modified for BTG workflow.

## License

MIT
