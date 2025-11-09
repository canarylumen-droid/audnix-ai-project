import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "@/pages/landing";
import Auth from "@/pages/auth";
import DashboardRoutes from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsOfService from "@/pages/terms-of-service";
import { InternetConnectionBanner } from "@/components/InternetConnectionBanner";
import ConversationsPage from "./pages/dashboard/conversations";
import CalendarPage from "./pages/dashboard/calendar";
import InsightsPage from "./pages/dashboard/insights";
import VideoAutomationPage from "./pages/dashboard/video-automation";
import { lazy } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BrowserRouter, Routes } from "react-router-dom";

const PricingPage = lazy(() => import("./pages/dashboard/pricing"));
const SettingsPage = lazy(() => import("./pages/dashboard/settings"));
const LeadImportPage = lazy(() => import("./pages/dashboard/lead-import"));

import { ThemeProvider } from "next-themes";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/auth" component={Auth} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/dashboard" component={DashboardRoutes} />
      <Route path="/dashboard/:rest*" component={DashboardRoutes} />
      <Route path="/dashboard/conversations/:id?" component={ConversationsPage} />
      <Route path="/dashboard/video-automation" component={VideoAutomationPage} />
      <Route path="/dashboard/lead-import" component={LeadImportPage} />
      <Route path="/dashboard/pricing" component={PricingPage} />
      <Route path="/dashboard/settings" component={SettingsPage} />
      <Route path="/dashboard/calendar" component={CalendarPage} />
      <Route path="/dashboard/insights" component={InsightsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <InternetConnectionBanner />
            <Toaster />
            <Router />
          </TooltipProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;