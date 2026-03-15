# Mission Control v2

A unified operational dashboard for OpenClaw - running locally on OptiPlex.

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

```bash
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

## Access

- **Local:** http://localhost:3000
- **LAN:** http://10.0.0.171:3000
- **API:** http://localhost:3001

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
└── README.md
```

## Features

### Phase 1 (Current)
- ✅ Next.js frontend with shadcn/ui
- ✅ Express API with SQLite
- ✅ Sidebar navigation
- ✅ Task Board (Kanban with drag-drop)
- ✅ Collector skeleton (polling OpenClaw)

### Phase 2 (Planned)
- Calendar/Cron view
- Memory browser
- Document repository
- BTG Queue integration

### Phase 3 (Planned)
- Session detail view
- Sub-agent tracking
- Model attribution

## API Endpoints

```
GET  /api/health              → System status
GET  /api/tasks               → List tasks
POST /api/tasks               → Create task
PUT  /api/tasks/:id           → Update task
GET  /api/sessions            → List sessions
GET  /api/projects            → List projects
GET  /api/activity            → Activity feed
GET  /api/documents           → List documents
GET  /api/memories            → List memories
```

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

## Design Decisions

- **Local only** — Primary use is at the OptiPlex, eliminates VPS complexity
- **SQLite** — Single file, no separate service needed
- **Polling** — Simpler than WebSocket for v1
- **Next.js** — Modern React with excellent component library

## Credits

Based on Alex Finn's Mission Control patterns, modified for BTG workflow.
