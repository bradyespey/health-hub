import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LayoutProvider } from "@/contexts/LayoutContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const SinglePanelGrid = lazy(() => import("@/components/dashboard/SinglePanelGrid").then((m) => ({ default: m.SinglePanelGrid })));
const GoalsGrid = lazy(() => import("@/components/dashboard/GoalsGrid").then((m) => ({ default: m.GoalsGrid })));
const AdminPanel = lazy(() => import("@/components/admin/AdminPanel").then((m) => ({ default: m.AdminPanel })));

const queryClient = new QueryClient();

function RouteLoadingFallback() {
  return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
}

function AuthenticatedApp() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  // Removed sign-in check here to allow demo mode
  
  return (
    <NavigationProvider>
      <LayoutProvider>
        <DashboardLayout>
          <Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/readiness" element={<SinglePanelGrid panelId="readiness" />} />
              <Route path="/nutrition" element={<SinglePanelGrid panelId="nutrition" />} />
              <Route path="/hydration" element={<SinglePanelGrid panelId="hydration" />} />
              <Route path="/training" element={<SinglePanelGrid panelId="training" />} />
              <Route path="/habits" element={<SinglePanelGrid panelId="habits" />} />
              <Route path="/goals" element={<GoalsGrid />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </DashboardLayout>
      </LayoutProvider>
    </NavigationProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="espey-theme">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthenticatedApp />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
