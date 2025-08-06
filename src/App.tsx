import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LayoutProvider } from "@/contexts/LayoutContext";
import { SignInPage } from "@/components/auth/SignInPage";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { ReadinessPanel } from "@/components/dashboard/ReadinessPanel";
import { NutritionPanel } from "@/components/dashboard/NutritionPanel";
import { HydrationPanel } from "@/components/dashboard/HydrationPanel";
import { TrainingPanel } from "@/components/dashboard/TrainingPanel";
import { HabitsPanel } from "@/components/dashboard/HabitsPanel";
import { MilestonesPanel } from "@/components/dashboard/MilestonesPanel";

const queryClient = new QueryClient();

function AuthenticatedApp() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    return <SignInPage />;
  }
  
  return (
    <LayoutProvider>
      <DashboardLayout>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/readiness" element={<div className="p-6"><ReadinessPanel /></div>} />
          <Route path="/nutrition" element={<div className="p-6"><NutritionPanel /></div>} />
          <Route path="/hydration" element={<div className="p-6"><HydrationPanel /></div>} />
          <Route path="/training" element={<div className="p-6"><TrainingPanel /></div>} />
          <Route path="/habits" element={<div className="p-6"><HabitsPanel /></div>} />
          <Route path="/milestones" element={<div className="p-6"><MilestonesPanel /></div>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </DashboardLayout>
    </LayoutProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="espey-theme">
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
