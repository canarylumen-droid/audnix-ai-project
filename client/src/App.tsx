import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "@/pages/landing";
import Auth from "@/pages/auth";
import DashboardRoutes from "@/pages/dashboard";
import { OnboardingPage } from "@/pages/onboarding";
import NotFound from "@/pages/not-found";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsOfService from "@/pages/terms-of-service";
import DataDeletion from "@/pages/data-deletion";

// Solutions
const AgenciesPage = lazy(() => import("./pages/solutions/Agencies"));
const FoundersPage = lazy(() => import("./pages/solutions/Founders"));
const CreatorsPage = lazy(() => import("./pages/solutions/Creators"));

import { InternetConnectionBanner } from "@/components/InternetConnectionBanner";
const ConversationsPage = lazy(() => import("./pages/dashboard/conversations"));
const CalendarPage = lazy(() => import("./pages/dashboard/calendar"));
const InsightsPage = lazy(() => import("./pages/dashboard/insights"));
const VideoAutomationPage = lazy(() => import("./pages/dashboard/video-automation"));
import { lazy, Suspense } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ComponentShowcase } from '@/pages/dashboard/component-test';
import { AuthGuard } from '@/components/auth-guard';
import { CustomCursor } from "@/components/ui/CustomCursor";
import { ExpertChat } from "@/components/landing/ExpertChat";

const MockupDemo = lazy(() => import("./mockup/LiveCallModeDemo"));

const PricingPage = lazy(() => import("./pages/dashboard/pricing"));
const SettingsPage = lazy(() => import("./pages/dashboard/settings"));
const LeadImportPage = lazy(() => import("./pages/dashboard/lead-import"));
const ProspectingPage = lazy(() => import("./pages/dashboard/prospecting"));


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
      <Route path="/onboarding" component={OnboardingPage} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/data-deletion" component={DataDeletion} />

      {/* Solutions */}
      <Route path="/solutions/agencies">
        {() => <Suspense fallback={null}><AgenciesPage /></Suspense>}
      </Route>
      <Route path="/solutions/sales-teams">
        {() => <Suspense fallback={null}><FoundersPage /></Suspense>}
      </Route>
      <Route path="/solutions/creators">
        {() => <Suspense fallback={null}><CreatorsPage /></Suspense>}
      </Route>
      <Route path="/leads/prospecting">
        {() => (
          <AuthGuard>
            <Suspense fallback={null}><ProspectingPage /></Suspense>
          </AuthGuard>
        )}
      </Route>
      <Route path="/components">
        {() => (
          <AuthGuard>
            <ComponentShowcase />
          </AuthGuard>
        )}
      </Route>
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
            <Suspense fallback={null}><ConversationsPage /></Suspense>
          </AuthGuard>
        )}
      </Route>
      <Route path="/dashboard/video-automation">
        {() => (
          <AuthGuard>
            <Suspense fallback={null}><VideoAutomationPage /></Suspense>
          </AuthGuard>
        )}
      </Route>
      <Route path="/dashboard/lead-import">
        {() => (
          <AuthGuard>
            <Suspense fallback={null}><LeadImportPage /></Suspense>
          </AuthGuard>
        )}
      </Route>
      <Route path="/dashboard/pricing">
        {() => (
          <AuthGuard>
            <Suspense fallback={null}><PricingPage /></Suspense>
          </AuthGuard>
        )}
      </Route>
      <Route path="/dashboard/settings">
        {() => (
          <AuthGuard>
            <Suspense fallback={null}><SettingsPage /></Suspense>
          </AuthGuard>
        )}
      </Route>
      <Route path="/dashboard/calendar">
        {() => (
          <AuthGuard>
            <Suspense fallback={null}><CalendarPage /></Suspense>
          </AuthGuard>
        )}
      </Route>
      <Route path="/dashboard/insights">
        {() => (
          <AuthGuard>
            <Suspense fallback={null}><InsightsPage /></Suspense>
          </AuthGuard>
        )}
      </Route>
      {/* Admin routes - uses SECRET admin URL from env variable */}
      {/* Access via: /${VITE_ADMIN_SECRET_URL} or /admin-secret-xyz (default) */}
      <Route path="/admin-secret-xyz">
        {() => (
          <AuthGuard adminOnly={true}>
            <AdminDashboard />
          </AuthGuard>
        )}
      </Route>
      <Route path="/admin-secret-xyz/users">
        {() => (
          <AuthGuard adminOnly={true}>
            <AdminUsers />
          </AuthGuard>
        )}
      </Route>
      <Route path="/admin-secret-xyz/analytics">
        {() => (
          <AuthGuard adminOnly={true}>
            <AdminAnalytics />
          </AuthGuard>
        )}
      </Route>
      <Route path="/admin-secret-xyz/leads">
        {() => (
          <AuthGuard adminOnly={true}>
            <AdminLeads />
          </AuthGuard>
        )}
      </Route>
      <Route path="/admin-secret-xyz/settings">
        {() => (
          <AuthGuard adminOnly={true}>
            <AdminSettings />
          </AuthGuard>
        )}
      </Route>

      {/* Keep old /admin path for backward compatibility - redirects to secret path */}
      <Route path="/admin">
        {() => {
          const secretPath = import.meta.env.VITE_ADMIN_SECRET_URL || 'admin-secret-xyz';
          window.location.href = `/${secretPath}`;
          return null;
        }}
      </Route>
      <Route path="/admin/users">
        {() => (
          <AuthGuard adminOnly={true}>
            <AdminUsers />
          </AuthGuard>
        )}
      </Route>
      <Route path="/admin/analytics">
        {() => (
          <AuthGuard adminOnly={true}>
            <AdminAnalytics />
          </AuthGuard>
        )}
      </Route>
      <Route path="/admin/leads">
        {() => (
          <AuthGuard adminOnly={true}>
            <AdminLeads />
          </AuthGuard>
        )}
      </Route>
      <Route path="/admin/settings">
        {() => (
          <AuthGuard adminOnly={true}>
            <AdminSettings />
          </AuthGuard>
        )}
      </Route>

      {/* Mockup Demo - Isolated, no auth, for investor/marketing screenshots */}
      <Route path="/mockup-demo">
        {() => (
          <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
            <MockupDemo />
          </Suspense>
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
            <CustomCursor />
            <Router />
            <ExpertChat />
          </TooltipProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;