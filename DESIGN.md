# DESIGN.md — Mission Control v2

> Based on Alex Finn's Mission Control patterns from:
> - "OpenClaw is 100x better with this tool (Mission Control)" (youtube.com/watch?v=RhLpV6QDBFE)
> - "OpenClaw Built This $250K Mission Control in a Single Prompt" (youtube.com/watch?v=aMQVcJHHRVM)
> - "Openclaw: Mission Control + Agent Teams" (youtube.com/watch?v=GpQcz_eKiNo)

---

## Vision

A unified operational dashboard where Hari (the OpenClaw agent) can build any tool needed on-the-fly, track all work, browse memories like a journal, manage sub-agents as a team, and visualize activity in a motivating interface.

**Core Principle:** Everything should be built via prompts, zero manual coding. The dashboard evolves with the workflow.

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

**Display Columns:**
| ID | Title | Category | Status | Added | Related |

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
  - Cost/usage metrics (if available)
- **Model Attribution** — Per-message model proof from JSONL
- **Filter/Search** — By model, agent type, status, date range

**Integration:**
- Polls OpenClaw sessions API
- Reads session history from JSONL
- Links sub-agents to parent sessions
- Shows spawn relationships

**Display:**
```
Session: telegram:-5184362671 (Mission Control)
├── Model: kimi-coding/k2p5
├── Started: 2026-03-15 16:20 EDT
├── Status: Active
└── Sub-Agents:
    ├── Spawn #1 (Builder) — gpt-5.4 — 12min ago — Running
    └── Spawn #2 (Researcher) — kimi-coding/k2p5 — 5min ago — Complete
```

---

## Removed Components (from Alex Finn original)

- ~~Team / Org Chart~~ — Not needed for current workflow
- ~~Pixel Art Office~~ — Removed for scope focus

---

## Technical Architecture

### Stack Decision

| Option | Pros | Cons |
|--------|------|------|
| **Next.js + React** (Alex Finn) | Modern, component-based, good for dashboards | Requires Node.js, build step |
| **Lovable.dev** (Alex Finn alt) | Fast visual building, hosted | Less control, external dependency |
| **Flask + Vanilla JS** (Current) | Simple, fits existing infra | Manual UI work |

**Decision:** Start with **Next.js + React** for frontend, keep existing **Express API** pattern for backend.

### Backend (API)

**Technology:** Node.js Express (proven, fits current collector pattern)

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

**Database:** SQLite (proven, simple, single file)

**Tables:**
- `tasks` — Kanban board state
- `projects` — Project metadata (synced with BTG)
- `documents` — Doc metadata (content stored as files)
- `sessions` — Session metadata from OpenClaw
- `subagents` — Sub-agent spawn records
- `activity_log` — Real-time activity stream

### Frontend

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

**State:** SWR for data fetching, real-time updates via polling

---

## Data Flow

```
OpenClaw Gateway
       ↓
MC Collector (polls CLI) → SQLite
       ↓
MC API (Express) ←→ Next.js Frontend
       ↓
User Dashboard
```

**Collector Responsibilities:**
- Poll OpenClaw for: sessions, spawns, crons, health
- Write to SQLite
- Parse BTG_QUEUE.md for project data
- Trigger activity log entries

**API Responsibilities:**
- Serve data to frontend
- Handle task mutations
- Proxy to OpenClaw when needed
- Write BTG status changes back to markdown

---

## Build Phases

### Phase 1: Foundation (Week 1)
- [ ] Set up Next.js project structure
- [ ] Create basic layout (sidebar navigation)
- [ ] Build Task Board (Kanban with drag-drop)
- [ ] Create Express API with SQLite
- [ ] Port/adapt existing collector logic
- [ ] Deploy initial version to VPS

### Phase 2: Knowledge Layer (Week 2)
- [ ] Memory Browser (read from `memory/` files)
- [ ] Documents Repository
- [ ] Project Screen + BTG Queue integration
- [ ] Calendar/Cron view

### Phase 3: Session & Agent Visibility (Week 3)
- [ ] Sessions list with active/recent
- [ ] Session detail view (conversation history)
- [ ] Sub-Agent tracking with model attribution
- [ ] Model use metrics/display

### Phase 4: Polish (Week 4)
- [ ] Mobile responsive
- [ ] Search across all content
- [ ] Performance optimization
- [ ] Real-time updates (WebSocket or polling)

---

## Reverse Prompting Strategy

Per Alex Finn's advice — after initial build, use reverse prompting to discover custom tools:

> "Based on what you know about me, our workflows, our mission statement, and our goals — what custom tools should we build in Mission Control that would make our work easier?"

This should yield tools specific to Adam's needs beyond the generic pattern.

---

## Integration Points

| External System | Integration |
|-----------------|-------------|
| OpenClaw Gateway | Collector polls for data |
| BTG Queue | Read/write `BTG_QUEUE.md` |
| Calendar Primary | Cron jobs appear on calendar |
| GitHub | Projects link to repos |
| Telegram | Activity notifications |
| Memory System | Read `memory/*.md` files |

---

## Success Metrics

1. **Visibility:** Can see all Hari activity in one place
2. **Autonomy:** Hari picks up tasks from board without prompting
3. **Memory:** Can find any past conversation or doc in < 30 seconds
4. **Focus:** Projects don't stall without visibility
5. **BTG Sync:** Queue status is always current
6. **Session Tracking:** Know which model handled which session

---

## Open Questions

1. Should we keep the existing collector or rebuild it?
2. Real-time updates: polling vs WebSocket?
3. Document storage: parse markdown in DB or scan filesystem?
4. BTG Queue: read-only or two-way sync?

---

*Design based on Alex Finn Mission Control patterns*
*Modified for BTG workflow — Sessions & Sub-Agent focus*
*Created: 2026-03-15*
