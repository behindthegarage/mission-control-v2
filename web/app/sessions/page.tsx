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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Activity, Search, Clock, Hash, Cpu, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
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

  const { data, error, isLoading, mutate } = useSWR(
    ['sessions', filter, debouncedSearch] as [string, FilterType, string],
    fetcher,
    { 
      refreshInterval: 10000,
      onError: () => {},
    }
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

  const handleRetry = () => {
    mutate();
  };

  return (
    <LayoutWithSidebar>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Sessions</h1>
            <p className="text-muted-foreground">
              Active and recent OpenClaw sessions
            </p>
          </div>
        </div>

        {/* Stats Cards - Responsive Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Active</CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{isLoading ? '-' : stats.active}</div>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Currently running
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total</CardTitle>
              <Terminal className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{isLoading ? '-' : data?.total || 0}</div>
              <p className="text-xs text-muted-foreground hidden sm:block">
                In period
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Messages</CardTitle>
              <Hash className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{isLoading ? '-' : formatTokens(stats.totalMessages)}</div>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Exchanged
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Models</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{isLoading ? '-' : stats.uniqueModels}</div>
              <p className="text-xs text-muted-foreground hidden sm:block">
                AI models
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="animate-in fade-in">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Failed to Load Sessions</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>Unable to fetch session data from the API.</span>
              <Button variant="ghost" size="sm" onClick={handleRetry}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Filter Tabs & Search */}
        <div className="flex flex-col gap-4">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="recent24h">24h</TabsTrigger>
              <TabsTrigger value="recent7d">7d</TabsTrigger>
              <TabsTrigger value="recent30d">30d</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sessions..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Sessions Table - Mobile optimized */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 sm:h-12" />
            ))}
          </div>
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
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Status</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead className="hidden sm:table-cell">Model</TableHead>
                    <TableHead className="hidden md:table-cell">Started</TableHead>
                    <TableHead className="hidden lg:table-cell">Duration</TableHead>
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
                            <Activity className="h-3 w-3 text-green-500 animate-pulse flex-shrink-0" />
                          )}
                          <Badge variant={sessionStatusVariants[session.status] || 'secondary'} className="text-xs whitespace-nowrap">
                            {session.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium truncate max-w-[150px] sm:max-w-[200px]">
                            {session.label || 'Untitled'}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {session.session_key.slice(0, 8)}...
                          </span>
                          {/* Mobile-only info */}
                          <div className="sm:hidden text-xs text-muted-foreground mt-1">
                            {session.model && (
                              <span className="flex items-center gap-1">
                                <span className={`inline-block w-1.5 h-1.5 rounded-full ${getModelColor(session.model)}`} />
                                {session.model}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {session.model && (
                          <div className="flex items-center gap-2">
                            <span className={`inline-block w-2 h-2 rounded-full ${getModelColor(session.model)}`} />
                            <span className="text-sm">{session.model}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          {formatRelativeTime(session.started_at)}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {formatDuration(session.duration_ms)}
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
