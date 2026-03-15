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
  FileText, 
  Search, 
  Folder, 
  FileCode, 
  FileType,
  ChevronRight,
  ChevronLeft,
  Clock,
  X,
  ExternalLink
} from 'lucide-react';
import { documentsAPI } from '@/lib/api';
import { cn } from '@/lib/utils';

const CATEGORY_COLORS: Record<string, string> = {
  project: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  plan: 'bg-green-500/10 text-green-500 border-green-500/20',
  draft: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  report: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  documentation: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  notes: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  context: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  archive: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  other: 'bg-muted text-muted-foreground',
};

const CATEGORY_LABELS: Record<string, string> = {
  project: 'Project',
  plan: 'Plan',
  draft: 'Draft',
  report: 'Report',
  documentation: 'Documentation',
  notes: 'Notes',
  context: 'Context',
  archive: 'Archive',
  other: 'Other',
};

export default function DocumentsPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  
  const { data: docsData, error: docsError, isLoading: docsLoading } = useSWR(
    ['documents', { search, category: selectedCategory }],
    () => documentsAPI.list({ search, category: selectedCategory || undefined }),
    { refreshInterval: 60000 }
  );
  
  const { data: categoriesData } = useSWR(
    'document-categories',
    () => documentsAPI.getCategories(),
    { refreshInterval: 300000 }
  );
  
  const documents = docsData?.documents || [];
  const categories = categoriesData?.categories || [];
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  const getFileIcon = (extension: string) => {
    switch (extension) {
      case '.md': return <FileType className="h-5 w-5 text-blue-500" />;
      case '.txt': return <FileText className="h-5 w-5 text-gray-500" />;
      case '.pdf': return <FileText className="h-5 w-5 text-red-500" />;
      default: return <FileCode className="h-5 w-5 text-green-500" />;
    }
  };

  return (
    <LayoutWithSidebar>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Documents
            </h1>
            <p className="text-muted-foreground">
              Central repository for all workspace documents
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {selectedDoc ? (
              <Button variant="outline" size="sm" onClick={() => setSelectedDoc(null)}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to List
              </Button>
            ) : (
              <>
                <Button 
                  variant={viewMode === 'list' ? 'secondary' : 'outline'} 
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  List
                </Button>
                <Button 
                  variant={viewMode === 'grid' ? 'secondary' : 'outline'} 
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  Grid
                </Button>
              </>
            )}
          </div>
        </div>
        
        {!selectedDoc ? (
          <>
            {/* Search and Categories */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search documents..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                    {search && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                        onClick={() => setSearch('')}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={selectedCategory === null ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(null)}
                    >
                      All ({documents.length})
                    </Button>
                    
                    {categories.map((cat: any) => (
                      <Button
                        key={cat.name}
                        variant={selectedCategory === cat.name ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory(cat.name)}
                      >
                        {CATEGORY_LABELS[cat.name] || cat.name} ({cat.count})
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Documents List */}
            {docsLoading ? (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className={viewMode === 'grid' ? 'h-40' : 'h-20'} />
                ))}
              </div>
            ) : docsError ? (
              <Card className="border-destructive">
                <CardContent className="pt-6">
                  <p className="text-destructive">Failed to load documents</p>
                </CardContent>
              </Card>
            ) : documents.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    No Documents Found
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {search || selectedCategory 
                      ? 'No documents match your current filters.' 
                      : 'No documents found in workspace.'}
                  </p>
                </CardContent>
              </Card>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc: any) => (
                  <Card 
                    key={doc.path}
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => setSelectedDoc(doc)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start gap-3">
                        {getFileIcon(doc.extension)}
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm font-medium truncate">
                            {doc.title}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground truncate">
                            {doc.path}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                        {doc.preview || 'No preview available'}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs", CATEGORY_COLORS[doc.category] || CATEGORY_COLORS.other)}
                        >
                          {CATEGORY_LABELS[doc.category] || doc.category}
                        </Badge>
                        
                        <span className="text-xs text-muted-foreground">
                          {formatSize(doc.size)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc: any) => (
                  <Card 
                    key={doc.path}
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => setSelectedDoc(doc)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {getFileIcon(doc.extension)}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{doc.title}</span>
                            <Badge 
                              variant="outline" 
                              className={cn("text-xs shrink-0", CATEGORY_COLORS[doc.category] || CATEGORY_COLORS.other)}
                            >
                              {CATEGORY_LABELS[doc.category] || doc.category}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground truncate">
                            {doc.path}
                          </p>
                          
                          {doc.preview && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                              {doc.preview}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground shrink-0">
                          <span>{formatSize(doc.size)}</span>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(doc.modifiedAt)}
                          </div>
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : (
          <DocumentDetail doc={selectedDoc} onBack={() => setSelectedDoc(null)} />
        )}
      </div>
    </LayoutWithSidebar>
  );
}

function DocumentDetail({ doc, onBack }: { doc: any; onBack: () => void }) {
  const { data, error, isLoading } = useSWR(
    doc ? ['document-content', doc.path] : null,
    () => documentsAPI.getContent(doc.path),
    { revalidateOnFocus: false }
  );
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
          <Folder className="h-4 w-4" />
          {doc.path}
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{doc.title}</CardTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span>Modified: {formatDate(doc.modifiedAt)}</span>
                <span>Size: {(doc.size / 1024).toFixed(1)} KB</span>
              </div>
            </div>
            
            <Badge 
              variant="outline" 
              className={CATEGORY_COLORS[doc.category] || CATEGORY_COLORS.other}
            >
              {CATEGORY_LABELS[doc.category] || doc.category}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : error ? (
            <p className="text-destructive">Failed to load document content</p>
          ) : data?.type === 'pdf' ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                PDF files cannot be previewed in the browser.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Path: {doc.path}
              </p>
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg overflow-auto max-h-[600px]">
                {data?.content}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}