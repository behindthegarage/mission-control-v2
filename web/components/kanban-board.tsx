'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, statusLabels, priorityColors } from '@/lib/utils';
import { GripVertical } from 'lucide-react';

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

interface KanbanBoardProps {
  tasks: Task[];
  onTaskMove: (taskId: number, newStatus: string) => void;
  onTaskReorder: (tasks: Task[]) => void;
}

const columns = ['backlog', 'in_progress', 'review', 'done'] as const;

// Sortable Task Card
function SortableTaskCard({ 
  task, 
  isOverlay 
}: { 
  task: Task; 
  isOverlay?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id.toString(), data: { task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'group cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50',
        isOverlay && 'shadow-xl rotate-2 cursor-grabbing',
        'hover:shadow-md transition-shadow'
      )}
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge 
                variant={task.assignee === 'agent' ? 'default' : 'secondary'} 
                className="text-[10px] h-5"
              >
                {task.assignee === 'agent' ? '🤖 Agent' : '👤 Human'}
              </Badge>
              <span className={cn('text-[10px] font-medium', priorityColors[task.priority])}>
                {task.priority}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Kanban Column
function KanbanColumn({ 
  status, 
  tasks, 
  isOver 
}: { 
  status: typeof columns[number]; 
  tasks: Task[];
  isOver?: boolean;
}) {
  const { setNodeRef } = useSortable({
    id: status,
    data: { type: 'column', status },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col h-full min-h-[400px] md:min-h-[500px] rounded-lg border bg-muted/30',
        isOver && 'ring-2 ring-primary ring-inset bg-primary/5'
      )}
    >
      <div className="p-3 border-b bg-muted/50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{statusLabels[status]}</h3>
          <Badge variant="secondary" className="text-xs">
            {tasks.length}
          </Badge>
        </div>
      </div>
      
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[60vh] md:max-h-none">
        <SortableContext
          items={tasks.map(t => t.id.toString())}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export function KanbanBoard({ tasks, onTaskMove, onTaskReorder }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id.toString());
    const task = tasks.find(t => t.id.toString() === active.id.toString());
    setActiveTask(task || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeTask = tasks.find(t => t.id.toString() === active.id.toString());
    if (!activeTask) return;

    const overId = over.id.toString();
    
    // Check if dropping over a column
    if (columns.includes(overId as any)) {
      if (activeTask.status !== overId) {
        onTaskMove(activeTask.id, overId);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setActiveTask(null);

    if (!over) return;

    const activeTask = tasks.find(t => t.id.toString() === active.id.toString());
    if (!activeTask) return;

    const overId = over.id.toString();

    // If dropping over a column
    if (columns.includes(overId as any)) {
      if (activeTask.status !== overId) {
        onTaskMove(activeTask.id, overId);
      }
      return;
    }

    // If dropping over another task
    const overTask = tasks.find(t => t.id.toString() === overId);
    if (overTask && activeTask.status === overTask.status) {
      // Reorder within same column
      const columnTasks = tasks.filter(t => t.status === activeTask.status);
      const oldIndex = columnTasks.findIndex(t => t.id.toString() === active.id.toString());
      const newIndex = columnTasks.findIndex(t => t.id.toString() === overId);
      
      const reordered = arrayMove(columnTasks, oldIndex, newIndex);
      onTaskReorder(reordered);
    }
  };

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: { active: { opacity: '0.5' } },
    }),
  };

  const tasksByColumn = columns.reduce((acc, status) => {
    acc[status] = tasks.filter(t => t.status === status).sort((a, b) => a.position - b.position);
    return acc;
  }, {} as Record<string, Task[]>);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {/* Mobile: Horizontal scroll container */}
      <div className="md:hidden overflow-x-auto pb-4 -mx-4 px-4">
        <div className="flex gap-4 min-w-max">
          {columns.map((status) => (
            <div 
              key={status} 
              className="w-[280px] flex-shrink-0"
            >
              <KanbanColumn
                status={status}
                tasks={tasksByColumn[status] || []}
                isOver={activeId !== null && activeTask?.status !== status}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: Grid layout */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={tasksByColumn[status] || []}
            isOver={activeId !== null && activeTask?.status !== status}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={dropAnimation}>
        {activeTask ? <SortableTaskCard task={activeTask} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
