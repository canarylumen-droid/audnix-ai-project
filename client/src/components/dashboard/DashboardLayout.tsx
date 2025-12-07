import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAdminSecretPath } from "@/hooks/useAdminSecretPath";
import { TrialExpiredOverlay } from "@/components/TrialExpiredOverlay";
import { InternetConnectionBanner } from "@/components/InternetConnectionBanner";
import { PlanBadgeBanner } from "@/components/PlanBadgeBanner";
import { InstallPWAPrompt } from "@/components/InstallPWAPrompt";
import { GuidedTour, useTour } from "@/components/ui/GuidedTour";
import { ActivationChecklist, useActivationChecklist, ActivationState } from "@/components/ui/ActivationChecklist";
import {
  Home,
  Inbox,
  MessageSquare,
  Briefcase,
  Calendar,
  Plug,
  BarChart3,
  CreditCard,
  Settings,
  Shield,
  Menu,
  X,
  Search,
  Bell,
  User,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  LogOut,
  Video,
  Upload,
  Phone,
  Users,
  Zap,
  Wrench,
  LineChart,
  Receipt,
  Sparkles,
  Play,
  CheckCircle,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  adminOnly?: boolean;
  requiresStep?: keyof ActivationState;
}

interface NavGroup {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
  defaultOpen?: boolean;
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
  timestamp: string | Date;
  read: boolean;
  metadata?: {
    activityType?: string;
    oldStatus?: string;
    newStatus?: string;
    reason?: string;
  };
}

interface NotificationsData {
  notifications: Notification[];
  unreadCount: number;
}

