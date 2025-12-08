import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Activity, 
  Apple, 
  Droplets, 
  Dumbbell, 
  CheckSquare, 
  Trophy,
  User,
  LogOut,
  ChevronRight,
  Settings,
  LayoutGrid
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebarState } from '@/contexts/SidebarContext';
import { useNavigation, iconMap } from '@/contexts/NavigationContext';

// Default navigation items moved to NavigationContext

const sidebarStates = [
  { value: 'expanded', label: 'Always Expanded' },
  { value: 'collapsed', label: 'Always Collapsed' },
  { value: 'hover', label: 'Expand on Hover' },
] as const;

export function DashboardSidebar() {
  const location = useLocation();
  const { user, signOut, signIn } = useAuth();
  const { sidebarState, setSidebarState, isExpanded } = useSidebarState();
  const { navigationItems } = useNavigation();
  const [isHovered, setIsHovered] = useState(false);

  const shouldShowExpanded = isExpanded || (sidebarState === 'hover' && isHovered);

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <TooltipProvider>
      <aside 
        className={cn(
          "hidden md:flex flex-col bg-card border-r transition-all duration-300 ease-in-out relative group h-screen sticky top-0",
          shouldShowExpanded ? "w-64" : "w-16"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Header */}
        <div className="p-4 border-b">
          {shouldShowExpanded ? (
            <NavLink to="/" className="block">
              <h2 className="text-lg font-bold text-accent hover:text-accent/80 transition-colors">
                Espey Performance Hub
              </h2>
            </NavLink>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <NavLink to="/" className="flex items-center justify-center">
                  <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                    <Activity className="h-5 w-5 text-accent-foreground" />
                  </div>
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Espey Performance Hub</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 overflow-y-auto">
          <div className="space-y-1">
            {shouldShowExpanded && (
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Navigation
              </div>
            )}
            {navigationItems.map((item) => {
              const Icon = iconMap[item.icon as keyof typeof iconMap] || Settings;
              const active = isActive(item.url);
              
              if (!shouldShowExpanded) {
                return (
                  <Tooltip key={item.title}>
                    <TooltipTrigger asChild>
                      <NavLink
                        to={item.url}
                        className={cn(
                          "flex items-center justify-center h-10 w-10 rounded-lg transition-colors mx-auto",
                          active 
                            ? "bg-accent text-accent-foreground" 
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </NavLink>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{item.title}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <NavLink
                  key={item.title}
                  to={item.url}
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

        {/* Admin Section */}
        {user?.role === 'admin' && (
          <div className="p-2 border-t flex-shrink-0">
            {shouldShowExpanded && (
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Admin
              </div>
            )}
            {!shouldShowExpanded ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <NavLink
                    to="/admin"
                    className={cn(
                      "flex items-center justify-center h-10 w-10 rounded-lg transition-colors mx-auto",
                      isActive('/admin')
                        ? "bg-accent text-accent-foreground" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Settings className="h-5 w-5" />
                  </NavLink>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Admin Panel</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <NavLink
                to="/admin"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  isActive('/admin')
                    ? "bg-accent text-accent-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Settings className="h-5 w-5" />
                <span>Admin Panel</span>
              </NavLink>
            )}
          </div>
        )}

        {/* Settings & Sidebar Controls */}
        <div className="p-2 border-t flex-shrink-0">
          {shouldShowExpanded ? (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-3 h-10 text-muted-foreground hover:text-foreground hover:bg-muted">
                  <Settings className="h-4 w-4" />
                  <span>Sidebar</span>
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="z-50" onInteractOutside={(e) => e.preventDefault()}>
                {sidebarStates.map((state) => (
                  <DropdownMenuItem
                    key={state.value}
                    onClick={() => setSidebarState(state.value)}
                    className={cn(
                      "cursor-pointer focus:bg-muted focus:text-foreground",
                      sidebarState === state.value ? "bg-accent text-accent-foreground" : "bg-background text-foreground"
                    )}
                  >
                    {state.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <DropdownMenu modal={false}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-10 h-10 p-0 mx-auto text-muted-foreground hover:text-foreground hover:bg-muted">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Sidebar Settings</p>
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent side="right" align="end" className="z-50" onInteractOutside={(e) => e.preventDefault()}>
                {sidebarStates.map((state) => (
                  <DropdownMenuItem
                    key={state.value}
                    onClick={() => setSidebarState(state.value)}
                    className={cn(
                      "cursor-pointer focus:bg-muted focus:text-foreground",
                      sidebarState === state.value ? "bg-accent text-accent-foreground" : "bg-background text-foreground"
                    )}
                  >
                    {state.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* User Section - Show Sign In if not logged in */}
        <div className="p-2 border-t flex-shrink-0">
          {user ? (
            shouldShowExpanded ? (
              <div className="flex items-center gap-3 px-3 py-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="h-8 w-8 p-0"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs opacity-70 capitalize">{user.role}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={signOut}
                      className="h-8 w-8 p-0"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Sign Out</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )
          ) : (
            shouldShowExpanded ? (
              <Button 
                variant="default" 
                className="w-full gap-2"
                onClick={async () => {
                  try {
                    await signIn();
                  } catch (error) {
                    console.error('Sign in failed:', error);
                  }
                }}
              >
                <User className="h-4 w-4" />
                <span>Sign In</span>
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="default" 
                    size="icon" 
                    className="h-9 w-9"
                    onClick={async () => {
                      try {
                        await signIn();
                      } catch (error) {
                        console.error('Sign in failed:', error);
                      }
                    }}
                  >
                    <User className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Sign In</p>
                </TooltipContent>
              </Tooltip>
            )
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}