import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SidebarProvider as CustomSidebarProvider } from '@/contexts/SidebarContext';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';

import { useAuth } from '@/contexts/AuthContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuth();
  const location = useLocation();
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const handleRefresh = () => {
    setLastRefresh(new Date());
    // Trigger data refresh for all SWR hooks
    window.location.reload();
  };

  return (
    <CustomSidebarProvider defaultState="expanded" storageKey="espey-sidebar-state">
      <SidebarProvider defaultOpen={false}>
        <div className="min-h-screen flex w-full gap-3 p-3 md:gap-4 md:p-4 bg-[radial-gradient(circle_at_top_left,_rgba(255,127,80,0.10),_transparent_28%),linear-gradient(135deg,_theme(colors.background)_0%,_theme(colors.background)_100%)]">
          <DashboardSidebar />

          <div className="flex-1 flex flex-col min-w-0 gap-3 md:gap-4">
            <DashboardHeader
              onRefresh={handleRefresh}
              lastRefresh={lastRefresh}
              userRole={user?.role}
              pathname={location.pathname}
            />

            <main className="flex-1 overflow-x-hidden pb-20 md:pb-2">
              <motion.div
                key={lastRefresh.getTime()}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                {children}
              </motion.div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </CustomSidebarProvider>
  );
}