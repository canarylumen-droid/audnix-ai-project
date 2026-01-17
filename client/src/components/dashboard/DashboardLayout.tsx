import { useState, useCallback, KeyboardEvent } from "react";
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
  Check
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
    "Engagement": true,
    "Tools": true,
    "Reports": true
  });

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
        { label: "Automation", icon: Zap, path: "/dashboard/automation" },
        { label: "Pipeline", icon: Briefcase, path: "/dashboard/deals" },
        { label: "Integrations", icon: Plug, path: "/dashboard/integrations" },
      ],
    },
    {
      label: "Engagement",
      items: [
        { label: "Prospecting", icon: Search, path: "/dashboard/prospecting" },
        { label: "Import Leads", icon: Upload, path: "/dashboard/lead-import" },
        { label: "Knowledge Base", icon: BookMarked, path: "/dashboard/content-library" },
        { label: "Objections", icon: Shield, path: "/dashboard/objections" },
        { label: "Conversations", icon: MessageSquare, path: "/dashboard/conversations" },
      ],
    },
    {
      label: "Reports",
      items: [
        { label: "Audit Logs", icon: Activity, path: "/dashboard/ai-decisions" },
        { label: "Analytics", icon: BarChart3, path: "/dashboard/insights" },
        { label: "Engagement Map", icon: Globe, path: "/dashboard/video-automation" },
      ],
    },
  ];

  const isFeatureUnlocked = useCallback((_step?: string): boolean => {
    return true;
  }, []);

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
        className={`relative flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer group mb-1 ${isActive
          ? "bg-primary/10 text-primary font-bold shadow-sm"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
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
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <PremiumLoader text="Preparing Workspace..." />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background font-sans text-foreground overflow-hidden">
      <InternetConnectionBanner />
      <InstallPWAPrompt />
      <GuidedTour isOpen={showTour} onComplete={completeTour} onSkip={skipTour} />


      {/* Desktop Sidebar */}
      <motion.aside
        className="hidden md:flex flex-col border-r border-border/40 bg-[#030303]/90 backdrop-blur-3xl z-50 transition-all duration-500 ease-out relative"
        animate={{ width: sidebarCollapsed ? "5rem" : "20rem" }}
      >


        {/* Sidebar Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-border/40">
          <Logo className="h-10 w-10" textClassName="text-xl font-bold" />
        </div>
        {!sidebarCollapsed && (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setSidebarCollapsed(true)}>
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        )}
        {sidebarCollapsed && (
          <div className="flex justify-center py-4 border-b border-border/40">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setSidebarCollapsed(false)}>
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          </div>
        )}


        {/* Navigation */}
        <ScrollArea className="flex-1 px-4 py-8">
          <div className="space-y-8">
            <div>
              {!sidebarCollapsed && <h4 className="px-4 text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.2em] mb-3 font-sans">Platform</h4>}
              {renderNavItem({ label: "Overview", icon: Home, path: "/dashboard" })}
              {renderNavItem({ label: "Inbox", icon: Inbox, path: "/dashboard/inbox" })}
            </div>

            {navGroups.map(group => (
              <div key={group.label} className="space-y-2">
                {!sidebarCollapsed ? (
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="flex items-center justify-between w-full px-4 py-1.5 text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.2em] hover:text-foreground transition-colors group font-sans"
                  >
                    {group.label}
                    <ChevronDown className={`h-3 w-3 transition-transform opacity-50 group-hover:opacity-100 ${expandedGroups[group.label] ? "" : "-rotate-90"}`} />
                  </button>
                ) : (
                  <Separator className="my-4 bg-border/40" />
                )}

                <AnimatePresence initial={false}>
                  {(expandedGroups[group.label] || sidebarCollapsed) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden space-y-1"
                    >
                      {group.items.map(item => renderNavItem(item, item.requiresStep && !isFeatureUnlocked(item.requiresStep)))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            <div className="pt-8">
              {sidebarCollapsed && <Separator className="my-4 bg-border/40" />}
              {renderNavItem({ label: "Settings", icon: Settings, path: "/dashboard/settings" })}
            </div>
          </div>
        </ScrollArea>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-border/40">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className={`flex items-center gap-3 cursor-pointer p-2 rounded-xl hover:bg-muted/50 transition-all group ${sidebarCollapsed ? "justify-center" : ""}`}>
                <Avatar className="h-10 w-10 rounded-xl border border-border/40 shadow-sm">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="rounded-xl bg-muted font-bold text-sm">
                    {(user?.name || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {!sidebarCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate text-foreground">{user?.name || "Member"}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{user?.plan || "Free"} Plan</p>
                  </div>
                )}
                {!sidebarCollapsed && <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground transition-colors" />}
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

              <div className="p-1">
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
                <DropdownMenuItem onClick={handleSignOut} className="rounded-xl text-destructive hover:bg-destructive/10 cursor-pointer py-2.5 font-bold text-xs uppercase tracking-wider">
                  <LogOut className="mr-3 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-background relative z-10 transition-all duration-500">
        {/* Top Header */}
        <header className="h-20 border-b border-border/40 bg-background/90 backdrop-blur-2xl flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4 flex-1">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden -ml-2 text-muted-foreground hover:bg-muted/50 rounded-xl">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-80 bg-background border-r border-border/40">
                <div className="h-20 flex items-center px-6 border-b border-border/40 mb-4">
                  <Logo className="h-8 w-8" textClassName="text-lg font-bold" />
                </div>
                <ScrollArea className="h-[calc(100vh-6rem)] px-4">
                  <div className="space-y-6">
                    <div>
                      <h4 className="px-4 text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.2em] mb-3">Platform</h4>
                      {renderNavItem({ label: "Overview", icon: Home, path: "/dashboard" })}
                      {renderNavItem({ label: "Inbox", icon: Inbox, path: "/dashboard/inbox" })}
                    </div>
                    {navGroups.map(group => (
                      <div key={group.label} className="space-y-1">
                        <h4 className="px-4 text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.2em] mb-2">{group.label}</h4>
                        {group.items.map(item => renderNavItem(item, item.requiresStep && !isFeatureUnlocked(item.requiresStep)))}
                      </div>
                    ))}
                    <div className="pt-4 border-t border-border/20">
                      {renderNavItem({ label: "Settings", icon: Settings, path: "/dashboard/settings" })}
                    </div>
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <div className="relative max-w-md w-full hidden md:block group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search leads, actions, or tools..."
                className="h-11 pl-11 bg-muted/40 border-border/10 focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-xl font-medium placeholder:text-muted-foreground transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-40 group-focus-within:opacity-100 transition-opacity">
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded border border-border bg-muted/50 font-mono text-[10px] font-bold text-muted-foreground">
                  ⌘K
                </kbd>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeSwitcher />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted/50">
                  <Bell className="h-5 w-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full bg-primary text-[10px] font-bold text-black border-2 border-background animate-in fade-in zoom-in duration-300">
                      {unreadNotifications > 99 ? '99+' : unreadNotifications}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0 rounded-2xl overflow-hidden mt-2">
                <div className="p-4 border-b border-border/40 flex items-center justify-between bg-muted/20">
                  <h4 className="font-bold text-sm">Notifications</h4>
                  {unreadNotifications > 0 && <Badge className="text-[10px] font-bold bg-primary text-black border-0">{unreadNotifications} new</Badge>}
                </div>
                <ScrollArea className="h-[350px]">
                  {recentNotifications.length > 0 ? (
                    <div className="divide-y divide-border/20">
                      {recentNotifications.map(notification => (
                        <div key={notification.id} className={`p-4 hover:bg-muted/30 transition-colors cursor-pointer flex gap-4 ${!notification.read ? 'bg-primary/5' : ''}`}>
                          <div className={`mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0 ${!notification.read ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                          <div className="space-y-1 flex-1">
                            <p className="text-sm font-bold leading-none">{notification.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{notification.description}</p>
                            <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">{new Date(notification.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground/40">
                      <Inbox className="h-10 w-10 mb-4 opacity-20" />
                      <p className="text-sm font-bold uppercase tracking-widest">Inbox Empty</p>
                    </div>
                  )}
                </ScrollArea>
                <div className="p-2 border-t border-border/20 bg-muted/30">
                  <Button variant="ghost" size="sm" className="w-full text-[10px] font-bold uppercase tracking-wider h-9">View All Notifications</Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

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
        <main className="flex-1 overflow-auto bg-background/50">
          <div className="max-w-7xl mx-auto p-6 md:p-8 lg:p-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
