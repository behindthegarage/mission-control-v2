'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { LayoutWithSidebar } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Terminal, Activity, Search, Clock, Hash, Cpu, ArrowRight } from 'lucide-react';
import { sessionsAPI } from '@/lib/api';
import { 
  formatRelativeTime, 
  formatDuration, 
  formatTokens,
  formatDateTime,
  sessionStatusVariants,
  getModelColor
} from '@/lib/utils';

interface Session {
  id: number;
  session_key: string;
  label: string;
  status: 'active' | 'completed' | 'failed' | 'idle';
  model: string;
  model_requested: string;
  started_at: string;
  ended_at: string;
  duration_ms: number;
  message_count: number;
  tool_calls: number;
  channel: string;
  metadata: any;
}

type FilterType = 'all' | 'active' | 'recent24h' | 'recent7d' | 'recent30d';

const fetcher = ([key, filter, search]: [string, FilterType, string]) => 
  sessionsAPI.list({ filter, search: search || undefined, limit: 100 });

export default function SessionsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { data, error, isLoading } = useSWR(
    ['sessions', filter, debouncedSearch] as [string, FilterType, string],
    fetcher,
    { refreshInterval: 10000 }
  );

  // Debounce search
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setTimeout(() => setDebouncedSearch(value), 300);
  };

  const sessions: Session[] = data?.sessions || [];

  const stats = useMemo(() => {
    const active = sessions.filter(s => s.status === 'active').length;
    const totalTokens = sessions.reduce((acc, s) => acc + (s.metadata?.totalTokens || 0), 0);
    const totalMessages = sessions.reduce((acc, s) => acc + (s.message_count || 0), 0);
    const uniqueModels = new Set(sessions.map(s => s.model).filter(Boolean)).size;
    
    return { active, totalTokens, totalMessages, uniqueModels };
  }, [sessions]);

  const handleRowClick = (sessionKey: string) => {
    router.push(`/sessions/${sessionKey}`);
  };

  return (
    <LayoutWithSidebar>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Sessions</h1>
            <p className="text-muted-foreground">
              Active and recent OpenClaw sessions
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '-' : stats.active}</div>
              <p className="text-xs text-muted-foreground">
                Currently running
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Terminal className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '-' : data?.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                In selected period
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages</CardTitle>
              <Hash className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '-' : formatTokens(stats.totalMessages)}</div>
              <p className="text-xs text-muted-foreground">
                Total exchanged
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Models</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '-' : stats.uniqueModels}</div>
              <p className="text-xs text-muted-foreground">
                Different AI models
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs & Search */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="recent24h">24h</TabsTrigger>
              <TabsTrigger value="recent7d">7d</TabsTrigger>
              <TabsTrigger value="recent30d">30d</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sessions..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Sessions Table */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : error ? (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">Failed to load sessions</p>
            </CardContent>
          </Card>
        ) : sessions.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                No Sessions Found
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {search 
                  ? 'No sessions match your search criteria.'
                  : 'Sessions will appear here once the collector syncs with OpenClaw.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Messages</TableHead>
                    <TableHead>Tools</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow
                      key={session.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(session.session_key)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {session.status === 'active' && (
                            <Activity className="h-3 w-3 text-green-500 animate-pulse" />
                          )}
                          <Badge variant={sessionStatusVariants[session.status] || 'secondary'}>
                            {session.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium truncate max-w-[200px]">
                            {session.label || 'Untitled Session'}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {session.session_key.slice(0, 8)}...
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {session.model && (
                          <div className="flex items-center gap-2">
                            <span className={`inline-block w-2 h-2 rounded-full ${getModelColor(session.model)}`} />
                            <span className="text-sm">{session.model}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(session.started_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDuration(session.duration_ms)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">
                          {session.message_count || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {session.tool_calls || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>
    </LayoutWithSidebar>
  );
}
