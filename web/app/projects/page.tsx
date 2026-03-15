'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { LayoutWithSidebar } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FolderKanban, 
  Search, 
  CheckCircle2, 
  Clock, 
  Archive,
  ListTodo,
  ChevronRight,
  ExternalLink,
  Calendar,
  Tag
} from 'lucide-react';
import { projectsAPI, btgQueueAPI } from '@/lib/api';
import { cn } from '@/lib/utils';

type StatusFilter = 'all' | 'active' | 'resolved' | 'archived';

const STATUS_CONFIG = {
  all: { label: 'All', icon: ListTodo, color: '' },
  active: { label: 'Active', icon: Clock, color: 'text-yellow-500' },
  resolved: { label: 'Resolved', icon: CheckCircle2, color: 'text-green-500' },
  archived: { label: 'Archived', icon: Archive, color: 'text-gray-500' },
};

export default function ProjectsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'projects' | 'btg'>('projects');
  
  // Fetch projects from API
  const { data: projectsData, error: projectsError, isLoading: projectsLoading } = useSWR(
    'projects',
    () => projectsAPI.list(),
    { refreshInterval: 30000 }
  );
  
  // Fetch BTG queue
  const { data: btgData, error: btgError, isLoading: btgLoading } = useSWR(
    ['btg-queue', { status: statusFilter === 'all' ? undefined : statusFilter }],
    () => btgQueueAPI.list({ status: statusFilter === 'all' ? undefined : statusFilter }),
    { refreshInterval: 60000 }
  );
  
  // Fetch BTG stats
  const { data: btgStats } = useSWR(
    'btg-stats',
    () => btgQueueAPI.getStats(),
    { refreshInterval: 120000 }
  );
  
  const projects = projectsData?.projects || [];
  const btgItems = btgData?.items || [];
  
  // Filter BTG items by search
  const filteredBtgItems = search 
    ? btgItems.filter((item: any) => 
        item.topic.toLowerCase().includes(search.toLowerCase()) ||
        item.source.toLowerCase().includes(search.toLowerCase())
      )
    : btgItems;
  
  // Filter projects by search
  const filteredProjects = search
    ? projects.filter((p: any) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
      )
    : projects;
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case '✅':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">✅ Resolved</Badge>;
      case '~~archived~~':
        return <Badge variant="outline" className="text-gray-500">🗑️ Archived</Badge>;
      default:
        return <Badge variant="secondary">⏳ Pending</Badge>;
    }
  };

  return (
    <LayoutWithSidebar>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FolderKanban className="h-6 w-6 text-primary" />
              Projects
            </h1>
            <p className="text-muted-foreground">
              Manage projects and BTG Queue
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant={viewMode === 'projects' ? 'secondary' : 'outline'} 
              size="sm"
              onClick={() => setViewMode('projects')}
            >
              <FolderKanban className="h-4 w-4 mr-1" />
              Projects ({projects.length})
            </Button>
            <Button 
              variant={viewMode === 'btg' ? 'secondary' : 'outline'} 
              size="sm"
              onClick={() => setViewMode('btg')}
            >
              <ListTodo className="h-4 w-4 mr-1" />
              BTG Queue ({btgStats?.total || 0})
            </Button>
          </div>
        </div>
        
        {/* Stats Cards */}
        {viewMode === 'btg' && btgStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{btgStats.total}</div>
                <p className="text-xs text-muted-foreground">Total Items</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-yellow-500">{btgStats.active}</div>
                <p className="text-xs text-muted-foreground">Active</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-500">{btgStats.resolved}</div>
                <p className="text-xs text-muted-foreground">Resolved</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-gray-500">{btgStats.archived}</div>
                <p className="text-xs text-muted-foreground">Archived</p>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`Search ${viewMode}...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {viewMode === 'btg' && (
                <div className="flex gap-2">
                  {(Object.keys(STATUS_CONFIG) as StatusFilter[]).map((status) => {
                    const config = STATUS_CONFIG[status];
                    const Icon = config.icon;
                    return (
                      <Button
                        key={status}
                        variant={statusFilter === status ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => setStatusFilter(status)}
                        className="flex items-center gap-1"
                      >
                        <Icon className={cn("h-4 w-4", config.color)} />
                        {config.label}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Content */}
        {viewMode === 'projects' ? (
          <ProjectsView 
            projects={filteredProjects}
            isLoading={projectsLoading}
            error={projectsError}
          />
        ) : (
          <BTGQueueView
            items={filteredBtgItems}
            isLoading={btgLoading}
            error={btgError}
            getStatusBadge={getStatusBadge}
          />
        )}
      </div>
    </LayoutWithSidebar>
  );
}

function ProjectsView({ projects, isLoading, error }: { 
  projects: any[]; 
  isLoading: boolean; 
  error: any;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive">Failed to load projects</p>
        </CardContent>
      </Card>
    );
  }
  
  if (projects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5" />
            No Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No projects found. Projects will appear here once created.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project: any) => (
        <Card key={project.id} className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg">{project.name}</CardTitle>
              
              {project.btg_status && (
                <Badge variant={project.btg_status === '✅' ? 'default' : 'secondary'}>
                  {project.btg_status === '✅' ? '✅' : '⏳'}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <Calendar className="h-3 w-3" />
              Updated {new Date(project.updated_at).toLocaleDateString()}
            </div>
          </CardHeader>
          
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {project.description || 'No description'}
            </p>
            
            {project.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {project.tags.map((tag: string) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            
            {project.repo_url && (
              <a 
                href={project.repo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary mt-4 hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Repository
              </a>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function BTGQueueView({ 
  items, 
  isLoading, 
  error,
  getStatusBadge 
}: { 
  items: any[]; 
  isLoading: boolean; 
  error: any;
  getStatusBadge: (status: string) => React.ReactNode;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive">Failed to load BTG queue</p>
        </CardContent>
      </Card>
    );
  }
  
  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="h-5 w-5" />
            No Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No BTG queue items match your current filters.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-2">
      {items.map((item: any) => (
        <Card key={item.id} className="hover:border-primary/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">#{item.id}</span>
                    <h3 className={cn(
                      "font-medium",
                      item.isArchived && "line-through text-muted-foreground"
                    )}>
                      {item.topic}
                    </h3>
                  </div>
                  
                  {getStatusBadge(item.status)}
                </div>
                
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span>Source: {item.source}</span>
                  <span>Added: {item.added}</span>
                </div>
                
                {item.rawStatus && item.rawStatus.length > 10 && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {item.rawStatus.replace(/[#~*_]/g, '')}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}