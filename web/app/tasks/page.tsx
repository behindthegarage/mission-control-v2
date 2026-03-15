'use client';

import useSWR from 'swr';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
  const { data, error, isLoading, mutate } = useSWR('tasks', fetcher, {
    refreshInterval: 5000,
  });
  
  const tasks: Task[] = data?.tasks || [];

  const handleTaskMove = async (taskId: number, newStatus: string) => {
    try {
      await tasksAPI.update(taskId, { status: newStatus });
      mutate();
    } catch (err) {
      console.error('Failed to move task:', err);
    }
  };

  const handleTaskReorder = async (reorderedTasks: Task[]) => {
    try {
      for (let i = 0; i < reorderedTasks.length; i++) {
        await tasksAPI.update(reorderedTasks[i].id, { position: i });
      }
      mutate();
    } catch (err) {
      console.error('Failed to reorder tasks:', err);
    }
  };

  const handleCreateTask = async () => {
    try {
      await tasksAPI.create({
        title: 'New Task',
        description: 'Click to edit this task',
        status: 'backlog',
        assignee: 'human',
        priority: 'medium',
      });
      mutate();
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  if (isLoading) {
    return (
      <LayoutWithSidebar>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-28" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[500px]" />
            ))}
          </div>
        </div>
      </LayoutWithSidebar>
    );
  }

  if (error) {
    return (
      <LayoutWithSidebar>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Failed to load tasks. Please check that the API is running on port 3001.</p>
          </CardContent>
        </Card>
      </LayoutWithSidebar>
    );
  }

  return (
    <LayoutWithSidebar>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Task Board</h1>
            <p className="text-muted-foreground">
              Manage tasks and track progress across all projects
            </p>
          </div>
          <Button onClick={handleCreateTask}>
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
