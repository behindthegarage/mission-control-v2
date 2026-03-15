# DESIGN.md — Mission Control v2

> Based on Alex Finn's Mission Control patterns from:
> - "OpenClaw is 100x better with this tool (Mission Control)" (youtube.com/watch?v=RhLpV6QDBFE)
> - "OpenClaw Built This $250K Mission Control in a Single Prompt" (youtube.com/watch?v=aMQVcJHHRVM)
> - "Openclaw: Mission Control + Agent Teams" (youtube.com/watch?v=GpQcz_eKiNo)

**Deployment: LOCAL ONLY** — Runs exclusively on OptiPlex. No VPS, no tunnel, no public domain.

---

## Vision

A unified operational dashboard running locally where Hari (the OpenClaw agent) can build any tool needed on-the-fly, track all work, browse memories like a journal, and visualize activity. Optimized for Adam's LAN-only workflow.

**Core Principle:** Everything should be built via prompts, zero manual coding. The dashboard evolves with the workflow.

---

## Deployment Model: Local Only

**Why local?**
- Primary use is while working at the OptiPlex
- Eliminates SSH tunnel complexity
- No VPS deployment steps
- Faster iteration (no rsync/deploy cycle)
- No public exposure = simpler security model

**Access:**
- Local: `http://localhost:3000`
- LAN: `http://10.0.0.171:3000` (from other devices on network)
- No external access needed

---

## Core Components

### 1. Task Board (Kanban)
**Purpose:** Track everything Hari is doing with visibility and autonomy.

**Features:**
- Kanban columns: Backlog → In Progress → Review → Done
- Task assignment: Human (A) vs Agent (H) indicators
- Live activity feed showing real-time agent actions
- Autonomous task pickup — Hari checks board on heartbeat, executes assigned tasks
- Task creation with natural language

**Integration:**
- OpenClaw heartbeat polls for tasks assigned to agent
- Tasks move automatically as work progresses
- Human review queue for approval

---

### 2. Calendar / Cron View
**Purpose:** Confirm OpenClaw is being proactive, visualize scheduled work.

**Features:**
- Calendar grid showing scheduled cron jobs and tasks
- Day/week/month views
- Task details on click (what, when, which agent)
- Confirm scheduled tasks actually exist (audit)

**Integration:**
- Reads from OpenClaw cron system
- Shows upcoming deadlines and reminders

---

### 3. Project Screen + BTG Queue Integration
**Purpose:** Track major projects, prevent distraction, maintain focus — **with BTG queue as the source of truth**.

**Features:**
- BTG Queue view — all queue items with status (⏳/✅/~~archived~~)
- Project cards linked to BTG items
- Progress indicators per project
- "Stalled project" detection (no activity in N days)
- Quick actions: promote to active, archive, create task
- Filter by: active, pending, resolved, archived

**BTG Integration:**
- Read directly from `BTG_QUEUE.md`
- Parse markdown table format
- Sync status changes back to BTG_QUEUE.md
- Auto-link projects to their BTG queue entry

---

### 4. Memory Browser
**Purpose:** Browse OpenClaw memories like a journal, find past conversations.

**Features:**
- Day-by-day memory view (like journal entries)
- Search across all memories
- Long-term memory document view
- Filter by project, topic, date range

**Integration:**
- Reads from `memory/YYYY-MM-DD.md` files
- Links memories to projects and tasks

---

### 5. Documents Repository
**Purpose:** Central home for all docs created by Hari (PRDs, plans, drafts, etc.).

**Features:**
- All generated docs in one place
- Categorization (plans, drafts, reports, etc.)
- Full-text search
- Project tagging
- Format indicators (markdown, PDF, etc.)

**Integration:**
- Auto-captures docs from sessions
- Links to projects and memories

---

### 6. Sessions & Sub-Agent Component (with Model Use)
**Purpose:** Track all active and recent sessions with full model attribution.

**Features:**
- **Active Sessions** — Live sessions currently running
- **Recent Sessions** — Completed/ended sessions (last 24h/7d/30d)
- **Session Detail View** — Full conversation history, tool calls, model overrides
- **Sub-Agent Tracking** — Spawned sub-agents with:
  - Agent role/purpose
  - Model used (actual vs requested)
  - Spawn time, duration, status
  - Parent session link
- **Model Attribution** — Per-message model proof from JSONL
- **Filter/Search** — By model, agent type, status, date range

**Integration:**
- Polls OpenClaw sessions API
- Reads session history from JSONL
- Links sub-agents to parent sessions

---

## Removed Components (from Alex Finn original)

- ~~Team / Org Chart~~ — Not needed for current workflow
- ~~Pixel Art Office~~ — Removed for scope focus

---

## Technical Architecture

### Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| **Frontend** | Next.js 15 + React + Tailwind + shadcn/ui | Modern, component-based |
| **Backend** | Node.js Express | Reuse existing collector patterns |
| **Database** | SQLite | Single file, no separate service |
| **Collector** | Node.js script | Polls OpenClaw CLI, writes to SQLite |

### Why Not Flask/Vanilla JS?

