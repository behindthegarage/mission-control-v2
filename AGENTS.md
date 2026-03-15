# AGENTS.md - mission-control-v2

## Project Overview

**Name:** mission-control-v2  
**Category:** A — Local authoring, VPS runtime  
**Description:** Unified Mission Control dashboard for OpenClaw operations — Task Board, Memory Browser, Documents, Team/Agent Orchestration, and Pixel Office. Built with Next.js inspired by Alex Finn patterns.

## Canonical Hosts

| Environment | Host | Path |
|-------------|------|------|
| **Local Dev** | terminus-OptiPlex-7050 | `/home/openclaw/mission-control-v2-local` |
| **Production** | terminus-OptiPlex-7050 | Same as dev (local only) |
| **Version Control** | GitHub | `behindthegarage/mission-control-v2` |

**Access:**
- Local: `http://localhost:3000`
- LAN: `http://10.0.0.171:3000`

**Note:** Local-only deployment. No VPS, no tunnel, no public domain.

## Setup Commands

```bash
# Clone (one-time)
git clone https://github.com/behindthegarage/mission-control-v2.git mission-control-v2-local
cd mission-control-v2-local

# Install dependencies
# (Add project-specific setup here)
```

## Dev Commands

```bash
# Start local dev server
# (Add project-specific commands here)

# Run tests
# (Add test commands here)

# Health check
curl http://localhost:5000/health
```

## Deployment

**Model:** Local-only (no VPS, no tunnel)

Since Mission Control v2 runs exclusively on the OptiPlex, deployment is simply:

```bash
# 1. Edit locally, test
npm run dev

# 2. Commit and push (for backup/version control)
git add .
git commit -m "Description of changes"
git push origin main

# 3. Production = same as dev (just run on port 3000)
# No VPS deploy step needed!
```

**Optional:** Set up systemd service for auto-start on boot:
```bash
sudo systemctl enable mc-v2.service
sudo systemctl start mc-v2.service
```

## Verification Checklist

Before pushing:
- [ ] Local server starts without errors
- [ ] Health endpoint returns 200
- [ ] Tests pass

After deploy:
- [ ] Service restarted successfully
- [ ] Health check passes on production

## Known Traps

| Trap | Why | Prevention |
|------|-----|------------|
| (Add as discovered) | | |

## Docs Sync Rule

Update this file when:
- New routes/endpoints added
- Database schema changes
- Deploy process changes
- New environment variables needed
