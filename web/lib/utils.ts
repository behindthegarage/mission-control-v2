import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date to readable string
export function formatDate(date: string | Date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });
}

// Format datetime to readable string
export function formatDateTime(date: string | Date) {
  const d = new Date(date);
  return d.toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });
}

// Format relative time
export function formatRelativeTime(date: string | Date) {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return formatDate(date);
}

// Format duration from milliseconds
export function formatDuration(ms: number | null | undefined) {
  if (!ms) return '-';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

// Format number with commas
export function formatNumber(num: number | null | undefined) {
  if (num === null || num === undefined) return '-';
  return num.toLocaleString('en-US');
}

// Format tokens (k/M suffixes)
export function formatTokens(num: number | null | undefined) {
  if (num === null || num === undefined) return '-';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toLocaleString('en-US');
}

// Task status colors
export const statusColors: Record<string, string> = {
  backlog: 'bg-zinc-500',
  in_progress: 'bg-blue-500',
  review: 'bg-amber-500',
  done: 'bg-green-500',
};

export const statusLabels: Record<string, string> = {
  backlog: 'Backlog',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

// Session status colors
export const sessionStatusColors: Record<string, string> = {
  active: 'bg-green-500',
  completed: 'bg-blue-500',
  failed: 'bg-red-500',
  idle: 'bg-zinc-400',
};

export const sessionStatusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  completed: 'secondary',
  failed: 'destructive',
  idle: 'outline',
};

// Subagent status colors
export const subagentStatusColors: Record<string, string> = {
  active: 'bg-green-500',
  completed: 'bg-blue-500',
  failed: 'bg-red-500',
  cancelled: 'bg-zinc-400',
  pending: 'bg-amber-500',
};

// Priority colors
export const priorityColors: Record<string, string> = {
  low: 'text-zinc-400',
  medium: 'text-blue-400',
  high: 'text-amber-400',
  urgent: 'text-red-400',
};

// Model badge colors
export function getModelColor(model: string | null | undefined): string {
  if (!model) return 'bg-zinc-500';
  
  const modelColors: Record<string, string> = {
    'gpt-4': 'bg-purple-500',
    'gpt-4o': 'bg-purple-600',
    'gpt-5': 'bg-purple-700',
    'claude': 'bg-orange-500',
    'claude-3': 'bg-orange-500',
    'kimi': 'bg-blue-500',
    'k2p5': 'bg-blue-600',
  };
  
  for (const [key, color] of Object.entries(modelColors)) {
    if (model.toLowerCase().includes(key.toLowerCase())) {
      return color;
    }
  }
  
  return 'bg-zinc-500';
}
