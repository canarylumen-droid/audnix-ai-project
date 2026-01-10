import { Route, Switch } from "wouter";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { lazy, Suspense } from "react";
const DashboardHome = lazy(() => import("./home"));
const InboxPage = lazy(() => import("./inbox"));
const ConversationsPage = lazy(() => import("./conversations"));
const DealsPage = lazy(() => import("./deals"));
const CalendarPage = lazy(() => import("./calendar"));
const IntegrationsPage = lazy(() => import("./integrations"));
const InsightsPage = lazy(() => import("./insights"));

// Lazy load pages that might be large or are duplicated in App.tsx
const PricingPage = lazy(() => import("./pricing"));
const SettingsPage = lazy(() => import("./settings"));
const LeadImportPage = lazy(() => import("./lead-import"));
const VideoAutomationPage = lazy(() => import("./video-automation"));
const CloserEngineLive = lazy(() => import("./closer-engine"));
const SalesAssistant = lazy(() => import("./sales-assistant"));
const AutomationBuilderPage = lazy(() => import("./automation-builder"));
const ContentLibraryPage = lazy(() => import("./content-library"));
const AIDecisionsPage = lazy(() => import("./ai-decisions"));
const ObjectionsLibraryPage = lazy(() => import("./objections-library"));

export default function DashboardRoutes() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="flex items-center justify-center p-8">Loading...</div>}>
        <Switch>
          <Route path="/dashboard" component={DashboardHome} />
          <Route path="/dashboard/inbox" component={InboxPage} />
          <Route path="/dashboard/conversations" component={ConversationsPage} />
          <Route path="/dashboard/conversations/:id" component={ConversationsPage} />
          <Route path="/dashboard/deals" component={DealsPage} />
          <Route path="/dashboard/calendar" component={CalendarPage} />
          <Route path="/dashboard/integrations" component={IntegrationsPage} />
          <Route path="/dashboard/insights" component={InsightsPage} />
          <Route path="/dashboard/pricing" component={PricingPage} />
          <Route path="/dashboard/settings" component={SettingsPage} />
          <Route path="/dashboard/lead-import" component={LeadImportPage} />
          <Route path="/dashboard/video-automation" component={VideoAutomationPage} />
          <Route path="/dashboard/closer-engine" component={CloserEngineLive} />
          <Route path="/dashboard/sales-assistant" component={SalesAssistant} />
          <Route path="/dashboard/automation" component={AutomationBuilderPage} />
          <Route path="/dashboard/content-library" component={ContentLibraryPage} />
          <Route path="/dashboard/ai-decisions" component={AIDecisionsPage} />
          <Route path="/dashboard/objections" component={ObjectionsLibraryPage} />
        </Switch>
      </Suspense>
    </DashboardLayout>
  );
}
