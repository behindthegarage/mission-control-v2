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
  Brain, 
  Calendar, 
  Search, 
  FileText, 
  ChevronLeft, 
  ChevronRight,
  Tag,
  Clock,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { memoriesAPI } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const fetcher = (params: any) => memoriesAPI.list(params);

export default function MemoriesPage() {
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedMemory, setSelectedMemory] = useState<any>(null);
  
  const { data, error, isLoading, mutate } = useSWR(
    ['memories', { search, date_from: dateFrom, date_to: dateTo, limit: 100 }],
    () => fetcher({ search, date_from: dateFrom, date_to: dateTo, limit: 100 }),
    { refreshInterval: 60000 }
  );
  
  const memories = data?.memories || [];
  
  // Group memories by month
  const groupedMemories = memories.reduce((acc: any, memory: any) => {
    const month = memory.date.substring(0, 7); // YYYY-MM
    if (!acc[month]) acc[month] = [];
    acc[month].push(memory);
    return acc;
  }, {});
  
  const sortedMonths = Object.keys(groupedMemories).sort().reverse();
  
  // Get today's date for quick filters
  const today = new Date().toISOString().split('T')[0];
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const setQuickFilter = (filter: string) => {
    setDateTo(today);
    if (filter === 'week') setDateFrom(lastWeek);
    else if (filter === 'month') setDateFrom(lastMonth);
    else {
      setDateFrom('');
      setDateTo('');
    }
  };
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <LayoutWithSidebar>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              Memories
            </h1>
            <p className="text-muted-foreground">
              Browse OpenClaw memories like a journal
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {!selectedMemory ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setQuickFilter('week')}
                  className={cn(dateFrom === lastWeek && "bg-secondary")}
                >
                  Last 7 Days
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setQuickFilter('month')}
                  className={cn(dateFrom === lastMonth && "bg-secondary")}
                >
                  Last 30 Days
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setQuickFilter('all')}
                  className={cn(!dateFrom && !dateTo && "bg-secondary")}
                >
                  All Time
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setSelectedMemory(null)}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to List
              </Button>
            )}
          </div>
        </div>
        
        {!selectedMemory && (
          <>
            {/* Search and Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search memories..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-auto"
                      />
                    </div>
                    <span className="text-muted-foreground self-center">to</span>
                    
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-auto"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Results */}
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Failed to Load Memories</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                  <span>Unable to fetch memory data.</span>
                  <Button variant="ghost" size="sm" onClick={() => mutate()}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            ) : memories.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    No Memories Found
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    No memories match your current filters. Try adjusting your search or date range.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {sortedMonths.map((month) => (
                  <div key={month}>
                    <h2 className="text-lg font-semibold text-muted-foreground mb-4">
                      {formatMonth(month)}
                    </h2>
                    
                    <div className="grid gap-4">
                      {groupedMemories[month].map((memory: any) => (
                        <Card 
                          key={memory.filename}
                          className="cursor-pointer hover:border-primary/50 transition-colors"
                          onClick={() => setSelectedMemory(memory)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex flex-col">
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(memory.date)}
                                  </span>
                                  <CardTitle className="text-base">{memory.title}</CardTitle>
                                </div>
                              </div>
                              
                              {memory.hasSuffix && (
                                <Badge variant="outline" className="text-xs">
                                  {memory.suffix}
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          
                          <CardContent className="pt-0">
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {memory.preview}
                            </p>
                            
                            {memory.topics.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {memory.topics.slice(0, 5).map((topic: string) => (
                                  <Badge key={topic} variant="secondary" className="text-xs">
                                    <Tag className="h-3 w-3 mr-1" />
                                    {topic}
                                  </Badge>
                                ))}
                                {memory.topics.length > 5 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{memory.topics.length - 5} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        
        {/* Memory Detail View */}
        {selectedMemory && (
          <MemoryDetail memory={selectedMemory} onBack={() => setSelectedMemory(null)} />
        )}
      </div>
    </LayoutWithSidebar>
  );
}

function MemoryDetail({ memory, onBack }: { memory: any; onBack: () => void }) {
  const { data, error, isLoading } = useSWR(
    memory ? ['memory-detail', memory.date] : null,
    () => memoriesAPI.getByDate(memory.date),
    { revalidateOnFocus: false }
  );
  
  const formatFullDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {formatFullDate(memory.date)}
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{memory.title}</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            {memory.filename}
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : error ? (
            <p className="text-destructive">Failed to load memory content</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {data?.content || memory.preview}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}