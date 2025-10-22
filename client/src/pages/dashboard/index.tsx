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
import AdminPage from "./admin";

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
        <Route path="/dashboard/admin" component={AdminPage} />
      </Switch>
    </DashboardLayout>
  );
}
