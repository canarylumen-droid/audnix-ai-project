
import { useState, useCallback, KeyboardEvent, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TrialExpiredOverlay } from "@/components/TrialExpiredOverlay";
import { InternetConnectionBanner } from "@/components/InternetConnectionBanner";
import { InstallPWAPrompt } from "@/components/InstallPWAPrompt";
import { GuidedTour, useTour } from "@/components/ui/GuidedTour";
import { ActivationChecklist, useActivationChecklist, ActivationState } from "@/components/ui/ActivationChecklist";
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
  Brain,
  PanelLeftClose,
  PanelLeftOpen,
  Command,
  CreditCard,
  User,
  Check
} from "lucide-react";

import { useTheme } from "next-themes";
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
import { PremiumLoader } from "@/components/ui/premium-loader";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  adminOnly?: boolean;
  requiresStep?: keyof ActivationState;
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
  description?: string;
  read: boolean;
  createdAt: string;
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

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    "Framework": true,
    "Neural Engine": true,
    "Operations": true,
    "Intelligence": true,
    "Analytics": true
  });

  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      setLocation(`/dashboard/inbox?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const { showChecklist, isComplete: activationComplete, closeChecklist, handleComplete, activationState } = useActivationChecklist();

  const navGroups: NavGroup[] = [
    {
      label: "Intelligence",
      items: [
        { label: "Automation", icon: Zap, path: "/dashboard/automation" },
        { label: "Pipeline", icon: Briefcase, path: "/dashboard/deals" },
        { label: "Integrations", icon: Plug, path: "/dashboard/integrations" },
      ],
    },
    {
      label: "Operations",
      items: [
        { label: "Import Leads", icon: Upload, path: "/dashboard/lead-import" },
        { label: "Brand Memory", icon: BookMarked, path: "/dashboard/content-library" },
        { label: "Objections", icon: Shield, path: "/dashboard/objections" },
        { label: "Conversations", icon: MessageSquare, path: "/dashboard/conversations" },
      ],
    },
    {
      label: "Analytics",
      items: [
        { label: "AI Audit", icon: Activity, path: "/dashboard/ai-decisions" },
        { label: "Insights", icon: BarChart3, path: "/dashboard/insights" },
        { label: "Video Automation", icon: Globe, path: "/dashboard/video-automation" },
      ],
    },
  ];

  const isFeatureUnlocked = useCallback((step?: keyof ActivationState): boolean => {
    if (!step) return true;
    return activationState[step] || false;
  }, [activationState]);

  const { data: user, isLoading: isUserLoading } = useQuery<UserProfile | null>({
    queryKey: ["/api/user/profile"],
    staleTime: Infinity,
  });

  const onboardingCompleted = user?.metadata?.onboardingCompleted || false;
  const { showTour, completeTour, skipTour } = useTour(onboardingCompleted);

  const { data: notificationsData } = useQuery<NotificationsData | null>({
    queryKey: ["/api/user/notifications"],
    refetchInterval: 60000,
  });

  const { data: dashboardStats } = useQuery<any>({
    queryKey: ["/api/dashboard/stats"],
  });

  const unreadNotifications = notificationsData?.unreadCount || 0;
  const recentNotifications = notificationsData?.notifications.slice(0, 5) || [];

  const handleSignOut = async () => {
    await apiRequest('POST', '/api/auth/signout');
    queryClient.clear();
    window.location.href = '/';
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
          <div className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all`}>
            <Lock className="h-4 w-4 text-muted-foreground" />
            {!sidebarCollapsed && <span className="text-sm font-medium text-muted-foreground">{item.label}</span>}
          </div>
          {/* Tooltip for locked items could go here */}
        </div>
      );
    }

    return (
      <div
        key={item.path}
        onClick={() => setLocation(item.path)}
        className={`relative flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer group mb-1 ${isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          }`}
      >
        <Icon className={`h-4 w-4 transition-colors ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
        {!sidebarCollapsed && (
          <span className="text-sm truncate flex-1">
            {item.label}
          </span>
        )}
        {isActive && !sidebarCollapsed && (
          <motion.div layoutId="active-pill" className="absolute right-2 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
        )}
      </div>
    );
  };

  if (isUserLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <PremiumLoader text="Initializing Workspace..." />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background font-sans text-foreground overflow-hidden">
      <InternetConnectionBanner />
      <InstallPWAPrompt />
      <GuidedTour isOpen={showTour} onComplete={completeTour} onSkip={skipTour} />
      <ActivationChecklist isOpen={showChecklist} onClose={closeChecklist} onComplete={handleComplete} />

      {/* Desktop Sidebar */}
      <motion.aside
        className="hidden md:flex flex-col border-r border-border/40 bg-card/30 backdrop-blur-xl z-50 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        animate={{ width: sidebarCollapsed ? "5rem" : "18rem" }}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border/40">
          <div className={`flex items-center gap-3 ${sidebarCollapsed ? "justify-center w-full" : ""}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-primary to-purple-600 text-white shadow-lg shadow-primary/20">
              <Brain className="h-5 w-5" />
            </div>
            {!sidebarCollapsed && (
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Audnix
              </span>
            )}
          </div>
          {!sidebarCollapsed && (
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => setSidebarCollapsed(true)}>
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          )}
        </div>

        {sidebarCollapsed && (
          <div className="flex justify-center py-2 border-b border-border/40">
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => setSidebarCollapsed(false)}>
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-6">
          <div className="space-y-6">
            <div>
              {!sidebarCollapsed && <h4 className="px-4 text-xs font-semibold text-muted-foreground/50 uppercase tracking-widest mb-2">Platform</h4>}
              {renderNavItem({ label: "Overview", icon: Home, path: "/dashboard" })}
              {renderNavItem({ label: "Inbox", icon: Inbox, path: "/dashboard/inbox" })}
            </div>

            {navGroups.map(group => (
              <div key={group.label} className="space-y-1">
                {!sidebarCollapsed ? (
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold text-muted-foreground/50 uppercase tracking-widest hover:text-foreground transition-colors group"
                  >
                    {group.label}
                    <ChevronDown className={`h-3 w-3 transition-transform opacity-50 group-hover:opacity-100 ${expandedGroups[group.label] ? "" : "-rotate-90"}`} />
                  </button>
                ) : (
                  <Separator className="my-2 bg-border/40" />
                )}

                <AnimatePresence initial={false}>
                  {(expandedGroups[group.label] || sidebarCollapsed) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden space-y-0.5"
                    >
                      {group.items.map(item => renderNavItem(item, item.requiresStep && !isFeatureUnlocked(item.requiresStep)))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            <div className="pt-4">
              {sidebarCollapsed && <Separator className="my-2 bg-border/40" />}
              {renderNavItem({ label: "Settings", icon: Settings, path: "/dashboard/settings" })}
            </div>
          </div>
        </ScrollArea>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border/40 bg-background/30 backdrop-blur-md">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className={`flex items-center gap-3 cursor-pointer p-2 rounded-xl hover:bg-sidebar-accent transition-all group ${sidebarCollapsed ? "justify-center" : ""}`}>
                <Avatar className="h-9 w-9 rounded-lg border border-border/50 shadow-sm transition-transform group-hover:scale-105">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="rounded-lg bg-gradient-to-br from-muted to-muted/50 font-medium text-xs">
                    {(user?.name || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {!sidebarCollapsed && (
                  <div className="flex-1 min-w-0 flex flex-col items-start text-left">
                    <p className="text-sm font-semibold truncate text-foreground">{user?.name || "User"}</p>
                    <p className="text-xs text-muted-foreground truncate w-full">{user?.plan || "Free Plan"}</p>
                  </div>
                )}
                {!sidebarCollapsed && <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-foreground transition-colors" />}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={sidebarCollapsed ? "start" : "end"} className="w-72 p-0" side={sidebarCollapsed ? "right" : "top"} sideOffset={8}>
              <div className="p-4 border-b border-border/50 bg-muted/20">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-10 w-10 border border-primary/20">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {(user?.name || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="text-sm font-bold text-foreground leading-none mb-1">{user?.name}</p>
                    <p className="text-[10px] font-medium text-muted-foreground leading-none truncate w-40">{user?.email}</p>
                  </div>
                </div>

                {/* Usage Limits */}
                <div className="space-y-3 mt-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 italic">
                      <span>Leads Usage</span>
                      <span>{dashboardStats?.totalLeads || 0} / {user?.plan === 'trial' ? 500 : 2500}</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(((dashboardStats?.totalLeads || 0) / (user?.plan === 'trial' ? 500 : 2500)) * 100, 100)}%` }}
                        className="h-full bg-primary"
                      />
                    </div>
                  </div>

                  {user?.plan === 'trial' && (
                    <div className="p-2 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="h-3 w-3 text-primary animate-pulse" />
                        <span className="text-[10px] font-black uppercase text-primary italic">Trial Active</span>
                      </div>
                      <span className="text-[10px] font-black text-primary italic">{dashboardStats?.trialDaysLeft || 0}d left</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-2">
                <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Actions</DropdownMenuLabel>
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => setLocation('/dashboard/settings')} className="rounded-xl cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span className="text-sm font-medium">Profile Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation('/dashboard/pricing')} className="rounded-xl cursor-pointer">
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span className="text-sm font-medium">Subscription</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem onClick={handleSignOut} className="rounded-xl text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span className="text-sm font-bold">Sign out Protocol</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {/* Top Header */}
        <header className="h-16 border-b border-border/40 bg-background/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-40 transition-all">
          <div className="flex items-center gap-4 flex-1">
            <Button variant="ghost" size="icon" className="md:hidden -ml-2 text-muted-foreground" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>

            {/* Global Search - Apple Spotlight Style */}
            <div className="relative max-w-md w-full hidden md:block group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search leads, deals, or commands..."
                className="h-10 pl-10 bg-muted/40 border-transparent focus:bg-background focus:border-primary/20 focus:ring-2 focus:ring-primary/10 transition-all rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                <kbd className="inline-flex items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeSwitcher />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground rounded-full hover:bg-muted/50">
                  <Bell className="h-5 w-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background animate-pulse" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0">
                <div className="p-4 border-b border-border/50 flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Notifications</h4>
                  {unreadNotifications > 0 && <Badge variant="secondary" className="text-xs bg-muted/50">{unreadNotifications} new</Badge>}
                </div>
                <ScrollArea className="h-[300px]">
                  {recentNotifications.length > 0 ? (
                    <div className="divide-y divide-border/30">
                      {recentNotifications.map(notification => (
                        <div key={notification.id} className={`p-4 hover:bg-muted/30 transition-colors cursor-pointer flex gap-3 ${!notification.read ? 'bg-primary/5' : ''}`}>
                          <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${!notification.read ? 'bg-primary' : 'bg-transparent'}`} />
                          <div className="space-y-1">
                            <p className={`text-sm ${!notification.read ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>{notification.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">{notification.description}</p>
                            <p className="text-[10px] text-muted-foreground/70">{new Date(notification.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
                      <Inbox className="h-8 w-8 mb-2 opacity-50" />
                      <p className="text-sm">No new notifications</p>
                    </div>
                  )}
                </ScrollArea>
                <div className="p-2 border-t border-border/50 bg-muted/10">
                  <Button variant="ghost" size="sm" className="w-full text-xs h-8">View all notifications</Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Separator orientation="vertical" className="h-6 mx-1 bg-border/40" />

            {/* Mobile Header Profile */}
            <div className="md:hidden">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>{(user?.name || "U")[0]}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden"
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed inset-y-0 left-0 z-50 w-72 bg-background border-r border-border shadow-2xl md:hidden"
              >
                <div className="flex items-center justify-between p-4 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded-lg text-primary"><Brain className="h-5 w-5" /></div>
                    <span className="font-bold text-lg">Audnix</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <ScrollArea className="h-full px-4 py-6">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-widest mb-3 px-2">Navigation</h4>
                      {renderNavItem({ label: "Overview", icon: Home, path: "/dashboard" })}
                      {renderNavItem({ label: "Inbox", icon: Inbox, path: "/dashboard/inbox" })}
                    </div>
                    {navGroups.map(group => (
                      <div key={group.label} className="mb-6">
                        <h4 className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-widest mb-3 px-2">{group.label}</h4>
                        <div className="space-y-1">
                          {group.items.map(item => renderNavItem(item))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t border-border/40 bg-muted/5">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback>{(user?.name || "U")[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{user?.name}</p>
                      <Button variant="ghost" className="p-0 h-auto text-xs text-muted-foreground hover:bg-transparent hover:text-foreground" onClick={handleSignOut}>Sign out</Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-muted/5 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in py-2">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