Could do it, but Next.js gives us:
- Modern component architecture
- Built-in routing
- Excellent UI component library (shadcn)
- Hot reload for fast iteration
- Still runs locally just fine

### Simplified Deployment (Local Only)

```
OptiPlex (terminus-OptiPlex-7050)
├── OpenClaw Gateway (port 18789)
├── MC Collector (polls CLI → SQLite)
├── MC API (Express, port 3001)
├── MC Frontend (Next.js dev server, port 3000)
└── SQLite DB (single file)
```

**No tunnel. No VPS. No public domain.**

---

## Backend (API)

**Technology:** Node.js Express

**Endpoints:**
```
GET  /api/health              → System status
GET  /api/tasks               → Task board data
POST /api/tasks               → Create new task
PUT  /api/tasks/:id           → Update task status
GET  /api/calendar            → Cron/scheduled tasks
GET  /api/projects            → Project list + BTG queue
GET  /api/memories            → Memory search/browse
GET  /api/documents           → Document list
GET  /api/sessions            → Active/recent sessions
GET  /api/sessions/:id        → Session detail
GET  /api/subagents           → Sub-agent list
GET  /api/activity            → Live activity feed
```

**Database:** SQLite

**Tables:**
- `tasks` — Kanban board state
- `projects` — Project metadata (synced with BTG)
- `documents` — Doc metadata (content stored as files)
- `sessions` — Session metadata from OpenClaw
- `subagents` — Sub-agent spawn records
- `activity_log` — Real-time activity stream

---

## Frontend

**Technology:** Next.js 15 + React + Tailwind CSS + shadcn/ui

**Pages:**
- `/` — Dashboard overview (stats, recent activity, active sessions)
- `/tasks` — Task board (Kanban)
- `/calendar` — Calendar/cron view
- `/projects` — Project list + BTG Queue integration
- `/projects/[id]` — Project detail
- `/memories` — Memory browser
- `/documents` — Document repository
- `/sessions` — Sessions & Sub-Agents (with model use)
- `/sessions/[id]` — Session detail view

**State:** SWR for data fetching, polling for updates

---

## Local Dev Workflow

```bash
# Terminal 1: Start the API
cd ~/mission-control-v2-local/api
npm run dev          # Express on port 3001

# Terminal 2: Start the collector
cd ~/mission-control-v2-local/collector
npm start            # Polls OpenClaw, writes to SQLite

# Terminal 3: Start the frontend
cd ~/mission-control-v2-local/web
npm run dev          # Next.js on port 3000

# Access:
# → http://localhost:3000 (local)
# → http://10.0.0.171:3000 (LAN)
```

---

## Build Phases (Accelerated — Local Only)

### Phase 1: Foundation (3-4 days)
- [ ] Initialize Next.js project with shadcn/ui
- [ ] Set up basic layout with sidebar navigation
- [ ] Build Express API with SQLite
- [ ] Build Task Board (Kanban)
- [ ] Port collector from v1 (simplified, no VPS concerns)

### Phase 2: Knowledge Layer (3-4 days)
- [ ] Memory Browser (read from `memory/` files)
- [ ] Documents Repository (scan workspace)
- [ ] Project Screen + BTG Queue integration (read/write BTG_QUEUE.md)
- [ ] Calendar/Cron view

### Phase 3: Session & Agent Visibility (3-4 days)
- [ ] Sessions list with active/recent
- [ ] Session detail view (conversation history)
- [ ] Sub-Agent tracking with model attribution
- [ ] Model use metrics/display

### Phase 4: Polish (2-3 days)
- [ ] Mobile responsive
- [ ] Search across all content
- [ ] Performance optimization
- [ ] Auto-start with systemd (optional)

**Total: ~2 weeks for full feature set**

---

## Reverse Prompting Strategy

After initial build, use reverse prompting to discover custom tools:

> "Based on what you know about me, our workflows, our mission statement, and our goals — what custom tools should we build in Mission Control that would make our work easier?"

---

## Integration Points

| External System | Integration |
|-----------------|-------------|
| OpenClaw Gateway | Collector polls local CLI |
| BTG Queue | Read/write `~/.openclaw/workspace/BTG_QUEUE.md` |
| Calendar Primary | Cron jobs from local OpenClaw |
| GitHub | Projects link to repos |
| Memory System | Read `~/.openclaw/workspace/memory/*.md` |
| Workspace Docs | Scan `~/.openclaw/workspace/` for docs |

---

## Success Metrics

1. **Visibility:** Can see all Hari activity in one place
2. **Autonomy:** Hari picks up tasks from board without prompting
3. **Memory:** Can find any past conversation or doc in < 30 seconds
4. **Focus:** Projects don't stall without visibility
5. **BTG Sync:** Queue status is always current
6. **Session Tracking:** Know which model handled which session
7. **Local Speed:** No deploy cycle, instant iteration

---

## Open Questions

1. Collector: port v1 or rewrite fresh?
2. Real-time updates: polling sufficient or want WebSocket?
3. BTG Queue: read-only first or two-way sync from start?
4. Auto-start: systemd service or manual start?

---

*Design based on Alex Finn Mission Control patterns*
*Modified for BTG workflow — Local-only deployment*
*Created: 2026-03-15*
