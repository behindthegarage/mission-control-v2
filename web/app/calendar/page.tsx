'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { LayoutWithSidebar } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  List,
  LayoutGrid
} from 'lucide-react';
import { calendarAPI } from '@/lib/api';
import { cn } from '@/lib/utils';

type ViewMode = 'month' | 'week' | 'list';

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const { data, error, isLoading } = useSWR(
    'calendar',
    () => calendarAPI.list(),
    { refreshInterval: 60000 }
  );
  
  const jobs = data?.jobs || [];
  
  // Group jobs by schedule type
  const groupedJobs = useMemo(() => {
    const groups: Record<string, any[]> = {
      daily: [],
      weekly: [],
      monthly: [],
      other: []
    };
    
    for (const job of jobs) {
      const schedule = job.schedule || '';
      const desc = (job.description || '').toLowerCase();
      
      if (desc.includes('daily') || schedule === '* * * * *') {
        groups.daily.push(job);
      } else if (desc.includes('week') || schedule.includes('1-5')) {
        groups.weekly.push(job);
      } else if (schedule.includes('1')) {
        groups.monthly.push(job);
      } else {
        groups.other.push(job);
      }
    }
    
    return groups;
  }, [jobs]);
  
  const formatSchedule = (schedule: string, description?: string) => {
    if (description) return description;
    
    const parts = schedule.split(' ');
    if (parts.length !== 5) return schedule;
    
    const [min, hour, dom, mon, dow] = parts;
    
    if (min === '0' && hour !== '*') {
      return `Daily at ${hour}:00`;
    }
    
    if (dow === '1-5') {
      return 'Weekdays';
    }
    
    return schedule;
  };
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Generate calendar days for month view
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    
    const days: Array<{ date: number | null; hasJob: boolean }> = [];
    
    // Empty cells for days before the 1st
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ date: null, hasJob: false });
    }
    
    // Days of the month
    for (let date = 1; date <= daysInMonth; date++) {
      // Simple check - in a real implementation, you'd calculate actual cron occurrences
      const hasJob = date === 1 || date % 7 === 0;
      days.push({ date, hasJob });
    }
    
    return days;
  };

  return (
    <LayoutWithSidebar>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CalendarIcon className="h-6 w-6 text-primary" />
              Calendar
            </h1>
            <p className="text-muted-foreground">
              View scheduled cron jobs and recurring tasks
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant={viewMode === 'list' ? 'secondary' : 'outline'} 
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4 mr-1" />
              List
            </Button>
            <Button 
              variant={viewMode === 'month' ? 'secondary' : 'outline'} 
              size="sm"
              onClick={() => setViewMode('month')}
            >
              <CalendarDays className="h-4 w-4 mr-1" />
              Month
            </Button>
          </div>
        </div>
        
        {/* Stats */}
        {!isLoading && !error && jobs.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{jobs.length}</div>
                <p className="text-xs text-muted-foreground">Total Jobs</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{groupedJobs.daily.length}</div>
                <p className="text-xs text-muted-foreground">Daily</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{groupedJobs.weekly.length}</div>
                <p className="text-xs text-muted-foreground">Weekly</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-500">
                  {jobs.filter((j: any) => j.enabled).length}
                </div>
                <p className="text-xs text-muted-foreground">Active</p>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : error ? (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">Failed to load calendar</p>
            </CardContent>
          </Card>
        ) : jobs.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                No Scheduled Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                No cron jobs found. Jobs will appear here once scheduled.
              </p>
            </CardContent>
          </Card>
        ) : viewMode === 'month' ? (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentDate(new Date())}
                  >
                    Today
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-7 gap-1">
                {dayNames.map(day => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
                
                {getCalendarDays().map((day, i) => (
                  <div
                    key={i}
                    className={cn(
                      "aspect-square p-2 border rounded-lg",
                      day.date ? "bg-card" : "bg-muted/50",
                      day.hasJob && "border-primary/50 bg-primary/5"
                    )}
                  >
                    {day.date && (
                      <>
                        <span className={cn(
                          "text-sm",
                          day.date === new Date().getDate() && 
                          currentDate.getMonth() === new Date().getMonth() &&
                          "font-bold text-primary"
                        )}>
                          {day.date}
                        </span>
                        {day.hasJob && (
                          <div className="flex gap-1 mt-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span>Has scheduled job</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Daily Jobs */}
            {groupedJobs.daily.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Daily Jobs
                </h2>
                <div className="space-y-2">
                  {groupedJobs.daily.map((job: any) => (
                    <CronJobCard key={job.id} job={job} formatSchedule={formatSchedule} />
                  ))}
                </div>
              </div>
            )}
            
            {/* Weekly Jobs */}
            {groupedJobs.weekly.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  Weekly Jobs
                </h2>
                <div className="space-y-2">
                  {groupedJobs.weekly.map((job: any) => (
                    <CronJobCard key={job.id} job={job} formatSchedule={formatSchedule} />
                  ))}
                </div>
              </div>
            )}
            
            {/* Other Jobs */}
            {groupedJobs.other.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <MoreHorizontal className="h-5 w-5 text-primary" />
                  Other Jobs
                </h2>
                <div className="space-y-2">
                  {groupedJobs.other.map((job: any) => (
                    <CronJobCard key={job.id} job={job} formatSchedule={formatSchedule} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </LayoutWithSidebar>
  );
}

function CronJobCard({ job, formatSchedule }: { job: any; formatSchedule: (s: string, d?: string) => string }) {
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="font-medium">{job.name}</h3>
              
              <Badge variant={job.enabled ? 'default' : 'secondary'} className="text-xs">
                {job.enabled ? (
                  <><Play className="h-3 w-3 mr-1" /> Active</>
                ) : (
                  <><Pause className="h-3 w-3 mr-1" /> Paused</>
                )}
              </Badge>
              
              <Badge variant="outline" className="text-xs">
                {job.source}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatSchedule(job.schedule, job.description)}
              </span>
            </div>
            
            <div className="mt-2 text-xs text-muted-foreground font-mono bg-muted p-2 rounded">
              {job.command}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}