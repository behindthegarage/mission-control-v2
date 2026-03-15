'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
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
import { 
  Bot, 
  Activity, 
  Search, 
  Clock, 
  Hash, 
  Cpu, 
  ArrowRight,
  GitBranch,
  Terminal,
  BarChart3
} from 'lucide-react';
import { subagentsAPI } from '@/lib/api';
import { 
  formatRelativeTime, 
  formatDuration, 
  formatTokens,
  sessionStatusVariants,
  getModelColor
} from '@/lib/utils';

interface Subagent {
  id: number;
  session_key: string;
  parent_session: string;
  label: string;
  status: 'active' | 'completed' | 'failed' | 'cancelled' | 'pending';
  model: string;
  category: string;
  started_at: string;
  completed_at: string;
  duration_ms: number;
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  prompt_summary: string;
  result_summary: string;
  metadata: any;
}

type FilterType = 'all' | 'active' | 'completed' | 'failed' | 'pending';

const fetcher = ([key, filter, search]: [string, FilterType, string]) => 
  subagentsAPI.list({ 
    status: filter === 'all' ? undefined : filter,
    limit: 100 
  });

const statsFetcher = () => subagentsAPI.getStats();

export default function SubagentsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');

  const { data, error, isLoading } = useSWR(
    ['subagents', filter, search] as [string, FilterType, string],
    fetcher,
    { refreshInterval: 10000 }
  );

  const { data: stats } = useSWR('subagent-stats', statsFetcher, {
    refreshInterval: 30000
  });

  const subagents: Subagent[] = data?.subagents || [];

  // Filter by search term locally
  const filteredSubagents = useMemo(() => {
    if (!search) return subagents;
    const searchLower = search.toLowerCase();
    return subagents.filter(s => 
      s.label?.toLowerCase().includes(searchLower) ||
      s.session_key.toLowerCase().includes(searchLower) ||
      s.parent_session.toLowerCase().includes(searchLower)
    );
  }, [subagents, search]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: subagents.length };
    subagents.forEach(s => {
      counts[s.status] = (counts[s.status] || 0) + 1;
    });
    return counts;
  }, [subagents]);

  const handleRowClick = (sessionKey: string) => {
    router.push(`/subagents/${sessionKey}`);
  };

  return (
    <LayoutWithSidebar>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Sub-Agents</h1>
            <p className="text-muted-foreground">
              Spawned AI agents and their execution history
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
                <Bot className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatTokens(stats.tokenUsage?.total || 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
                <Activity className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.statusCounts?.find((s: any) => s.status === 'active')?.count || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <BarChart3 className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.statusCounts?.find((s: any) => s.status === 'completed')?.count || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Token Usage</CardTitle>
                <Hash className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatTokens(stats.tokenUsage?.total)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatTokens(stats.tokenUsage?.input)} in / {formatTokens(stats.tokenUsage?.output)} out
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filter Tabs & Search */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
            <TabsList>
              <TabsTrigger value="all">
                All {statusCounts.all > 0 && `(${statusCounts.all})`}
              </TabsTrigger>
              <TabsTrigger value="active">
                Active {statusCounts.active > 0 && `(${statusCounts.active})`}
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed {statusCounts.completed > 0 && `(${statusCounts.completed})`}
              </TabsTrigger>
              <TabsTrigger value="failed">
                Failed {statusCounts.failed > 0 && `(${statusCounts.failed})`}
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending {statusCounts.pending > 0 && `(${statusCounts.pending})`}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search agents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Subagents Table */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : error ? (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">Failed to load subagents</p>
            </CardContent>
          </Card>
        ) : filteredSubagents.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                No Sub-Agents Found
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {search 
                  ? 'No agents match your search criteria.'
                  : 'No sub-agents have been spawned yet.'}
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
                    <TableHead>Agent</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Parent Session</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Tokens</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubagents.map((subagent: Subagent) => (
                    <TableRow
                      key={subagent.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(subagent.session_key)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {subagent.status === 'active' && (
                            <Activity className="h-3 w-3 text-green-500 animate-pulse" />
                          )}
                          <Badge variant={sessionStatusVariants[subagent.status] || 'secondary'}>
                            {subagent.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <GitBranch className="h-4 w-4 text-muted-foreground" />
                          <div className="flex flex-col">
                            <span className="font-medium truncate max-w-[150px]">
                              {subagent.label || 'Untitled Agent'}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {subagent.session_key.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {subagent.model && (
                          <div className="flex items-center gap-2">
                            <span className={`inline-block w-2 h-2 rounded-full ${getModelColor(subagent.model)}`} />
                            <span className="text-sm">{subagent.model}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/sessions/${subagent.parent_session}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-2 hover:underline"
                        >
                          <Terminal className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm font-mono">
                            {subagent.parent_session.slice(0, 8)}...
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(subagent.started_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDuration(subagent.duration_ms)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">
                          {formatTokens(subagent.total_tokens)}
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
