import { LayoutWithSidebar } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain } from 'lucide-react';

export default function MemoriesPage() {
  return (
    <LayoutWithSidebar>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Memories</h1>
          <p className="text-muted-foreground">
            Browse OpenClaw memories like a journal
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Coming Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Memory browser with search will be implemented in Phase 2.
            </p>
          </CardContent>
        </Card>
      </div>
    </LayoutWithSidebar>
  );
}
