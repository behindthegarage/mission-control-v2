'use client';

import useSWR from 'swr';
import { useState } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LayoutWithSidebar } from '@/components/layout';
import { KanbanBoard } from '@/components/kanban-board';
import { tasksAPI } from '@/lib/api';

interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'backlog' | 'in_progress' | 'review' | 'done';
  assignee: 'human' | 'agent';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  position: number;
}

const fetcher = () => tasksAPI.list();

export default function TasksPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { data, error, isLoading, mutate } = useSWR('tasks', fetcher, {
    refreshInterval: 5000,
    onError: (err) => {
      setErrorMessage(err?.message || 'Failed to load tasks');
    },
  });
  
  const tasks: Task[] = data?.tasks || [];

  const handleTaskMove = async (taskId: number, newStatus: string) => {
    try {
      setErrorMessage(null);
      await tasksAPI.update(taskId, { status: newStatus });
      mutate();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to move task');
    }
  };

  const handleTaskReorder = async (reorderedTasks: Task[]) => {
    try {
      setErrorMessage(null);
      for (let i = 0; i < reorderedTasks.length; i++) {
        await tasksAPI.update(reorderedTasks[i].id, { position: i });
      }
      mutate();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to reorder tasks');
    }
  };

  const handleCreateTask = async () => {
    try {
      setErrorMessage(null);
      await tasksAPI.create({
        title: 'New Task',
        description: 'Click to edit this task',
        status: 'backlog',
        assignee: 'human',
        priority: 'medium',
      });
      mutate();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to create task');
    }
  };

  const dismissError = () => setErrorMessage(null);

  if (isLoading) {
    return (
      <LayoutWithSidebar>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-28" />
          </div>
          <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[500px]" />
            ))}
          </div>
          <div className="md:hidden space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </LayoutWithSidebar>
    );
  }

  if (error && !tasks.length) {
    return (
      <LayoutWithSidebar>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error Loading Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Failed to load tasks. Please check that the API is running on port 3001.
            </p>
            <Button onClick={() => mutate()} variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      </LayoutWithSidebar>
    );
  }

  return (
    <LayoutWithSidebar>
      <div className="space-y-4">
        {/* Error Alert */}
        {errorMessage && (
          <Alert variant="destructive" className="animate-in fade-in">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{errorMessage}</span>
              <Button variant="ghost" size="sm" onClick={dismissError}>
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Task Board</h1>
            <p className="text-muted-foreground">
              Manage tasks and track progress across all projects
            </p>
          </div>
          <Button onClick={handleCreateTask} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </div>

        <KanbanBoard
          tasks={tasks}
          onTaskMove={handleTaskMove}
          onTaskReorder={handleTaskReorder}
        />
      </div>
    </LayoutWithSidebar>
  );
}
