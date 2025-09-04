import { NavLink, useLocation } from 'react-router-dom';
import { 
  Activity, 
  Apple, 
  Droplets, 
  Dumbbell, 
  CheckSquare, 
  Trophy,
  LayoutGrid
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigationItems = [
  { title: 'Dashboard', url: '/', icon: LayoutGrid },
  { title: 'Readiness', url: '/readiness', icon: Activity },
  { title: 'Nutrition', url: '/nutrition', icon: Apple },
  { title: 'Hydration', url: '/hydration', icon: Droplets },
  { title: 'Training', url: '/training', icon: Dumbbell },
  { title: 'Habits', url: '/habits', icon: CheckSquare },
  { title: 'Goals', url: '/goals', icon: Trophy },
];

export function MobileNav() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
      <div className="flex items-center justify-around py-2 px-1">
        {navigationItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.url);
          
          return (
            <NavLink
              key={item.title}
              to={item.url}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors text-xs",
                active 
                  ? "text-accent-foreground bg-accent" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.title}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}