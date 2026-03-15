/**
 * Calendar / Cron Jobs API Routes
 */
const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const util = require('util');
const path = require('path');

const execAsync = util.promisify(exec);

/**
 * Parse cron expression to get next run times
 * Basic parser for display purposes
 */
function parseCronExpression(expression) {
  const parts = expression.trim().split(/\s+/);
  if (parts.length < 5) return { description: 'Invalid cron expression' };
  
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  
  let description = [];
  
  // Time description
  if (minute === '0' && hour !== '*') {
    description.push(`at ${hour}:00`);
  } else if (minute !== '*' && hour !== '*') {
    description.push(`at ${hour}:${minute.padStart(2, '0')}`);
  }
  
  // Day description
  if (dayOfWeek === '*') {
    if (dayOfMonth === '*') {
      description.push('daily');
    }
  } else if (dayOfWeek === '1-5') {
    description.push('weekdays');
  } else if (dayOfWeek === '0,6' || dayOfWeek === '6,0') {
    description.push('weekends');
  }
  
  return { 
    description: description.join(' '),
    minute, hour, dayOfMonth, month, dayOfWeek 
  };
}

/**
 * Get cron jobs from OpenClaw crontab
 */
async function getOpenClawCrons() {
  const jobs = [];
  
  try {
    // Try to get OpenClaw crons from config
    const { stdout } = await execAsync('openclaw cron list --json 2>/dev/null || echo "[]"');
    const crons = JSON.parse(stdout || '[]');
    
    return crons.map((cron, index) => {
      const parsed = parseCronExpression(cron.schedule || cron.cron || '* * * * *');
      
      return {
        id: cron.id || `cron-${index}`,
        name: cron.name || cron.label || `Cron Job ${index + 1}`,
        schedule: cron.schedule || cron.cron,
        command: cron.command || cron.skill || 'Unknown command',
        description: cron.description || parsed.description,
        enabled: cron.enabled !== false,
        parsedSchedule: parsed,
        source: 'openclaw'
      };
    });
  } catch (error) {
    console.log('[Calendar API] Could not fetch OpenClaw crons:', error.message);
    
    // Fallback: try reading from common crontab locations
    try {
      const { stdout } = await execAsync('crontab -l 2>/dev/null || echo ""');
      const lines = stdout.split('\n');
      let id = 0;
      
      for (const line of lines) {
        if (line.trim() && !line.startsWith('#')) {
          const match = line.match(/^([\d*,/-]+)\s+([\d*,/-]+)\s+([\d*,/-]+)\s+([\d*,/-]+)\s+([\d*,/-]+)\s+(.+)$/);
          if (match) {
            const [, min, hr, dom, mon, dow, cmd] = match;
            const schedule = `${min} ${hr} ${dom} ${mon} ${dow}`;
            const parsed = parseCronExpression(schedule);
            
            jobs.push({
              id: `system-${id++}`,
              name: cmd.split(' ')[0].split('/').pop(),
              schedule,
              command: cmd,
              description: parsed.description,
              enabled: true,
              parsedSchedule: parsed,
              source: 'system'
            });
          }
        }
      }
    } catch (e) {
      // Ignore system cron errors
    }
    
    return jobs;
  }
}

// GET /api/calendar - List scheduled jobs
router.get('/', async (req, res) => {
  try {
    const { from, to } = req.query;
    
    const jobs = await getOpenClawCrons();
    
    res.json({
      count: jobs.length,
      dateRange: { from, to },
      jobs
    });
  } catch (error) {
    console.error('[Calendar API] Error:', error);
    res.status(500).json({ error: 'Failed to retrieve calendar data' });
  }
});

// GET /api/calendar/events - Get events for a date range
router.get('/events', async (req, res) => {
  try {
    const { start, end } = req.query;
    const jobs = await getOpenClawCrons();
    
    // Generate pseudo-events based on cron schedule
    // In a real implementation, you'd calculate actual occurrences
    const events = jobs.map(job => ({
      id: job.id,
      title: job.name,
      description: job.description,
      schedule: job.schedule,
      type: 'cron',
      source: job.source
    }));
    
    res.json({
      count: events.length,
      events
    });
  } catch (error) {
    console.error('[Calendar API] Events error:', error);
    res.status(500).json({ error: 'Failed to retrieve events' });
  }
});

module.exports = router;