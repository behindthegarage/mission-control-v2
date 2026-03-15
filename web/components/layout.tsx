'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Kanban,
  Calendar,
  FolderKanban,
  Brain,
  FileText,
  Terminal,
  Bot,
  ChevronRight,
  Moon,
  Sun,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Task Board', href: '/tasks', icon: Kanban },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Memories', href: '/memories', icon: Brain },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Sessions', href: '/sessions', icon: Terminal },
  { name: 'Sub-Agents', href: '/subagents', icon: Bot },
];

// Theme toggle hook
function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check for saved theme preference or system preference
    const savedTheme = localStorage.getItem('mc-theme') as 'light' | 'dark' | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('mc-theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return { theme, toggleTheme, mounted };
}

function NavigationItems({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <SidebarMenu className="gap-1 p-2">
      {navigation.map((item) => (
        <SidebarMenuItem key={item.name}>
          <Link href={item.href} className="w-full" onClick={onNavigate}>
            <SidebarMenuButton
              className={cn(
                "w-full flex items-center gap-3",
                pathname === item.href && "bg-sidebar-accent text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.name}</span>
              {pathname === item.href && (
                <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
              )}
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8">
      {theme === 'light' ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </Button>
  );
}

function SidebarNav() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-border/50 p-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Terminal className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="hidden lg:inline">Mission Control</span>
          <span className="lg:hidden">MC</span>
        </Link>
      </SidebarHeader>
      
      <SidebarContent>
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <NavigationItems pathname={pathname} />
        </ScrollArea>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-border/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span>Online</span>
          </div>
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

// Mobile navigation drawer
function MobileNav({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger>
        <Button variant="ghost" size="icon" className="md:hidden">
          <LayoutDashboard className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <SheetHeader className="border-b border-border/50 p-4">
          <SheetTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Terminal className="h-4 w-4 text-primary-foreground" />
            </div>
            <span>Mission Control</span>
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <NavigationItems pathname={pathname} onNavigate={() => setOpen(false)} />
        </ScrollArea>
        <div className="absolute bottom-0 left-0 right-0 border-t border-border/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span>System Online</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function LayoutWithSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden md:block">
          <SidebarNav />
        </div>
        
        <main className="flex-1 overflow-auto w-full">
          {/* Mobile Header */}
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 md:px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            {/* Mobile nav trigger */}
            <div className="md:hidden">
              <MobileNav pathname={pathname} />
            </div>
            
            {/* Desktop sidebar trigger */}
            <div className="hidden md:block">
              <SidebarTrigger />
            </div>
            
            <Separator orientation="vertical" className="h-6 hidden md:block" />
            
            {/* Mobile title */}
            <h1 className="md:hidden text-base font-semibold truncate">
              {navigation.find(n => n.href === pathname)?.name || 'Mission Control'}
            </h1>
            
            {/* Desktop subtitle */}
            <h1 className="hidden md:block text-sm font-medium text-muted-foreground">
              Mission Control v2
            </h1>
            
            {/* Mobile theme toggle */}
            <div className="md:hidden ml-auto">
              <ThemeToggle />
            </div>
          </header>
          
          {/* Main content with responsive padding */}
          <div className="p-4 md:p-6">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
