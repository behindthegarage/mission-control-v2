'use client';

import useSWR from 'swr';
import { LayoutWithSidebar } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Terminal, Activity } from 'lucide-react';
import { sessionsAPI } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';

const fetcher = () => sessionsAPI.list();

export default function SessionsPage() {
  const { data, error, isLoading } = useSWR('sessions', fetcher, {
    refreshInterval: 10000,
  });
  
  const sessions = data?.sessions || [];

  return (
    <LayoutWithSidebar>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Sessions</h1>
          <p className="text-muted-foreground">
            Active and recent OpenClaw sessions
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
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
                Sessions will appear here once the collector syncs with OpenClaw.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sessions.map((session: any) => (
              <Card key={session.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Terminal className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-base">{session.label || 'Untitled Session'}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      {session.status === 'active' && (
                        <Activity className="h-4 w-4 text-green-500 animate-pulse" />
                      )}
                      <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                        {session.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{session.session_key}</span>
                    {session.model && (
                      <Badge variant="outline" className="text-xs">
                        {session.model}
                      </Badge>
                    )}
                    {session.started_at && (
                      <span>{formatRelativeTime(session.started_at)}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </LayoutWithSidebar>
  );
}
