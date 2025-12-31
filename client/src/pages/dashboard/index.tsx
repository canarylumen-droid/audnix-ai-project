import { Route, Switch } from "wouter";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import DashboardHome from "./home";
import InboxPage from "./inbox";
import ConversationsPage from "./conversations";
import DealsPage from "./deals";
import CalendarPage from "./calendar";
import IntegrationsPage from "./integrations";
import InsightsPage from "./insights";
import PricingPage from "./pricing";
import SettingsPage from "./settings";
import LeadImportPage from "./lead-import";
import VideoAutomationPage from "./video-automation";
import CloserEngineLive from "./closer-engine";
import SalesAssistant from "./sales-assistant";
import AutomationBuilderPage from "./automation-builder";
import ContentLibraryPage from "./content-library";
import AIDecisionsPage from "./ai-decisions";

export default function DashboardRoutes() {
  return (
    <DashboardLayout>
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
      </Switch>
    </DashboardLayout>
  );
}
