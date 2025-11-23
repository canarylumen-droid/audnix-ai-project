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
import { AuthGuard } from "@/components/auth-guard";

const PricingPage = lazy(() => import("./pages/dashboard/pricing"));
const SettingsPage = lazy(() => import("./pages/dashboard/settings"));
const LeadImportPage = lazy(() => import("./pages/dashboard/lead-import"));

const AdminDashboard = lazy(() => import("./pages/admin"));
const AdminUsers = lazy(() => import("./pages/admin/users"));
const AdminAnalytics = lazy(() => import("./pages/admin/analytics"));
const AdminLeads = lazy(() => import("./pages/admin/leads"));
const AdminSettings = lazy(() => import("./pages/admin/settings"));

import { ThemeProvider } from "next-themes";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/auth" component={Auth} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/dashboard">
        {() => (
          <AuthGuard>
            <DashboardRoutes />
          </AuthGuard>
        )}
      </Route>
      <Route path="/dashboard/:rest*">
        {() => (
          <AuthGuard>
            <DashboardRoutes />
          </AuthGuard>
        )}
      </Route>
      <Route path="/dashboard/conversations/:id?">
        {() => (
          <AuthGuard>
            <ConversationsPage />
          </AuthGuard>
        )}
      </Route>
      <Route path="/dashboard/video-automation">
        {() => (
          <AuthGuard>
            <VideoAutomationPage />
          </AuthGuard>
        )}
      </Route>
      <Route path="/dashboard/lead-import">
        {() => (
          <AuthGuard>
            <LeadImportPage />
          </AuthGuard>
        )}
      </Route>
      <Route path="/dashboard/pricing">
        {() => (
          <AuthGuard>
            <PricingPage />
          </AuthGuard>
        )}
      </Route>
      <Route path="/dashboard/settings">
        {() => (
          <AuthGuard>
            <SettingsPage />
          </AuthGuard>
        )}
      </Route>
      <Route path="/dashboard/calendar">
        {() => (
          <AuthGuard>
            <CalendarPage />
          </AuthGuard>
        )}
      </Route>
      <Route path="/dashboard/insights">
        {() => (
          <AuthGuard>
            <InsightsPage />
          </AuthGuard>
        )}
      </Route>
      <Route path="/admin">
        {() => (
          <AuthGuard>
            <AdminDashboard />
          </AuthGuard>
        )}
      </Route>
      <Route path="/admin/users">
        {() => (
          <AuthGuard>
            <AdminUsers />
          </AuthGuard>
        )}
      </Route>
      <Route path="/admin/analytics">
        {() => (
          <AuthGuard>
            <AdminAnalytics />
          </AuthGuard>
        )}
      </Route>
      <Route path="/admin/leads">
        {() => (
          <AuthGuard>
            <AdminLeads />
          </AuthGuard>
        )}
      </Route>
      <Route path="/admin/settings">
        {() => (
          <AuthGuard>
            <AdminSettings />
          </AuthGuard>
        )}
      </Route>
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