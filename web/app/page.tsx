'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { LayoutWithSidebar } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Activity, 
  CheckCircle2, 
  Clock, 
  FolderKanban,
  Brain,
  FileText,
  Calendar,
  ListTodo,
  ArrowRight,
  Terminal
} from 'lucide-react';
import { tasksAPI, sessionsAPI, projectsAPI, memoriesAPI, documentsAPI, btgQueueAPI, calendarAPI } from '@/lib/api';

export default function DashboardPage() {
  const { data: tasksData, isLoading: tasksLoading } = useSWR('dashboard-tasks', () => tasksAPI.list(), { refreshInterval: 30000 });
  const { data: sessionsData, isLoading: sessionsLoading } = useSWR('dashboard-sessions', () => sessionsAPI.list(), { refreshInterval: 30000 });
  const { data: projectsData, isLoading: projectsLoading } = useSWR('dashboard-projects', () => projectsAPI.list(), { refreshInterval: 60000 });
  const { data: btgStats, isLoading: btgLoading } = useSWR('dashboard-btg-stats', () => btgQueueAPI.getStats(), { refreshInterval: 120000 });
  const { data: memoriesData, isLoading: memoriesLoading } = useSWR('dashboard-memories', () => memoriesAPI.list({ limit: 5 }), { refreshInterval: 300000 });
  const { data: documentsData, isLoading: documentsLoading } = useSWR('dashboard-documents', () => documentsAPI.list({}), { refreshInterval: 300000 });
  const { data: calendarData, isLoading: calendarLoading } = useSWR('dashboard-calendar', () => calendarAPI.list(), { refreshInterval: 60000 });
  
  const tasks = tasksData?.tasks || [];
  const sessions = sessionsData?.sessions || [];
  const projects = projectsData?.projects || [];
  const memories = memoriesData?.memories || [];
  const documents = documentsData?.documents || [];
  const jobs = calendarData?.jobs || [];
  
  const activeTasks = tasks.filter((t: any) => t.status === 'in_progress').length;
  const pendingTasks = tasks.filter((t: any) => t.status === 'backlog').length;
  const activeSessions = sessions.filter((s: any) => s.status === 'active').length;

  return (
    <LayoutWithSidebar>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your Mission Control system
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Active Tasks"
            value={tasksLoading ? null : activeTasks}
            subtitle={`${pendingTasks} pending`}
            icon={CheckCircle2}
            href="/tasks"
          />
          
          <StatCard
            title="In Progress"
            value={tasksLoading ? null : activeTasks}
            subtitle="Currently being worked on"
            icon={Clock}
            href="/tasks"
          />
          
          <StatCard
            title="Active Sessions"
            value={sessionsLoading ? null : activeSessions}
            subtitle="OpenClaw sessions"
            icon={Activity}
            href="/sessions"
          />
          
          <StatCard
            title="BTG Queue"
            value={btgLoading ? null : btgStats?.active || 0}
            subtitle={`${btgStats?.resolved || 0} resolved`}
            icon={ListTodo}
            href="/projects"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Memories */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Recent Memories
              </CardTitle>
              <Link href="/memories">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {memoriesLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : memories.length === 0 ? (
                <p className="text-sm text-muted-foreground">No memories found.</p>
              ) : (
                <div className="space-y-2">
                  {memories.slice(0, 5).map((memory: any) => (
                    <Link 
                      key={memory.filename}
                      href={`/memories?date=${memory.date}`}
                      className="block p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate">{memory.title}</span>
                        <span className="text-xs text-muted-foreground">{memory.date}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                        {memory.preview}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Documents */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Recent Documents
              </CardTitle>
              <Link href="/documents">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {documentsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No documents found.</p>
              ) : (
                <div className="space-y-2">
                  {documents.slice(0, 5).map((doc: any) => (
                    <Link 
                      key={doc.path}
                      href={`/documents?path=${encodeURIComponent(doc.path)}`}
                      className="block p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate">{doc.title}</span>
                        <Badge variant="outline" className="text-xs">{doc.category}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {doc.path}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Scheduled Jobs Preview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Scheduled Jobs
              </CardTitle>
              <Link href="/calendar">
                <Button variant="ghost" size="sm">
                  View Calendar
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {calendarLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : jobs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No scheduled jobs found.</p>
              ) : (
                <div className="space-y-2">
                  {jobs.slice(0, 5).map((job: any) => (
                    <div 
                      key={job.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted"
                    >
                      <div>
                        <span className="font-medium">{job.name}</span>
                        <p className="text-xs text-muted-foreground">{job.description || job.schedule}</p>
                      </div>
                      <Badge variant={job.enabled ? 'default' : 'secondary'} className="text-xs">
                        {job.enabled ? 'Active' : 'Paused'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/tasks">
                  <Button variant="outline" className="w-full justify-start">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    View Tasks
                  </Button>
                </Link>
                
                <Link href="/projects">
                  <Button variant="outline" className="w-full justify-start">
                    <FolderKanban className="h-4 w-4 mr-2" />
                    BTG Queue
                  </Button>
                </Link>
                
                <Link href="/memories">
                  <Button variant="outline" className="w-full justify-start">
                    <Brain className="h-4 w-4 mr-2" />
                    Browse Memories
                  </Button>
                </Link>
                
                <Link href="/sessions">
                  <Button variant="outline" className="w-full justify-start">
                    <Activity className="h-4 w-4 mr-2" />
                    Check Sessions
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </LayoutWithSidebar>
  );
}

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  href 
}: { 
  title: string; 
  value: number | null; 
  subtitle: string; 
  icon: any;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {value === null ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <div className="text-2xl font-bold">{value}</div>
          )}
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </CardContent>
      </Card>
    </Link>
  );
}