'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { LayoutWithSidebar } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Terminal, 
  Activity, 
  Clock, 
  Hash, 
  Cpu, 
  GitBranch,
  ChevronDown,
  ChevronRight,
  Bot,
  MessageSquare,
  Wrench,
  AlertCircle
} from 'lucide-react';
import { sessionsAPI } from '@/lib/api';
import { 
  formatRelativeTime, 
  formatDuration, 
  formatDateTime,
  formatTokens,
  sessionStatusVariants,
  getModelColor
} from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: any[];
  model?: string;
  timestamp: string;
  usage?: {
    input?: number;
    output?: number;
    totalTokens?: number;
  };
  stopReason?: string;
  errorMessage?: string;
  toolCalls?: any[];
  toolResults?: any[];
}

interface Subagent {
  id: number;
  session_key: string;
  label: string;
  status: string;
  model: string;
  started_at: string;
  completed_at: string;
  duration_ms: number;
  total_tokens: number;
  prompt_summary: string;
}

interface SessionData {
  id: number;
  session_key: string;
  label: string;
  status: 'active' | 'completed' | 'failed' | 'idle';
  model: string;
  started_at: string;
  ended_at: string;
  duration_ms: number;
  message_count: number;
  tool_calls: number;
  channel: string;
  metadata: any;
  subagents: Subagent[];
}

interface MessagesData {
  sessionId: string;
  total: number;
  messages: Message[];
  metadata: {
    session: any;
    models: any[];
    toolCalls: any[];
  };
}

