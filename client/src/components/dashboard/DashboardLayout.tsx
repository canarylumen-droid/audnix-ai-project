import { useState, useCallback, KeyboardEvent, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TrialExpiredOverlay } from "@/components/TrialExpiredOverlay";
import { InternetConnectionBanner } from "@/components/InternetConnectionBanner";
import { InstallPWAPrompt } from "@/components/InstallPWAPrompt";
import { GuidedTour, useTour } from "@/components/ui/GuidedTour";
import {
  Home,
  Inbox,
  MessageSquare,
  Briefcase,
  Plug,
  BarChart3,
  Settings,
  Shield,
  Menu,
  X,
  Search,
  Bell,
  ChevronDown,
  LogOut,
  Upload,
  Zap,
  BookMarked,
  Activity,
  Sun,
  Moon,
  Globe,
  Lock,
  ChevronRight,
  LayoutGrid,
  PanelLeftClose,
  PanelLeftOpen,
  Command,
  CreditCard,
  User,
  Check,
  Sparkles,
  Trash2,
  DollarSign,
  Users
} from "lucide-react";

import { useTheme } from "next-themes";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/ui/Logo";
import { PremiumLoader } from "@/components/ui/premium-loader";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { BellRing, ShieldCheck, Info } from "lucide-react";
import { useRealtime, RealtimeProvider } from "@/hooks/use-realtime";
import { formatDistanceToNow } from "date-fns";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  adminOnly?: boolean;
  requiresStep?: string;
  badge?: React.ReactNode;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  avatar?: string;
  username?: string;
  role?: 'admin' | 'member';
  plan?: string;
  trialExpiresAt?: string;
  metadata?: {
    onboardingCompleted?: boolean;
    [key: string]: unknown;
  };
}

interface Notification {
  id: string;
  title: string;
  message: string;
  description?: string;
  isRead: boolean;
  createdAt: string;
  type?: string;
}

interface NotificationsData {
  notifications: Notification[];
  unreadCount: number;
}

const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full w-9 h-9 text-muted-foreground hover:text-foreground transition-colors hover:bg-muted/50"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};

