import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "@/pages/landing";
import Auth from "@/pages/auth";
import DashboardRoutes from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import { InternetConnectionBanner } from "@/components/InternetConnectionBanner";
import ConversationsPage from "./pages/dashboard/conversations";
import CalendarPage from "./pages/dashboard/calendar";
import InsightsPage from "./pages/dashboard/insights";
import VideoAutomationPage from "./pages/dashboard/video-automation";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/auth" component={Auth} />
      <Route path="/dashboard" component={DashboardRoutes} />
      <Route path="/dashboard/:rest*" component={DashboardRoutes} />
      <Route path="/dashboard/conversations/:id?" component={ConversationsPage} />
      <Route path="/dashboard/video-automation" component={VideoAutomationPage} />
      <Route path="/dashboard/calendar" component={CalendarPage} />
      <Route path="/dashboard/insights" component={InsightsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <InternetConnectionBanner />
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;