# DESIGN.md — Mission Control v2

> Based on Alex Finn's Mission Control patterns from:
> - "OpenClaw is 100x better with this tool (Mission Control)" (youtube.com/watch?v=RhLpV6QDBFE)
> - "OpenClaw Built This $250K Mission Control in a Single Prompt" (youtube.com/watch?v=aMQVcJHHRVM)
> - "Openclaw: Mission Control + Agent Teams" (youtube.com/watch?v=GpQcz_eKiNo)

---

## Vision

A unified operational dashboard where Hari (the OpenClaw agent) can build any tool needed on-the-fly, track all work, browse memories like a journal, manage sub-agents as a team, and visualize activity in a fun, motivating interface.

**Core Principle:** Everything should be built via prompts, zero manual coding. The dashboard evolves with the workflow.

---

## Core Components (Alex Finn Pattern)

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

### 3. Project Screen
**Purpose:** Track major projects, prevent distraction, maintain focus.

**Features:**
- List of all active projects with progress indicators
- Link tasks, memories, documents to each project
- "Stalled project" detection (no activity in N days)
- Quick actions per project

**Integration:**
- Links to BTG queue/projects
- Hooks into task board, memory browser, documents

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

### 6. Team / Org Chart
**Purpose:** Visualize agent hierarchy, roles, and mission.

**Features:**
- Main agent (Hari) at top
- Sub-agents with roles (researcher, coder, writer, etc.)
- Device/model info for each agent
- Status indicators (active, idle, paused)
- **Mission Statement** — top-level goal all agents work toward

**Integration:**
- Pulls from OpenClaw sub-agent list
- Shows spawn history
- Model attribution per agent

### 7. Pixel Art Office (Optional but Fun)
**Purpose:** Visual representation of agents working. Purely motivational.

**Features:**
- 2D pixel art office view
- Agents move to desks when working
- Water cooler conversations between agents
- Visual confirmation of activity

**Integration:**
- Reads agent activity from task board
- Updates in real-time

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
GET  /api/projects            → Project list
GET  /api/memories            → Memory search/browse
GET  /api/documents           → Document list
GET  /api/team                → Agent/sub-agent list
GET  /api/activity            → Live activity feed
```

**Database:** SQLite (proven, simple, single file)

**Tables:**
- `tasks` — Kanban board state
- `projects` — Project metadata
- `documents` — Doc metadata (content stored as files)
- `activity_log` — Real-time activity stream

### Frontend

**Technology:** Next.js 15 + React + Tailwind CSS + shadcn/ui

**Pages:**
- `/` — Dashboard overview (stats, recent activity)
- `/tasks` — Task board (Kanban)
- `/calendar` — Calendar/cron view
- `/projects` — Project list
- `/projects/[id]` — Project detail
- `/memories` — Memory browser
- `/documents` — Document repository
- `/team` — Team/org chart
- `/office` — Pixel art office (optional)

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
- Trigger activity log entries

**API Responsibilities:**
- Serve data to frontend
- Handle task mutations
- Proxy to OpenClaw when needed

---

## Build Phases (Alex Finn 30-Day Pattern)

### Phase 1: Foundation (Week 1)
- [ ] Set up Next.js project structure
- [ ] Create basic layout (sidebar navigation)
- [ ] Build Task Board (Kanban with drag-drop)
- [ ] Integrate with existing collector data
- [ ] Deploy to VPS

### Phase 2: Knowledge Layer (Week 2)
- [ ] Memory Browser (read from `memory/` files)
- [ ] Documents Repository (scan workspace docs)
- [ ] Project Screen
- [ ] Calendar/Cron view

### Phase 3: Agent Orchestration (Week 3)
- [ ] Team/Org Chart
- [ ] Mission Statement display
- [ ] Activity feed
- [ ] Sub-agent management

### Phase 4: Polish (Week 4)
- [ ] Pixel Art Office (if time)
- [ ] Mobile responsiveness
- [ ] Search across all content
- [ ] Performance optimization

---

## Reverse Prompting Strategy

Per Alex Finn's advice — after initial build, use reverse prompting to discover custom tools:

> "Based on what you know about me, our workflows, our mission statement, and our goals — what custom tools should we build in Mission Control that would make our work easier?"

This should yield tools specific to Adam's needs beyond the generic Alex Finn pattern.

---

## Integration Points

| External System | Integration |
|-----------------|-------------|
| OpenClaw Gateway | Collector polls for data |
| BTG Queue | Projects sync to task board |
| Calendar Primary | Cron jobs appear on calendar |
| GitHub | Projects link to repos |
| Telegram | Activity notifications |

---

## Success Metrics

1. **Visibility:** Can see all Hari activity in one place
2. **Autonomy:** Hari picks up tasks from board without prompting
3. **Memory:** Can find any past conversation or doc in < 30 seconds
4. **Focus:** Projects don't stall without visibility
5. **Fun:** Actually want to check the dashboard

---

## Open Questions

1. Should we keep the existing collector or rebuild it?
2. Real-time updates: polling vs WebSocket?
3. Document storage: parse markdown in DB or scan filesystem?
4. Pixel art office: worth the effort or nice-to-have?

---

*Design based on Alex Finn Mission Control patterns*
*Created: 2026-03-15*
