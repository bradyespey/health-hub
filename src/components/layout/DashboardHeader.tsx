import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, RefreshCw, Sun, Moon, Monitor, Edit3, Check, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/components/ThemeProvider';
import { UserRole } from '@/contexts/AuthContext';
import { useLayout } from '@/contexts/LayoutContext';
import { useSidebarState } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  onRefresh: () => void;
  lastRefresh: Date;
  userRole?: UserRole;
}

export function DashboardHeader({ onRefresh, lastRefresh, userRole }: DashboardHeaderProps) {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    to: new Date(),
  });
  const { theme, setTheme } = useTheme();
  const { isEditMode, setEditMode } = useLayout();
  const { setSidebarState } = useSidebarState();

  const formatLastRefresh = (date: Date) => {
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return format(date, 'MMM d, HH:mm');
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-2 md:gap-4 px-3 md:px-6">
        {/* Mobile Menu Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="md:hidden h-7 w-7"
          onClick={() => setSidebarState('expanded')}
        >
          <Menu className="h-4 w-4" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
        
        {/* Date Range Picker - Hidden on small screens */}
        <div className="hidden sm:flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden lg:inline">
                  {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d')}
                </span>
                <span className="lg:hidden">
                  {format(dateRange.from, 'M/d')} - {format(dateRange.to, 'M/d')}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to });
                  }
                }}
                numberOfMonths={2}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1 md:gap-2">
          {/* Last Updated Badge - Hidden on mobile */}
          <Badge variant="secondary" className="text-xs hidden md:inline-flex">
            Last updated: {formatLastRefresh(lastRefresh)}
          </Badge>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="gap-2"
            disabled={userRole === 'viewer'}
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          {/* Edit Layout Button - Admin only */}
          {userRole === 'admin' && (
            <Button
              variant={isEditMode ? "default" : "outline"}
              size="sm"
              onClick={() => setEditMode(!isEditMode)}
              className="gap-2"
            >
              {isEditMode ? (
                <>
                  <Check className="h-4 w-4" />
                  <span className="hidden sm:inline">Done</span>
                </>
              ) : (
                <>
                  <Edit3 className="h-4 w-4" />
                  <span className="hidden lg:inline">Edit Layout</span>
                  <span className="hidden sm:inline lg:hidden">Edit</span>
                </>
              )}
            </Button>
          )}

          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {theme === 'light' && <Sun className="h-4 w-4" />}
                {theme === 'dark' && <Moon className="h-4 w-4" />}
                {theme === 'system' && <Monitor className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setTheme('light')}
                className={cn(
                  "cursor-pointer focus:bg-muted focus:text-foreground",
                  theme === 'light' ? "bg-accent text-accent-foreground" : "bg-background text-foreground"
                )}
              >
                <Sun className="mr-2 h-4 w-4" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme('dark')}
                className={cn(
                  "cursor-pointer focus:bg-muted focus:text-foreground",
                  theme === 'dark' ? "bg-accent text-accent-foreground" : "bg-background text-foreground"
                )}
              >
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme('system')}
                className={cn(
                  "cursor-pointer focus:bg-muted focus:text-foreground",
                  theme === 'system' ? "bg-accent text-accent-foreground" : "bg-background text-foreground"
                )}
              >
                <Monitor className="mr-2 h-4 w-4" />
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}