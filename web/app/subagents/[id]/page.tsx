'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { LayoutWithSidebar } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  ArrowLeft, 
  Bot,
  Activity, 
  Clock, 
  Hash, 
  Cpu, 
  Terminal,
  GitBranch,
  AlertCircle,
  FileText,
  Users
} from 'lucide-react';
import { subagentsAPI } from '@/lib/api';
import { 
  formatRelativeTime, 
  formatDuration, 
  formatDateTime,
  formatTokens,
  sessionStatusVariants,
  getModelColor
} from '@/lib/utils';

interface Sibling {
  session_key: string;
  label: string;
  status: string;
  started_at: string;
}

interface ParentSession {
  id: number;
  session_key: string;
  label: string;
  status: string;
}

interface SubagentData {
  id: number;
  session_key: string;
  parent_session: string;
  label: string;
  status: 'active' | 'completed' | 'failed' | 'cancelled' | 'pending';
  model: string;
  model_requested: string;
  category: string;
  prompt_summary: string;
  result_summary: string;
  error_message: string;
  started_at: string;
  completed_at: string;
  duration_ms: number;
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  metadata: any;
  parentSession: ParentSession | null;
  siblings: Sibling[];
}

const fetcher = (id: string) => subagentsAPI.get(id);

export default function SubagentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const subagentId = params.id as string;

  const { data: subagent, error, isLoading } = useSWR(
    ['subagent', subagentId],
    () => fetcher(subagentId),
    { refreshInterval: 5000 }
  );

  if (isLoading) {
    return (
      <LayoutWithSidebar>
        <div className="space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-64" />
        </div>
      </LayoutWithSidebar>
    );
  }

  if (error || !subagent) {
    return (
      <LayoutWithSidebar>
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h1 className="text-xl font-bold">Sub-Agent Not Found</h1>
          <p className="text-muted-foreground">The sub-agent you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/subagents')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sub-Agents
          </Button>
        </div>
      </LayoutWithSidebar>
    );
  }

  return (
    <LayoutWithSidebar>
      <div className="space-y-6">
        {/* Back Navigation */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/subagents')} className="-ml-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sub-Agents
          </Button>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Bot className="h-6 w-6 text-muted-foreground" />
              <h1 className="text-2xl font-bold">
                {subagent.label || 'Untitled Sub-Agent'}
              </h1>
              <Badge variant={sessionStatusVariants[subagent.status] || 'secondary'}>
                <div className="flex items-center gap-1">
                  {subagent.status === 'active' && (
                    <Activity className="h-3 w-3 animate-pulse" />
                  )}
                  {subagent.status}
                </div>
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="font-mono">{subagent.session_key}</span>
              {subagent.category && (
                <Badge variant="outline">{subagent.category}</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Model</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {subagent.model && (
                  <>
                    <span className={`inline-block w-2 h-2 rounded-full ${getModelColor(subagent.model)}`} />
                    <span className="text-lg font-semibold">{subagent.model}</span>
                  </>
                )}
              </div>
              {subagent.model_requested && subagent.model_requested !== subagent.model && (
                <p className="text-xs text-muted-foreground">
                  Requested: {subagent.model_requested}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Started</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {formatDateTime(subagent.started_at)}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatRelativeTime(subagent.started_at)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Duration</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">
                {formatDuration(subagent.duration_ms)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Token Usage</CardTitle>
              <Hash className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">
                {formatTokens(subagent.total_tokens)}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatTokens(subagent.input_tokens)} in / {formatTokens(subagent.output_tokens)} out
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Parent Session */}
        {subagent.parentSession && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Parent Session
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link 
                href={`/sessions/${subagent.parentSession.session_key}`}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <GitBranch className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">{subagent.parentSession.label || 'Untitled Session'}</p>
                  <p className="text-sm text-muted-foreground font-mono">
                    {subagent.parentSession.session_key}
                  </p>
                </div>
                <Badge variant={sessionStatusVariants[subagent.parentSession.status] || 'secondary'}>
                  {subagent.parentSession.status}
                </Badge>
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Prompt Summary */}
        {subagent.prompt_summary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Prompt Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{subagent.prompt_summary}</p>
            </CardContent>
          </Card>
        )}

        {/* Result Summary */}
        {subagent.result_summary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Result Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{subagent.result_summary}</p>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {subagent.error_message && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm text-destructive whitespace-pre-wrap">
                {subagent.error_message}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Siblings */}
        {subagent.siblings && subagent.siblings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Sibling Agents ({subagent.siblings.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subagent.siblings.map((sibling: Sibling) => (
                    <TableRow key={sibling.session_key}>
                      <TableCell>
                        <Link 
                          href={`/subagents/${sibling.session_key}`}
                          className="flex items-center gap-2 hover:underline"
                        >
                          <Bot className="h-4 w-4 text-muted-foreground" />
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {sibling.label || 'Untitled Agent'}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {sibling.session_key.slice(0, 8)}...
                            </span>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant={sessionStatusVariants[sibling.status] || 'secondary'}>
                          {sibling.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatRelativeTime(sibling.started_at)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </LayoutWithSidebar>
  );
}
