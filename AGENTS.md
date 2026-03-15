# AGENTS.md - mission-control-v2

## Project Overview

**Name:** mission-control-v2  
**Category:** A — Local authoring, VPS runtime  
**Description:** Unified Mission Control dashboard for OpenClaw operations — Task Board, Memory Browser, Documents, Team/Agent Orchestration, and Pixel Office. Built with Next.js inspired by Alex Finn patterns.

## Canonical Hosts

| Environment | Host | Path |
|-------------|------|------|
| **Local Dev** | terminus-OptiPlex-7050 | `/home/openclaw/mission-control-v2-local` |
| **VPS Runtime** | p5gHxcyh7WDx (162.212.153.134) | `/home/openclaw/mission-control-v2/` |
| **Version Control** | GitHub | `behindthegarage/mission-control-v2` |

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

**Model:** Controlled VPS pull (manual deploy after GitHub push)

```bash
# 1. Edit locally, test
# 2. Commit and push
git add .
git commit -m "Description of changes"
git push origin main

# 3. SSH to VPS and deploy
ssh openclaw@162.212.153.134
cd /home/openclaw/mission-control-v2
git pull origin main
# (Add service restart if applicable)

# 4. Verify
curl https://your-domain.com/health
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
