import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LayoutProvider } from "@/contexts/LayoutContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { SignInPage } from "@/components/auth/SignInPage";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { ReadinessPanel } from "@/components/dashboard/ReadinessPanel";
import { NutritionPanel } from "@/components/dashboard/NutritionPanel";
import { HydrationPanel } from "@/components/dashboard/HydrationPanel";
import { TrainingPanel } from "@/components/dashboard/TrainingPanel";
import { HabitsPanel } from "@/components/dashboard/HabitsPanel";
import { GoalsPanel } from "@/components/dashboard/GoalsPanel";
import { SinglePanelGrid } from "@/components/dashboard/SinglePanelGrid";
import { GoalsGrid } from "@/components/dashboard/GoalsGrid";
import { AdminPanel } from "@/components/admin/AdminPanel";

const queryClient = new QueryClient();

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