const fetchSession = (id: string) => sessionsAPI.get(id);
const fetchMessages = (id: string) => sessionsAPI.getMessages(id, { limit: 100 });

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const { data: session, error: sessionError, isLoading: sessionLoading } = useSWR(
    ['session', sessionId],
    () => fetchSession(sessionId),
    { refreshInterval: 5000 }
  );

  const { data: messagesData, isLoading: messagesLoading } = useSWR(
    ['session-messages', sessionId],
    () => fetchMessages(sessionId)
  );

  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());

  const toggleMessage = (id: string) => {
    setExpandedMessages(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (sessionLoading) {
    return (
      <LayoutWithSidebar>
        <div className="space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-96" />
        </div>
      </LayoutWithSidebar>
    );
  }

  if (sessionError || !session) {
    return (
      <LayoutWithSidebar>
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h1 className="text-xl font-bold">Session Not Found</h1>
          <p className="text-muted-foreground">The session you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/sessions')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sessions
          </Button>
        </div>
      </LayoutWithSidebar>
    );
  }

  const messages = messagesData?.messages || [];

  return (
    <LayoutWithSidebar>
      <div className="space-y-6">
        {/* Back Navigation */}
        <Button variant="ghost" onClick={() => router.push('/sessions')} className="-ml-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Sessions
        </Button>

        {/* Session Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">
                {session.label || 'Untitled Session'}
              </h1>
              <Badge variant={sessionStatusVariants[session.status] || 'secondary'}>
                <div className="flex items-center gap-1">
                  {session.status === 'active' && (
                    <Activity className="h-3 w-3 animate-pulse" />
                  )}
                  {session.status}
                </div>
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="font-mono">{session.session_key}</span>
              {session.channel && (
                <Badge variant="outline">{session.channel}</Badge>
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
                {session.model && (
                  <>
                    <span className={`inline-block w-2 h-2 rounded-full ${getModelColor(session.model)}`} />
                    <span className="text-lg font-semibold">{session.model}</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Started</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {formatDateTime(session.started_at)}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatRelativeTime(session.started_at)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Duration</CardTitle>
              <Terminal className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">
                {formatDuration(session.duration_ms)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages</CardTitle>
              <Hash className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">
                {session.message_count || messages.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="messages" className="space-y-4">
          <TabsList>
            <TabsTrigger value="messages">
              <MessageSquare className="mr-2 h-4 w-4" />
              Messages ({messages.length})
            </TabsTrigger>
            <TabsTrigger value="subagents">
              <Bot className="mr-2 h-4 w-4" />
              Sub-Agents ({session.subagents?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-4">
            {messagesLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : messages.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No messages found in this session.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {messages.map((message: Message, index: number) => (
                  <Card 
                    key={message.id} 
                    className={`overflow-hidden ${message.role === 'user' ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-green-500'}`}
                  >
                    <CardHeader className="py-3 cursor-pointer hover:bg-muted/50" onClick={() => toggleMessage(message.id)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {expandedMessages.has(message.id) ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <Badge variant={message.role === 'user' ? 'default' : 'secondary'}>
                            {message.role}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            #{index + 1}
                          </span>
                          {message.model && (
                            <div className="flex items-center gap-1">
                              <span className={`inline-block w-2 h-2 rounded-full ${getModelColor(message.model)}`} />
                              <span className="text-xs text-muted-foreground">{message.model}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {message.usage?.totalTokens && (
                            <span>{formatTokens(message.usage.totalTokens)} tokens</span>
                          )}
                          <span>{formatRelativeTime(message.timestamp)}</span>
                        </div>
                      </div>
                    </CardHeader>
                    
                    {expandedMessages.has(message.id) && (
                      <CardContent className="pt-0 border-t">
                        <div className="pt-4 space-y-4">
                          {/* Content */}
                          <div className="space-y-2">
                            {Array.isArray(message.content) ? (
                              message.content.map((part, idx) => (
                                <div key={idx}>
                                  {part.type === 'text' && (
                                    <pre className="text-sm whitespace-pre-wrap font-mono bg-muted p-3 rounded-md overflow-auto max-h-96">
                                      {part.text}
                                    </pre>
                                  )}
                                  {part.type === 'thinking' && (
                                    <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md">
                                      <p className="text-xs font-semibold text-amber-600 mb-1">Thinking</p>
                                      <pre className="text-sm whitespace-pre-wrap font-mono text-amber-800 dark:text-amber-200">
                                        {part.thinking}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              ))
                            ) : (
                              <pre className="text-sm whitespace-pre-wrap font-mono bg-muted p-3 rounded-md">
                                {JSON.stringify(message.content, null, 2)}
                              </pre>
                            )}
                          </div>
                          
                          {/* Tool Calls */}
                          {message.toolCalls && message.toolCalls.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-semibold flex items-center gap-2">
                                <Wrench className="h-4 w-4" />
                                Tool Calls ({message.toolCalls.length})
                              </p>
                              {message.toolCalls.map((tc, idx) => (
                                <div key={idx} className="bg-muted p-3 rounded-md">
                                  <p className="text-sm font-medium">{tc.name}</p>
                                  <pre className="text-xs text-muted-foreground overflow-auto">
                                    {JSON.stringify(tc.arguments, null, 2)}
                                  </pre>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Error */}
                          {message.errorMessage && (
                            <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-md">
                              <p className="text-xs font-semibold text-red-600 mb-1">Error</p>
                              <p className="text-sm text-red-800 dark:text-red-200">{message.errorMessage}</p>
                            </div>
                          )}
                          
                          {/* Metadata */}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                            <span>ID: {message.id}</span>
                            {message.stopReason && <span>Stop: {message.stopReason}</span>}
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Subagents Tab */}
          <TabsContent value="subagents">
            {!session.subagents || session.subagents.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  No sub-agents spawned from this session.
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Tokens</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {session.subagents.map((subagent: Subagent) => (
                      <TableRow key={subagent.id}>
                        <TableCell>
                          <Link 
                            href={`/subagents/${subagent.session_key}`}
                            className="flex items-center gap-2 hover:underline"
                          >
                            <GitBranch className="h-4 w-4 text-muted-foreground" />
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {subagent.label || 'Untitled Agent'}
                              </span>
                              <span className="text-xs text-muted-foreground font-mono">
                                {subagent.session_key.slice(0, 8)}...
                              </span>
                            </div>
                          </Link>
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
                          <Badge variant={sessionStatusVariants[subagent.status] || 'secondary'}>
                            {subagent.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatRelativeTime(subagent.started_at)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatDuration(subagent.duration_ms)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {formatTokens(subagent.total_tokens)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </LayoutWithSidebar>
  );
}
