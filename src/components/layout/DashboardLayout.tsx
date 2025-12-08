import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SidebarProvider as CustomSidebarProvider } from '@/contexts/SidebarContext';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';
import { PageInfo } from '@/components/ui/page-info';

import { useAuth } from '@/contexts/AuthContext';
import { getPageInfo } from '@/utils/pageInfo';

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

  const pageInfo = getPageInfo(location.pathname);

  return (
    <CustomSidebarProvider defaultState="expanded" storageKey="espey-sidebar-state">
      <SidebarProvider defaultOpen={false}>
        <div className="min-h-screen flex w-full bg-background">
          <DashboardSidebar />
          
          <div className="flex-1 flex flex-col min-w-0">
            <DashboardHeader 
              onRefresh={handleRefresh}
              lastRefresh={lastRefresh}
              userRole={user?.role}
            />
            
            <main className="flex-1 p-3 md:p-6 overflow-x-hidden pb-20 md:pb-6">
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
          
          {/* Page Info Button */}
          {pageInfo && (
            <PageInfo 
              title={pageInfo.title}
              description={pageInfo.description}
              tips={pageInfo.tips}
            />
          )}

        </div>
      </SidebarProvider>
    </CustomSidebarProvider>
  );
}