import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { useEffect } from "react";
import * as localStorageService from "@/lib/localStorageService";

// Pages
import Dashboard from "@/pages/Dashboard";
import JournalPage from "@/pages/journal-page";
import GamesPage from "@/pages/games-page";
import AuthPage from "@/pages/auth-page";
import SubscriptionPage from "@/pages/subscription-page";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Public route */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Protected routes */}
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/journal" component={JournalPage} />
      <ProtectedRoute path="/subscription" component={SubscriptionPage} />
      <ProtectedRoute path="/games" component={GamesPage} />
      
      {/* 404 route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Initialize local storage when app first loads
  useEffect(() => {
    localStorageService.initLocalStorage();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="serene-theme">
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Router />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