export function DashboardLayout({ children, fullHeight = false }: { children: React.ReactNode, fullHeight?: boolean }) {
  const { data: user, isLoading: isUserLoading } = useQuery<UserProfile | null>({
    queryKey: ["/api/user/profile"],
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
  const tourState = useTour(user?.metadata?.onboardingCompleted);
  const { showTour, completeTour, skipTour, replayTour } = tourState || { 
    showTour: false, 
    completeTour: () => {}, 
    skipTour: () => {},
    replayTour: () => {}
  };
  const [location, setLocation] = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    "Engagement": true,
    "Tools": true,
    "Reports": true
  });

  const toggleAutonomousMode = useMutation({
    mutationFn: async (enabled: boolean) => {
      const currentConfig = (user as any)?.config || {};
      return apiRequest('PUT', '/api/user/profile', {
        config: { ...currentConfig, autonomousMode: enabled }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      toast({
        title: "Engine Updated",
        description: `Autonomous AI mode has been ${((user as any)?.config?.autonomousMode === false) ? 'enabled' : 'disabled'}.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update engine settings.",
        variant: "destructive"
      });
    }
  });

  const isAutonomousMode = (user as any)?.config?.autonomousMode !== false;

  const [currentAlert, setCurrentAlert] = useState<{ title: string; message: string; type: string } | null>(null);

  const { permission, isSubscribed, subscribe, loading: pushLoading } = usePushNotifications();

  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      setLocation(`/dashboard/inbox?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };





  const navGroups: NavGroup[] = [
    {
      label: "Tools",
      items: [
        { label: "Inbox", icon: Inbox, path: "/dashboard/inbox" },
        { label: "Automation", icon: Zap, path: "/dashboard/automation" },
        { label: "Pipeline", icon: Briefcase, path: "/dashboard/deals" },
        { label: "Integrations", icon: Plug, path: "/dashboard/integrations" },
      ],
    },
    {
      label: "Engagement",
      items: [
        { label: "Import Leads", icon: Upload, path: "/dashboard/lead-import" },
        { label: "Objections", icon: Shield, path: "/dashboard/objections" },
      ],
    },
    {
      label: "Reports",
      items: [
        { label: "Transparency Audit Log", icon: Activity, path: "/dashboard/ai-decisions" },
        { label: "Analytics", icon: BarChart3, path: "/dashboard/analytics" },
        { label: "Insights", icon: Sparkles, path: "/dashboard/insights" },
        { label: "Video Automation", icon: Globe, path: "/dashboard/video-automation" },
      ],
    },
  ];

  const isFeatureUnlocked = useCallback((_step?: string): boolean => {
    return true;
  }, []);




  const { isConnected } = useRealtime();

  const { data: notificationsData } = useQuery<NotificationsData | null>({
    queryKey: ["/api/notifications"],
    staleTime: 1000 * 60, // 1 minute cache
  });

  const { data: dashboardStats } = useQuery<any>({
    queryKey: ["/api/dashboard/stats"],
    staleTime: 1000 * 30, // 30 seconds cache
  });

  const unreadNotifications = notificationsData?.unreadCount || 0;
  const [notifDateFilter, setNotifDateFilter] = useState<'all' | 'today' | 'week'>('all');

  const handleSignOut = async () => {
    try {
      await apiRequest('POST', '/api/auth/signout');
    } catch (e) {
      console.error('Signout request failed', e);
    } finally {
      queryClient.clear();
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    }
  };

  const toggleGroup = useCallback((groupLabel: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupLabel]: !prev[groupLabel] }));
  }, []);

  const isPathActive = (path: string) => {
    if (path === "/dashboard") return location === "/dashboard";
    return location.startsWith(path);
  };

  const renderNavItem = (item: NavItem, isLocked: boolean = false) => {
    const Icon = item.icon;
    const isActive = isPathActive(item.path);

    if (isLocked) {
      return (
        <div key={item.path} className="px-2 mb-1 opacity-50 cursor-not-allowed group relative">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all">
            <Lock className="h-4 w-4 text-muted-foreground" />
            {!sidebarCollapsed && <span className="text-sm font-bold text-muted-foreground">{item.label}</span>}
          </div>
        </div>
      );
    }

    return (
      <div
        key={item.path}
        data-testid={`nav-item-${item.label.toLowerCase()}`}
        onClick={() => setLocation(item.path)}
        className={`relative flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer group mb-1 hover-bounce ${isActive
          ? "bg-primary/10 text-primary font-bold shadow-sm"
          : "text-muted-foreground hover:bg-white/5 dark:hover:bg-white/10 hover:text-foreground dark:hover:text-white"
          }`}
      >
        <Icon className={`h-4 w-4 transition-colors ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
        {!sidebarCollapsed && (
          <span className="text-sm truncate flex-1 font-semibold">
            {item.label}
          </span>
        )}
        {isActive && !sidebarCollapsed && (
          <motion.div layoutId="active-pill" className="absolute right-2 w-1.5 h-1.5 bg-primary rounded-full" />
        )}
      </div>
    );
  };

  if (isUserLoading) {
    return (
      <div className="h-[100dvh] w-screen flex items-center justify-center bg-background">
        <PremiumLoader text="Preparing Workspace..." />
      </div>
    );
  }

  return (
    <RealtimeProvider userId={user?.id}>
      <div className="flex h-[100dvh] bg-background font-sans text-foreground overflow-hidden relative">
      <InternetConnectionBanner />
      <InstallPWAPrompt />
      <GuidedTour isOpen={showTour} onComplete={completeTour} onSkip={skipTour} />

      {/* Desktop Sidebar (Standard Variant) */}
      <motion.aside
        data-testid="sidebar-desktop"
        className="hidden md:flex flex-col z-50 transition-all duration-500 ease-out relative border-r border-border/40 bg-sidebar/95 backdrop-blur-xl"
        animate={{ width: sidebarCollapsed ? "5.5rem" : "18rem" }}
      >
        <div className="flex-1 flex flex-col overflow-hidden relative">


          {/* Sidebar Header */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-border/40">
            {!sidebarCollapsed ? (
              <Logo className="h-8 w-8" textClassName="text-lg font-bold text-foreground" />
            ) : (
              <div className="w-full flex justify-center">
                <Logo className="h-8 w-8" textClassName="hidden" />
              </div>
            )}
          </div>

          <div className="absolute top-20 right-4 z-10 -translate-y-1/2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-background border border-border/40 hover:bg-muted text-muted-foreground hover:text-foreground shadow-sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </div>


          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-6">
            <div className="space-y-8">
              <div>
                {!sidebarCollapsed && <h4 className="px-4 text-[10px] font-bold text-primary/40 uppercase tracking-[0.2em] mb-4 font-sans flex items-center gap-2">
                  <div className="h-[1px] w-2 bg-primary/20" /> Core
                </h4>}
                {renderNavItem({ label: "Overview", icon: Home, path: "/dashboard" })}
              </div>

              {navGroups.map(group => (
                <div key={group.label} className="space-y-2">
                  {!sidebarCollapsed ? (
                    <button
                      onClick={() => toggleGroup(group.label)}
                      className="flex items-center justify-between w-full px-4 py-1.5 text-[10px] font-bold text-primary/60 dark:text-primary/40 uppercase tracking-[0.2em] hover:text-foreground dark:hover:text-white transition-colors group font-sans"
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-[1px] w-2 bg-primary/20" />
                        {group.label}
                      </div>
                      <ChevronDown className={`h-3 w-3 transition-transform opacity-30 group-hover:opacity-100 ${expandedGroups[group.label] ? "" : "-rotate-90"}`} />
                    </button>
                  ) : (
                    <div className="h-px bg-white/5 mx-4 my-6" />
                  )}

                  <AnimatePresence initial={false}>
                    {(expandedGroups[group.label] || sidebarCollapsed) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden space-y-1 px-1"
                      >
                        {group.items.map(item => renderNavItem(item, !!(item.requiresStep && !isFeatureUnlocked(item.requiresStep))))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}

              <div className="pt-8 px-1">
                {sidebarCollapsed && <div className="h-px bg-white/5 mx-4 my-6" />}
                {renderNavItem({ label: "Settings", icon: Settings, path: "/dashboard/settings" })}
              </div>

              {/* Autonomous Mode Toggle */}
              <div className={`mt-auto px-4 py-6 ${sidebarCollapsed ? "flex justify-center" : ""}`}>
                <div className={`flex items-center justify-between p-3 rounded-2xl border border-primary/10 bg-primary/5 transition-all hover:bg-primary/10 ${sidebarCollapsed ? "w-12 h-12 p-0 justify-center" : "w-full"}`}>
                  {!sidebarCollapsed && (
                    <div className="flex flex-col gap-0.5">
                      <Label htmlFor="autonomous-mode" className="text-[10px] font-bold uppercase tracking-wider text-primary cursor-pointer">
                        AI Engine
                      </Label>
                      <span className="text-[9px] text-muted-foreground font-medium">
                        {isAutonomousMode ? "Autonomous" : "Manual"}
                      </span>
                    </div>
                  )}
                  <div className={sidebarCollapsed ? "scale-75" : ""}>
                    <Switch
                      id="autonomous-mode"
                      checked={isAutonomousMode}
                      onCheckedChange={(checked) => toggleAutonomousMode.mutate(checked)}
                      disabled={toggleAutonomousMode.isPending}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-border/40 bg-muted/20">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className={`flex items-center gap-3 cursor-pointer p-2 rounded-xl hover:bg-muted transition-all group ${sidebarCollapsed ? "justify-center" : ""}`}>
                  <div className="relative">
                    <Avatar className="h-10 w-10 rounded-lg border border-border shadow-sm transition-transform group-hover:scale-105">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback className="rounded-lg bg-primary/20 text-primary font-bold text-sm">
                        {(user?.name || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-sidebar" />
                  </div>
                  {!sidebarCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate text-foreground/90 group-hover:text-foreground">{user?.name || "Member"}</p>
                      <p className="text-[10px] font-bold text-primary/60 uppercase tracking-wider">{user?.plan || "Free"} AI Model</p>
                    </div>
                  )}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={sidebarCollapsed ? "start" : "end"} className="w-72 p-1 rounded-2xl" side={sidebarCollapsed ? "right" : "top"} sideOffset={12}>
                <div className="p-4 border-b border-border/40 bg-muted/20 rounded-t-xl mb-1">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-12 w-12 border-2 border-primary/20 rounded-xl">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold rounded-xl">
                        {(user?.name || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-bold text-foreground mb-0.5">{user?.name}</p>
                      <p className="text-[10px] font-bold text-muted-foreground truncate w-40">{user?.email}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground/80">
                        <span>Leads Processed</span>
                        <span>{dashboardStats?.totalLeads || 0} / {user?.plan === 'trial' ? 500 : 2500}</span>
                      </div>
                      <div className="h-1 w-full bg-muted/50 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(((dashboardStats?.totalLeads || 0) / (user?.plan === 'trial' ? 500 : 2500)) * 100, 100)}%` }}
                          className="h-full bg-primary"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => setLocation('/dashboard/settings')} className="rounded-xl cursor-pointer py-2.5 font-bold text-xs uppercase tracking-wider">
                    <User className="mr-3 h-4 w-4" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation('/dashboard/pricing')} className="rounded-xl cursor-pointer py-2.5 font-bold text-xs uppercase tracking-wider">
                    <CreditCard className="mr-3 h-4 w-4" />
                    Subscription
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="my-1 mx-2" />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={handleSignOut} className="rounded-xl text-destructive hover:bg-destructive/10 cursor-pointer py-2.5 font-bold text-xs uppercase tracking-wider">
                    <LogOut className="mr-3 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-background relative z-10 transition-all duration-500">
        {/* Top Header */}
        <header className="h-20 border-b border-border/40 bg-background/80 backdrop-blur-xl flex items-center justify-between px-6 md:px-10 sticky top-0 z-40 transition-all duration-300">
          <div className="flex items-center gap-6 flex-1">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden -ml-2 text-foreground/80 hover:bg-primary/10 hover:text-primary rounded-2xl w-12 h-12 transition-all shadow-sm border border-border/10">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[70%] sm:w-[380px] bg-background border-r border-border/40 flex flex-col pt-0">
                <div className="h-24 flex items-center px-8 border-b border-border/40 bg-[#030712] text-white">
                  <Logo className="h-10 w-10" textClassName="text-2xl font-black tracking-tighter text-white" />
                </div>
                <ScrollArea className="flex-1 px-4 py-8">
                  <div className="space-y-10">
                    <div>
                      <h4 className="px-6 text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.3em] mb-4">Command Center</h4>
                      <div className="space-y-1">
                        {renderNavItem({ label: "Overview", icon: Home, path: "/dashboard" })}
                      </div>
                    </div>
                    {navGroups.map(group => (
                      <div key={group.label} className="space-y-2">
                        <h4 className="px-6 text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.3em] mb-4">{group.label}</h4>
                        <div className="space-y-1">
                          {group.items.map(item => renderNavItem(item, !!(item.requiresStep && !isFeatureUnlocked(item.requiresStep))))}
                        </div>
                      </div>
                    ))}
                    <div className="pt-6 border-t border-border/10">
                      {renderNavItem({ label: "Settings", icon: Settings, path: "/dashboard/settings" })}
                    </div>
                  </div>
                </ScrollArea>
                <div className="p-8 border-t border-border/10 bg-muted/10 space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-3xl bg-background border border-border/40">
                    <Avatar className="h-12 w-12 rounded-2xl">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback className="font-black bg-primary text-black">{(user?.name || "U")[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black truncate">{user?.name || "Member"}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{user?.plan || "Free"} plan active</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full rounded-2xl border-destructive/20 text-destructive hover:bg-destructive/10 h-12 font-bold"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <div className="relative max-w-lg w-full hidden md:block group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-all" />
              <Input
                placeholder="Search leads and messages..."
                className="h-12 pl-12 bg-muted/40 border-border/10 focus:bg-background focus:ring-4 focus:ring-primary/5 rounded-[1.25rem] font-bold text-sm placeholder:text-muted-foreground/40 dark:placeholder:text-white/60 transition-all shadow-inner text-foreground dark:text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-20 group-focus-within:opacity-100 transition-opacity">
                <kbd className="hidden sm:inline-flex items-center px-2 py-1 rounded-lg border border-border bg-muted/80 font-mono text-[9px] font-black text-foreground dark:text-white">
                  CTRL K
                </kbd>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {permission === 'default' && !isSubscribed && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-[11px] font-bold text-primary cursor-pointer hover:bg-primary/20 transition-all"
                onClick={subscribe}
              >
                <BellRing className="h-3 w-3 animate-pulse" />
                Enable Desktop Alerts
              </motion.div>
            )}
            <ThemeSwitcher />

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted/50 transition-all hover:scale-105 active:scale-95">
                  <Bell className="h-5 w-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full bg-primary text-[10px] font-black text-black border-2 border-background animate-in fade-in zoom-in duration-300">
                      {unreadNotifications > 99 ? '99+' : unreadNotifications}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-[450px] p-0 flex flex-col border-l border-border/40 bg-background/95 backdrop-blur-2xl">
                <div className="p-8 border-b border-border/20 bg-muted/20">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-2xl font-black tracking-tighter uppercase italic">Notifications</h4>
                    {unreadNotifications > 0 && (
                      <Badge className="bg-primary text-black font-black uppercase text-[10px] px-3 py-1">
                        {unreadNotifications} NEW
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium mb-4">Real-time alerts from your autonomous sales engine.</p>

                  <div className="flex flex-col gap-4">
                    <div className="flex gap-2">
                      {(['all', 'today', 'week'] as const).map(f => (
                        <Button
                          key={f}
                          variant="ghost"
                          size="sm"
                          onClick={() => setNotifDateFilter(f)}
                          className={cn(
                            "h-7 px-4 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border border-transparent",
                            notifDateFilter === f
                              ? "bg-primary text-black border-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]"
                              : "hover:bg-muted text-muted-foreground border-border/10"
                          )}
                        >
                          {f === 'all' ? 'All' : f === 'today' ? 'Today' : 'Week'}
                        </Button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 text-[10px] font-black uppercase tracking-[0.2em] flex-1 rounded-2xl border-primary/20 hover:bg-primary/5 transition-all"
                        onClick={async () => {
                          await apiRequest('POST', '/api/notifications/mark-all-read');
                          queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
                        }}
                      >
                        <Check className="w-4 h-4 mr-2 text-primary" />
                        Mark All Read
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-10 text-[10px] font-black uppercase tracking-[0.2em] flex-1 rounded-2xl text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all"
                        onClick={async () => {
                          if (confirm("Permanently delete all notifications?")) {
                            await apiRequest('POST', '/api/notifications/clear-all');
                            queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete All
                      </Button>
                    </div>
                  </div>
                </div>

                <ScrollArea className="flex-1 h-[calc(100vh-220px)]">
                  {notificationsData?.notifications && notificationsData.notifications.length > 0 ? (
                    <div className="flex flex-col">
                      {/* Table Header */}
                      <div className="grid grid-cols-[1fr_80px] px-6 py-3 border-b border-border/5 bg-muted/5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
                        <span>Message & Detail</span>
                        <span className="text-right">Time</span>
                      </div>
                      
                      {notificationsData.notifications
                        .filter(n => {
                          if (notifDateFilter === 'all') return true;
                          const date = new Date(n.createdAt);
                          const now = new Date();
                          if (notifDateFilter === 'today') {
                            return date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                          }
                          if (notifDateFilter === 'week') {
                            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                            return date >= weekAgo;
                          }
                          return true;
                        })
                        .map((notification) => (
                          <div
                            key={notification.id}
                            className={cn(
                              "grid grid-cols-[auto_1fr_auto] p-4 hover:bg-muted/30 transition-all cursor-pointer gap-4 relative group border-b border-border/5",
                              !notification.isRead && "bg-primary/5"
                            )}
                          >
                            {!notification.isRead && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                            )}
                            
                            <div className={cn(
                              "h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 transition-all group-hover:scale-105 border border-transparent",
                              !notification.isRead 
                                ? "bg-primary/10 text-primary border-primary/20" 
                                : "bg-muted/50 text-muted-foreground/40 border-border/10"
                            )}>
                              {notification.type === 'billing' ? <DollarSign className="h-4 w-4" /> : 
                               notification.type === 'lead' ? <Users className="h-4 w-4" /> : 
                               <Bell className="h-4 w-4" />}
                            </div>

                            <div className="space-y-1 min-w-0">
                              <p className={cn("text-sm tracking-tight leading-tight truncate", !notification.isRead ? "font-black" : "font-bold text-muted-foreground/80")}>
                                {notification.title}
                              </p>
                              <p className="text-xs text-muted-foreground/60 leading-tight line-clamp-2">
                                {notification.message || notification.description || "No details provided."}
                              </p>
                              {!notification.isRead && (
                                <button
                                  className="text-[9px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors mt-2"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      await apiRequest('PATCH', `/api/notifications/${notification.id}/read`, {});
                                      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
                                    } catch (err) {
                                      console.error("Failed to mark notification as read", err);
                                    }
                                  }}
                                >
                                  Mark Read
                                </button>
                              )}
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] font-black text-muted-foreground/30 uppercase whitespace-nowrap">
                                {(() => {
                                  try {
                                    return formatDistanceToNow(new Date(notification.createdAt), { addSuffix: false });
                                  } catch (e) {
                                    return 'now';
                                  }
                                })()}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[400px] p-8 text-center text-muted-foreground/20">
                      <div className="w-20 h-20 rounded-full bg-muted/10 flex items-center justify-center mb-6">
                        <Inbox className="h-10 w-10" />
                      </div>
                      <p className="text-sm font-black uppercase tracking-[0.2em]">Silence is golden</p>
                      <p className="text-xs font-medium mt-2">No active alerts at this moment.</p>
                    </div>
                  )}
                </ScrollArea>

                <div className="p-6 border-t border-border/20 bg-muted/10">
                  <Button
                    variant="ghost"
                    className="w-full h-10 rounded-2xl font-bold uppercase tracking-widest text-[10px] text-muted-foreground hover:bg-muted/20"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <Separator orientation="vertical" className="h-6 mx-1 bg-border/40" />

            <div className="md:hidden">
              <Avatar className="h-10 w-10 rounded-xl border border-border/40">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="font-bold rounded-xl">{(user?.name || "U")[0]}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-background relative">
          <AnimatePresence>
            {currentAlert && (
              <motion.div
                initial={{ height: 0, opacity: 0, y: -20 }}
                animate={{ height: "auto", opacity: 1, y: 0 }}
                exit={{ height: 0, opacity: 0, y: -20 }}
                className={cn(
                  "mx-8 mt-4 p-4 rounded-2xl border flex items-center justify-between gap-4 shadow-lg z-30",
                  currentAlert.type === 'billing_issue' ? "bg-destructive/5 border-destructive/20 text-destructive" : "bg-primary/5 border-primary/20 text-primary"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-xl", currentAlert.type === 'billing_issue' ? "bg-destructive/20" : "bg-primary/20")}>
                    {currentAlert.type === 'billing_issue' ? <ShieldCheck className="h-5 w-5" /> : <Info className="h-5 w-5" />}
                  </div>
                  <div>
                    <h5 className="font-bold text-sm">{currentAlert.title}</h5>
                    <p className="text-xs opacity-80">{currentAlert.message}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl opacity-50 hover:opacity-100" onClick={() => setCurrentAlert(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className={cn("mx-auto", !fullHeight && "max-w-7xl p-6 md:p-8 lg:p-10", fullHeight && "h-full")}>
            {children}
          </div>
        </main>
      </div>
      </div>
    </RealtimeProvider>
  );
}