const mobileNavItems: Array<{
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  requiresStep?: keyof ActivationState;
}> = [
  { label: "Home", icon: Home, path: "/dashboard" },
  { label: "Inbox", icon: Inbox, path: "/dashboard/inbox", requiresStep: "smtp" },
  { label: "Integrations", icon: Plug, path: "/dashboard/integrations" },
  { label: "Profile", icon: User, path: "/dashboard/settings" },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    "Leads": true,
    "Closer Engine Live": true,
    "Automation & Deals": false,
    "Insights": false,
    "Account & Billing": false,
  });
  const adminSecretPath = useAdminSecretPath();

  const { showChecklist, isComplete: activationComplete, closeChecklist, openChecklist, handleComplete, activationState } = useActivationChecklist();

  const navGroups: NavGroup[] = [
    {
      label: "Leads",
      icon: Users,
      defaultOpen: true,
      items: [
        { label: "Import Leads", icon: Upload, path: "/dashboard/lead-import" },
        { label: "Conversations", icon: MessageSquare, path: "/dashboard/conversations", requiresStep: "leads" },
      ],
    },
    {
      label: "Closer Engine Live",
      icon: Zap,
      defaultOpen: true,
      items: [
        { label: "Objection Handler", icon: Phone, path: "/dashboard/closer-engine" },
      ],
    },
    {
      label: "Automation & Deals",
      icon: Wrench,
      items: [
        { label: "Deals", icon: Briefcase, path: "/dashboard/deals", requiresStep: "leads" },
        { label: "Calendar", icon: Calendar, path: "/dashboard/calendar", requiresStep: "smtp" },
        { label: "Integrations", icon: Plug, path: "/dashboard/integrations" },
      ],
    },
    {
      label: "Insights",
      icon: LineChart,
      items: [
        { label: "Analytics", icon: BarChart3, path: "/dashboard/insights" },
        { label: "Reports", icon: LineChart, path: "/dashboard/insights" },
        { label: "Video Automation", icon: Video, path: "/dashboard/video-automation" },
      ],
    },
    {
      label: "Account & Billing",
      icon: Receipt,
      items: [
        { label: "Pricing & Plans", icon: CreditCard, path: "/dashboard/pricing" },
        { label: "Profile & Preferences", icon: Settings, path: "/dashboard/settings" },
      ],
    },
  ];

  const isFeatureUnlocked = useCallback((step?: keyof ActivationState): boolean => {
    if (!step) return true;
    return activationState[step] || false;
  }, [activationState]);

  const getTrialDaysLeft = (user: UserProfile | null | undefined): number => {
    if (!user?.plan || user.plan !== "trial" || !user?.trialExpiresAt) return 0;
    const now = new Date();
    const expiryDate = new Date(user.trialExpiresAt);
    const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysLeft);
  };

  const { data: user } = useQuery<UserProfile | null>({
    queryKey: ["/api/user/profile"],
    staleTime: Infinity,
  });

  const onboardingCompleted = user?.metadata?.onboardingCompleted || false;
  const { showTour, completeTour, skipTour, replayTour } = useTour(onboardingCompleted);

  const { data: notificationsData } = useQuery<NotificationsData | null>({
    queryKey: ["/api/user/notifications"],
    refetchInterval: 60000,
    refetchOnWindowFocus: false,
  });

  const notifications = notificationsData?.notifications || [];
  const unreadNotifications = notificationsData?.unreadCount || 0;

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return await apiRequest('POST', `/api/user/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/notifications"] });
    },
  });

  const handleNotificationClick = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const signOutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/auth/signout');
    },
    onSuccess: () => {
      queryClient.clear();
      window.location.href = '/';
    },
  });

  const handleSignOut = () => {
    signOutMutation.mutate();
  };

  const toggleGroup = useCallback((groupLabel: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupLabel]: !prev[groupLabel],
    }));
  }, []);

  const trialDaysLeft = user ? getTrialDaysLeft(user) : 0;

  const prefersReducedMotion = useState(() => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  })[0];

  const isPathActive = (path: string) => {
    if (path === "/dashboard") {
      return location === "/dashboard";
    }
    return location.startsWith(path);
  };

  const renderNavItem = (item: NavItem, isLocked: boolean = false) => {
    const Icon = item.icon;
    const isActive = isPathActive(item.path);

    if (isLocked) {
      return (
        <div
          key={item.path}
          className="mx-2 mb-1 rounded-md bg-white/5 cursor-not-allowed opacity-50"
          title="Complete activation to unlock"
        >
          <div className="flex items-center gap-3 px-3 py-2.5">
            <Lock className="h-4 w-4 flex-shrink-0 text-white/40" />
            {!sidebarCollapsed && (
              <span className="text-sm font-medium text-white/40">{item.label}</span>
            )}
          </div>
        </div>
      );
    }

    return (
      <Link key={item.path} href={item.path}>
        <motion.div
          className={`mx-2 mb-1 rounded-md transition-colors hover:bg-primary/10 ${
            isActive ? "bg-primary/10 text-primary" : "text-white/80 hover:text-white"
          }`}
          whileHover={prefersReducedMotion ? {} : { x: 4 }}
          transition={{ duration: 0.2 }}
          data-testid={`nav-item-${item.label.toLowerCase()}`}
        >
          <div className="flex items-center gap-3 px-3 py-2.5">
            <Icon className="h-4 w-4 flex-shrink-0" />
            {!sidebarCollapsed && (
              <span className="text-sm font-medium">{item.label}</span>
            )}
          </div>
        </motion.div>
      </Link>
    );
  };

  const renderNavGroup = (group: NavGroup) => {
    const isExpanded = expandedGroups[group.label];
    const GroupIcon = group.icon;
    const hasActiveItem = group.items.some(item => isPathActive(item.path));
    const isCloserEngine = group.label === "Closer Engine Live";

    if (sidebarCollapsed) {
      return (
        <DropdownMenu key={group.label}>
          <DropdownMenuTrigger asChild>
            <div
              className={`mx-2 mb-1 rounded-md transition-colors cursor-pointer hover:bg-primary/10 ${
                isCloserEngine ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 shadow-lg shadow-cyan-500/10" : ""
              } ${hasActiveItem ? "bg-primary/10 text-primary" : "text-white/80"}`}
            >
              <div className="flex items-center justify-center px-3 py-2.5">
                <GroupIcon className={`h-5 w-5 ${isCloserEngine ? "text-cyan-400" : ""}`} />
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="w-48 bg-[#1a2744] border-cyan-500/30">
            <DropdownMenuLabel className="text-white/70">{group.label}</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            {group.items.map(item => {
              const Icon = item.icon;
              const isLocked = item.requiresStep && !isFeatureUnlocked(item.requiresStep);
              return (
                <DropdownMenuItem
                  key={item.path}
                  className={`cursor-pointer ${isLocked ? "opacity-50" : ""}`}
                  disabled={isLocked}
                  onClick={() => !isLocked && setLocation(item.path)}
                >
                  {isLocked ? (
                    <Lock className="h-4 w-4 mr-2" />
                  ) : (
                    <Icon className="h-4 w-4 mr-2" />
                  )}
                  {item.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
      <Collapsible
        key={group.label}
        open={isExpanded}
        onOpenChange={() => toggleGroup(group.label)}
        className={`mb-1 ${isCloserEngine ? "relative" : ""}`}
      >
        {isCloserEngine && (
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 rounded-xl pointer-events-none" />
        )}
        <CollapsibleTrigger asChild>
          <div
            className={`mx-2 rounded-md transition-colors cursor-pointer hover:bg-white/5 ${
              isCloserEngine 
                ? "bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 hover:border-cyan-500/40 shadow-lg shadow-cyan-500/5" 
                : hasActiveItem && !isExpanded ? "bg-primary/10" : ""
            }`}
          >
            <div className="flex items-center justify-between px-3 py-2.5">
              <div className="flex items-center gap-3">
                <GroupIcon className={`h-4 w-4 flex-shrink-0 ${isCloserEngine ? "text-cyan-400" : hasActiveItem ? "text-primary" : "text-white/60"}`} />
                <span className={`text-sm font-semibold ${isCloserEngine ? "text-cyan-300" : hasActiveItem ? "text-primary" : "text-white/70"}`}>
                  {group.label}
                </span>
                {isCloserEngine && (
                  <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0 h-4">
                    PRO
                  </Badge>
                )}
              </div>
              <ChevronDown
                className={`h-4 w-4 text-white/40 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              />
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pl-4 mt-1"
          >
            {group.items.map(item => {
              const isLocked = item.requiresStep && !isFeatureUnlocked(item.requiresStep);
              return renderNavItem(item, isLocked);
            })}
          </motion.div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <InternetConnectionBanner />
      <InstallPWAPrompt />
      <TrialExpiredOverlay daysLeft={trialDaysLeft} plan={user?.plan || ""} />

      <GuidedTour isOpen={showTour} onComplete={completeTour} onSkip={skipTour} />
      <ActivationChecklist isOpen={showChecklist} onClose={closeChecklist} onComplete={handleComplete} />

      <motion.aside
        className="hidden md:flex flex-col border-r bg-gradient-to-b from-[#0d1428] via-[#0a0f1f] to-[#0d1428] border-cyan-500/20"
        initial={false}
        animate={{ width: sidebarCollapsed ? "4rem" : "16rem" }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: "easeInOut" }}
        data-testid="sidebar-desktop"
        style={{
          boxShadow: "0 0 40px rgba(0, 200, 255, 0.1)",
        }}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-cyan-500/20">
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
                className="flex items-center gap-2"
                data-testid="logo-text"
              >
                <div className="bg-gradient-to-b from-[#0d1428] via-[#0a0f1f] to-[#0d1428] p-1 rounded">
                  <img
                    src="/logo.png"
                    alt="Audnix AI"
                    className="h-8 w-auto object-contain"
                  />
                </div>
                <span className="font-bold text-xl text-primary">Audnix</span>
              </motion.div>
            )}
            {sidebarCollapsed && (
              <div className="bg-gradient-to-b from-[#0d1428] via-[#0a0f1f] to-[#0d1428] p-1 rounded">
                <motion.img
                  src="/logo.png"
                  alt="Audnix AI"
                  className="h-8 w-8 object-contain"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
                />
              </div>
            )}
          </AnimatePresence>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            data-testid="button-toggle-sidebar"
          >
            <ChevronLeft
              className={`h-4 w-4 transition-transform ${
                sidebarCollapsed ? "rotate-180" : ""
              }`}
            />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4" data-testid="nav-desktop">
          <Link href="/dashboard">
            <motion.div
              className={`mx-2 mb-3 rounded-md transition-colors hover:bg-primary/10 ${
                location === "/dashboard" ? "bg-primary/10 text-primary" : "text-white"
              }`}
              whileHover={prefersReducedMotion ? {} : { x: 4 }}
              transition={{ duration: 0.2 }}
              data-testid="nav-item-home"
            >
              <div className="flex items-center gap-3 px-3 py-2.5">
                <Home className="h-5 w-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <span className="text-sm font-semibold">Home</span>
                )}
              </div>
            </motion.div>
          </Link>

          <div className="px-3 mb-2">
            {!sidebarCollapsed && (
              <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
            )}
          </div>

          {navGroups.map(renderNavGroup)}

          {user?.role === "admin" && (
            <>
              <div className="px-3 my-2">
                {!sidebarCollapsed && (
                  <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
                )}
              </div>
              <Link href={adminSecretPath}>
                <motion.div
                  className={`mx-2 mb-1 rounded-md transition-colors hover:bg-primary/10 ${
                    location === adminSecretPath ? "bg-primary/10 text-primary" : "text-white/80"
                  }`}
                  whileHover={prefersReducedMotion ? {} : { x: 4 }}
                  transition={{ duration: 0.2 }}
                  data-testid="nav-item-admin"
                >
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <Shield className="h-4 w-4 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <span className="text-sm font-medium">Admin Panel</span>
                    )}
                  </div>
                </motion.div>
              </Link>
            </>
          )}
        </nav>

        {!sidebarCollapsed && (
          <div className="p-3 border-t border-cyan-500/20">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={replayTour}
                className="flex-1 text-xs text-white/60 hover:text-white hover:bg-white/5"
              >
                <Play className="h-3 w-3 mr-1" />
                Tour
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={openChecklist}
                className={`flex-1 text-xs hover:bg-white/5 ${
                  activationComplete ? "text-emerald-400" : "text-cyan-400"
                }`}
              >
                {activationComplete ? (
                  <CheckCircle className="h-3 w-3 mr-1" />
                ) : (
                  <Sparkles className="h-3 w-3 mr-1" />
                )}
                {activationComplete ? "Done" : "Activate"}
              </Button>
            </div>
          </div>
        )}
      </motion.aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-cyan-500/20 bg-gradient-to-r from-[#0d1428] via-[#0a0f1f] to-[#0d1428] flex items-center justify-between px-4 md:px-6" data-testid="navbar-top">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-foreground hover:text-foreground"
                data-testid="button-mobile-menu"
              >
                <Menu className="h-5 w-5 text-foreground" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-gradient-to-b from-[#0d1428] to-[#0a0f1f] border-cyan-500/20">
              <div className="p-4 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-6">
                  <div className="bg-gradient-to-b from-[#0d1428] via-[#0a0f1f] to-[#0d1428] p-1 rounded">
                    <img src="/logo.png" alt="Audnix AI" className="h-8 w-auto object-contain" />
                  </div>
                  <span className="font-bold text-xl text-primary">Audnix</span>
                </div>

                <nav className="flex-1 overflow-y-auto -mx-2">
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <div className={`mx-2 mb-3 rounded-md transition-colors ${
                      location === "/dashboard" ? "bg-primary/10 text-primary" : "text-white"
                    }`}>
                      <div className="flex items-center gap-3 px-3 py-2.5">
                        <Home className="h-5 w-5 flex-shrink-0" />
                        <span className="text-sm font-semibold">Home</span>
                      </div>
                    </div>
                  </Link>

                  <div className="px-3 mb-2">
                    <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
                  </div>

                  {navGroups.map(group => {
                    const GroupIcon = group.icon;
                    const isExpanded = expandedGroups[group.label];
                    const hasActiveItem = group.items.some(item => isPathActive(item.path));

                    return (
                      <div key={group.label} className="mb-1">
                        <div
                          className={`mx-2 rounded-md transition-colors cursor-pointer hover:bg-white/5 ${
                            hasActiveItem && !isExpanded ? "bg-primary/10" : ""
                          }`}
                          onClick={() => toggleGroup(group.label)}
                        >
                          <div className="flex items-center justify-between px-3 py-2.5">
                            <div className="flex items-center gap-3">
                              <GroupIcon className={`h-4 w-4 flex-shrink-0 ${hasActiveItem ? "text-primary" : "text-white/60"}`} />
                              <span className={`text-sm font-semibold ${hasActiveItem ? "text-primary" : "text-white/70"}`}>
                                {group.label}
                              </span>
                            </div>
                            <ChevronDown
                              className={`h-4 w-4 text-white/40 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                            />
                          </div>
                        </div>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="pl-4 mt-1 overflow-hidden"
                            >
                              {group.items.map(item => {
                                const Icon = item.icon;
                                const isActive = isPathActive(item.path);
                                const isLocked = item.requiresStep && !isFeatureUnlocked(item.requiresStep);

                                if (isLocked) {
                                  return (
                                    <div
                                      key={item.path}
                                      className="mx-2 mb-1 rounded-md bg-white/5 cursor-not-allowed opacity-50"
                                    >
                                      <div className="flex items-center gap-3 px-3 py-2.5">
                                        <Lock className="h-4 w-4 flex-shrink-0 text-white/40" />
                                        <span className="text-sm font-medium text-white/40">{item.label}</span>
                                      </div>
                                    </div>
                                  );
                                }

                                return (
                                  <Link key={item.path} href={item.path} onClick={() => setMobileMenuOpen(false)}>
                                    <div
                                      className={`mx-2 mb-1 rounded-md transition-colors ${
                                        isActive ? "bg-primary/10 text-primary" : "text-white/80"
                                      }`}
                                    >
                                      <div className="flex items-center gap-3 px-3 py-2.5">
                                        <Icon className="h-4 w-4 flex-shrink-0" />
                                        <span className="text-sm font-medium">{item.label}</span>
                                      </div>
                                    </div>
                                  </Link>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </nav>

                <div className="pt-4 border-t border-cyan-500/20">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        replayTour();
                      }}
                      className="flex-1 text-xs text-white/60 hover:text-white hover:bg-white/5"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Tour
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        openChecklist();
                      }}
                      className={`flex-1 text-xs hover:bg-white/5 ${
                        activationComplete ? "text-emerald-400" : "text-cyan-400"
                      }`}
                    >
                      {activationComplete ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <Sparkles className="h-3 w-3 mr-1" />
                      )}
                      {activationComplete ? "Done" : "Activate"}
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads, messages, settings..."
                className="pl-10 bg-muted/50 border-border"
                data-testid="input-search"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <PlanBadgeBanner plan={user?.plan || ""} />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
                  <Bell className="h-5 w-5" />
                  {unreadNotifications > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs" data-testid="badge-notifications">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length > 0 ? (
                  notifications.slice(0, 5).map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className="flex flex-col items-start gap-1 cursor-pointer"
                      onClick={() => handleNotificationClick(notification.id)}
                      data-testid={`notification-item-${notification.id}`}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <span className={`font-medium ${notification.read ? 'text-muted-foreground' : ''}`}>
                          {notification.title}
                        </span>
                        {!notification.read && (
                          <Badge variant="secondary" className="ml-auto">New</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    No notifications
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full" data-testid="button-user-menu">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.avatar} alt={user?.name || user?.username || "User"} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {(user?.name || user?.username || user?.email || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.name || user?.username || "User"}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation("/dashboard/settings")} data-testid="menu-item-settings">
                  <User className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive" data-testid="menu-item-signout">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#0d1428] to-[#080c18]" data-testid="main-content">
          {children}
        </main>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0d1428] to-[#0a0f1f] border-t border-cyan-500/20 flex items-center justify-around px-2" data-testid="nav-mobile-bottom">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            const isLocked = item.requiresStep && !isFeatureUnlocked(item.requiresStep);

            if (isLocked) {
              return (
                <div
                  key={item.path}
                  className="flex flex-col items-center justify-center p-2 rounded-lg cursor-not-allowed opacity-50"
                  title="Complete activation to unlock"
                  data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                >
                  <Lock className="h-5 w-5 mb-1 text-muted-foreground" />
                  <span className="text-[10px] font-medium text-muted-foreground">{item.label}</span>
                </div>
              );
            }

            return (
              <Link key={item.path} href={item.path}>
                <motion.div
                  className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                  whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
                  data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                >
                  <Icon className="h-5 w-5 mb-1" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
