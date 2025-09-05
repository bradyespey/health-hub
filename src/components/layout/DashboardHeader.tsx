import { useState } from 'react';
import { format } from 'date-fns';
import { NavLink, useLocation } from 'react-router-dom';
import { Calendar, RefreshCw, Sun, Moon, Monitor, Edit3, Check, Menu, X, Activity, Apple, Droplets, Dumbbell, CheckSquare, Trophy, LayoutGrid, Ban, Plus, Save, FolderOpen } from 'lucide-react';
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
import { useNavigation, iconMap } from '@/contexts/NavigationContext';
import { cn } from '@/lib/utils';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { LayoutPresetDialog } from '@/components/ui/layout-preset-dialog';

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
  const { isEditMode, setEditMode, cancelEdit, addCard } = useLayout();
  const { setSidebarState } = useSidebarState();
  const { navigationItems } = useNavigation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const handleAddCard = () => {
    // Get current page context for better card naming
    const pageName = location.pathname === '/' ? 'Dashboard' : 
      location.pathname.split('/')[1]?.charAt(0).toUpperCase() + 
      location.pathname.split('/')[1]?.slice(1) || 'Custom';
    
    addCard('text', `${pageName} Text Card`, 'Additional content for this section');
  };


  // Navigation items now come from NavigationContext

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

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
    <>
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-2 md:gap-4 px-3 md:px-6">
          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="md:hidden h-7 w-7"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-4 w-4" />
            <span className="sr-only">Open Menu</span>
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

          {/* Edit Layout Buttons - Admin only */}
          {userRole === 'admin' && (
            <>
              {/* Add Text Card Button - Only in edit mode */}
              {isEditMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddCard}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Card</span>
                </Button>
              )}
              
              {/* Layout Presets Button - Only in edit mode */}
              {isEditMode && (
                <LayoutPresetDialog>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <FolderOpen className="h-4 w-4" />
                    <span className="hidden sm:inline">Layouts</span>
                  </Button>
                </LayoutPresetDialog>
              )}
              
              
              {isEditMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelEdit}
                  className="gap-2"
                >
                  <Ban className="h-4 w-4" />
                  <span className="hidden sm:inline">Cancel</span>
                </Button>
              )}
              <div className="flex items-center gap-1">
                <Button
                  variant={isEditMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEditMode(!isEditMode)}
                  className="gap-2"
                >
                  {isEditMode ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span className="hidden sm:inline">Save</span>
                    </>
                  ) : (
                    <>
                      <Edit3 className="h-4 w-4" />
                      <span className="hidden lg:inline">Edit Layout</span>
                      <span className="hidden sm:inline lg:hidden">Edit</span>
                    </>
                  )}
                </Button>
                {!isEditMode && (
                  <HelpTooltip 
                    content="Click Edit Layout to customize your dashboard. You can drag cards to reorder, resize them, add new text cards, and delete cards you don't need."
                    side="bottom"
                  />
                )}
              </div>
            </>
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

    {/* Mobile Menu Overlay */}
    {mobileMenuOpen && (
      <div className="md:hidden fixed inset-0 z-50">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50" 
          onClick={() => setMobileMenuOpen(false)}
        />
        
        {/* Sidebar */}
        <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-background border-r">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-bold text-accent">
              Espey Performance Hub
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(false)}
              className="h-7 w-7"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close Menu</span>
            </Button>
          </div>

          {/* Navigation */}
          <nav className="p-4">
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = iconMap[item.icon as keyof typeof iconMap] || LayoutGrid;
                const active = isActive(item.url);
                
                return (
                  <NavLink
                    key={item.title}
                    to={item.url}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                      active 
                        ? "bg-accent text-accent-foreground" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </NavLink>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    )}
    </>
  );
}