import { useState, useCallback, KeyboardEvent } from "react";
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
  Settings,
  Shield,
  Menu,
  X,
  Search,
  Bell,
  User,
  ChevronLeft,
  ChevronDown,
  LogOut,
  Video,
  Upload,
  Zap,
  Brain,
  FileText,
  HelpCircle,
  Layers,
  PieChart,
  Activity,
  Sun,
  Moon,
  BookMarked,
  Lock,
  Globe,
  Database
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
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

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

const BadgeWithDot = ({ color, children }: { color: 'success' | 'warning' | 'primary', children: React.ReactNode }) => {
  const colors = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    primary: 'bg-primary'
  };
  const borderColors = {
    success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500',
    warning: 'border-amber-500/20 bg-amber-500/10 text-amber-500',
    primary: 'border-primary/20 bg-primary/10 text-primary'
  };

  return (
    <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${borderColors[color]}`}>
      <span className={`w-1 h-1 rounded-full ${colors[color]} animate-pulse`} />
      {children}
    </span>
  );
};

const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-10 w-10 border border-white/10 rounded-xl hover:bg-white/5 transition-all duration-300"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-white/40" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-white/40" />
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
  });

  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      setLocation(`/dashboard/inbox?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const { showChecklist, isComplete: activationComplete, closeChecklist, openChecklist, handleComplete, activationState } = useActivationChecklist();

  const navGroups: NavGroup[] = [
    {
      label: "Neural Engine",
      icon: Database,
      items: [
        { label: "Neural Flows", icon: Brain, path: "/dashboard/automation" },
        { label: "Deal Pipeline", icon: Briefcase, path: "/dashboard/deals" },
        { label: "Ecosystem Sync", icon: Plug, path: "/dashboard/integrations" },
      ],
    },
    {
      label: "Operations",
      icon: Layers,
      items: [
        { label: "Lead Ingestion", icon: Upload, path: "/dashboard/lead-import" },
        { label: "Brand Memory", icon: BookMarked, path: "/dashboard/content-library" },
        { label: "Objection Training", icon: Shield, path: "/dashboard/objections" },
        { label: "Neural Logs", icon: MessageSquare, path: "/dashboard/conversations" },
      ],
    },
    {
      label: "Analytics Hub",
      icon: PieChart,
      items: [
        { label: "AI Decision Audit", icon: Activity, path: "/dashboard/ai-decisions" },
        { label: "Revenue Insights", icon: BarChart3, path: "/dashboard/insights" },
        { label: "Execution Map", icon: Globe, path: "/dashboard/video-automation" },
      ],
    },
  ];

  const isFeatureUnlocked = useCallback((step?: keyof ActivationState): boolean => {
    if (!step) return true;
    return activationState[step] || false;
  }, [activationState]);

  const { data: user } = useQuery<UserProfile | null>({
    queryKey: ["/api/user/profile"],
    staleTime: Infinity,
  });

  const onboardingCompleted = user?.metadata?.onboardingCompleted || false;
  const { showTour, completeTour, skipTour, replayTour } = useTour(onboardingCompleted);

  const { data: notificationsData } = useQuery<NotificationsData | null>({
    queryKey: ["/api/user/notifications"],
    refetchInterval: 60000,
  });

  const unreadNotifications = notificationsData?.unreadCount || 0;

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
        <div key={item.path} className="px-3 mb-1 opactiy-20">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.02] cursor-not-allowed border border-transparent">
            <Lock className="h-4 w-4 opacity-30" />
            {!sidebarCollapsed && <span className="text-xs font-black uppercase tracking-widest text-white/20">{item.label}</span>}
          </div>
        </div>
      );
    }

    return (
      <Link key={item.path} href={item.path}>
        <div className="relative group px-3 mb-1">
          {isActive && (
            <motion.div layoutId="nav-pill" className="absolute inset-x-3 inset-y-0 bg-primary/10 border border-primary/20 rounded-2xl" />
          )}
          <div className={`relative flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-500 ${isActive ? "text-primary italic" : "text-white/30 hover:text-white"}`}>
            <div className="flex items-center gap-4">
              <Icon className={`h-5 w-5 transition-all ${isActive ? "text-primary scale-110" : "opacity-40"}`} />
              {!sidebarCollapsed && (
                <span className="text-xs font-black uppercase tracking-[0.15em] whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </div>
            {!sidebarCollapsed && item.badge && <div>{item.badge}</div>}
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-black overflow-hidden selection:bg-primary/30 font-sans">
      <InternetConnectionBanner />
      <InstallPWAPrompt />
      <GuidedTour isOpen={showTour} onComplete={completeTour} onSkip={skipTour} />
      <ActivationChecklist isOpen={showChecklist} onClose={closeChecklist} onComplete={handleComplete} />

      <motion.aside
        className="hidden md:flex flex-col border-r bg-black/40 backdrop-blur-3xl border-white/5 relative z-50"
        animate={{ width: sidebarCollapsed ? "6rem" : "20rem" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="h-24 flex items-center justify-between px-8 border-b border-white/5">
          <AnimatePresence mode="wait">
            {!sidebarCollapsed && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-xl border border-primary/20 shadow-2xl">
                  <img src="/logo.png" alt="Audnix" className="h-6 w-6 object-contain grayscale brightness-200" />
                </div>
                <span className="font-black text-xl tracking-tighter text-white uppercase italic">Audnix<span className="text-primary not-italic">.AI</span></span>
              </motion.div>
            )}
            {sidebarCollapsed && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto">
                <img src="/logo.png" alt="Audnix" className="h-6 w-6 grayscale brightness-200" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 overflow-y-auto py-8 custom-scrollbar px-3">
          {renderNavItem({ label: "Command Center", icon: Home, path: "/dashboard" })}
          {renderNavItem({ label: "Neural Nodes", icon: Inbox, path: "/dashboard/inbox" })}

          <div className="px-6 my-8 border-t border-white/5" />

          {navGroups.map(group => (
            <div key={group.label} className="mb-6">
              {!sidebarCollapsed && (
                <div className="px-6 py-2 mb-2 flex items-center justify-between cursor-pointer group" onClick={() => toggleGroup(group.label)}>
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] group-hover:text-white/50 transition-colors uppercase italic">{group.label}</span>
                  <ChevronDown className={`h-3 w-3 text-white/10 transition-transform ${expandedGroups[group.label] ? "rotate-180" : ""}`} />
                </div>
              )}
              <AnimatePresence initial={false}>
                {(expandedGroups[group.label] || sidebarCollapsed) && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    {group.items.map(item => renderNavItem(item, item.requiresStep && !isFeatureUnlocked(item.requiresStep)))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          <div className="px-6 my-8 border-t border-white/5" />
          {renderNavItem({ label: "Operator Settings", icon: Settings, path: "/dashboard/settings" })}
        </nav>

        <div className="p-6 mt-auto border-t border-white/5">
          <div className={`p-4 rounded-3xl bg-white/[0.03] border border-white/5 flex items-center gap-4 ${sidebarCollapsed ? "justify-center" : "justify-between"}`}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-4 cursor-pointer">
                  <Avatar className="h-10 w-10 rounded-2xl border border-primary/20 shadow-2xl">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-black rounded-2xl uppercase">{(user?.name || "U").charAt(0)}</AvatarFallback>
                  </Avatar>
                  {!sidebarCollapsed && (
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-black text-white italic truncate uppercase">{user?.name || "Neural Operator"}</span>
                      <span className="text-[9px] text-white/30 font-bold uppercase tracking-widest mt-0.5">Systems Active</span>
                    </div>
                  )}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="w-64 bg-black/90 backdrop-blur-3xl border-white/10 rounded-[2rem] p-3 shadow-2xl">
                <DropdownMenuItem onClick={handleSignOut} className="text-red-400 font-black uppercase text-[10px] tracking-widest rounded-2xl p-4 cursor-pointer focus:bg-red-400/10">
                  <LogOut className="w-4 h-4 mr-3" />
                  Terminate Session
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.aside>

      <div className="flex-1 flex flex-col overflow-hidden bg-black">
        <header className="h-24 border-b border-white/5 bg-black/40 backdrop-blur-3xl flex items-center justify-between px-8 z-40">
          <div className="flex items-center gap-8 flex-1">
            <Button variant="ghost" size="icon" className="md:hidden text-white/40" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="w-6 h-6" />
            </Button>
            <div className="hidden md:flex max-w-md w-full relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary" />
              <Input className="h-12 pl-12 bg-white/[0.03] border-white/5 rounded-2xl text-sm font-bold placeholder:text-white/10 focus:ring-1 focus:ring-primary/20" placeholder="Neural Query Engine..." />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <ThemeSwitcher />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl border border-white/10 bg-white/[0.03] relative group">
                  <Bell className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
                  {unreadNotifications > 0 && <span className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full animate-pulse" />}
                </Button>
              </DropdownMenuTrigger>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-12 custom-scrollbar scroll-smooth">
          <div className="max-w-7xl mx-auto min-h-full">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              {children}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
