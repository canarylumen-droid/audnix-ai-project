import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAdminSecretPath } from "@/hooks/useAdminSecretPath";
import { TrialExpiredOverlay } from "@/components/TrialExpiredOverlay";
import { InternetConnectionBanner } from "@/components/InternetConnectionBanner";
import { PlanBadgeBanner } from "@/components/PlanBadgeBanner";
import { InstallPWAPrompt } from "@/components/InstallPWAPrompt";
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
  LogOut,
  Video,
  Upload, // Import Upload icon
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface NavItem {
  label: string;
  icon: any;
  path: string;
  adminOnly?: boolean;
}

// NOTE: navItems moved inside component so we can use adminSecretPath
// See DashboardLayout component below

const mobileNavItems = [
  { label: "Home", icon: Home, path: "/dashboard" },
  { label: "Inbox", icon: Inbox, path: "/dashboard/inbox" },
  { label: "Integrations", icon: Plug, path: "/dashboard/integrations" },
  { label: "Profile", icon: User, path: "/dashboard/settings" },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const adminSecretPath = useAdminSecretPath();

  // Define nav items (with admin secret path)
  const navItems: NavItem[] = [
    { label: "Dashboard", icon: Home, path: "/dashboard" },
    { label: "Inbox", icon: Inbox, path: "/dashboard/inbox" },
    { label: "Conversations", icon: MessageSquare, path: "/dashboard/conversations" },
    { label: "Deals", icon: Briefcase, path: "/dashboard/deals" },
    { label: "Calendar", icon: Calendar, path: "/dashboard/calendar" },
    { label: "Sales Assistant", icon: Phone, path: "/dashboard/sales-assistant" },
    { label: "Integrations", icon: Plug, path: "/dashboard/integrations" },
    { label: "Insights", icon: BarChart3, path: "/dashboard/insights" },
    { label: "Pricing", icon: CreditCard, path: "/dashboard/pricing" },
    { label: "Settings", icon: Settings, path: "/dashboard/settings" },
    { label: "Video Automation", icon: Video, path: "/dashboard/video-automation" },
    { label: "Import Leads", icon: Upload, path: "/dashboard/lead-import" },
    { label: "Admin Panel", icon: Shield, path: adminSecretPath, adminOnly: true },
  ];

  // Calculate trial days left
  const getTrialDaysLeft = (user: any) => {
    if (!user?.plan || user.plan !== "trial" || !user?.trialExpiresAt) return 0;
    const now = new Date();
    const expiryDate = new Date(user.trialExpiresAt);
    const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysLeft);
  };

  // Fetch real user profile
  const { data: user } = useQuery({
    queryKey: ["/api/user/profile"],
    refetchInterval: 60000, // Refetch every minute to keep data fresh
  });

  // Fetch real-time notifications
  const { data: notificationsData } = useQuery({
    queryKey: ["/api/user/notifications"],
    refetchInterval: 30000, // Poll every 30 seconds for real-time updates
  });

  const notifications = notificationsData?.notifications || [];
  const unreadNotifications = notificationsData?.unreadCount || 0;

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return await apiRequest(`/api/user/notifications/${notificationId}/read`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/notifications"] });
    },
  });

  const handleNotificationClick = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  // Sign out mutation
  const signOutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/auth/signout', {
        method: 'POST',
      });
    },
    onSuccess: () => {
      // Clear all react-query caches to remove stale user data
      queryClient.clear();
      // Redirect to landing page after successful sign out
      window.location.href = '/';
    },
  });

  const handleSignOut = () => {
    signOutMutation.mutate();
  };

  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || user?.role === "admin"
  );

  const trialDaysLeft = user ? getTrialDaysLeft(user) : 0;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Internet Connection Banner */}
      <InternetConnectionBanner />

      {/* PWA Install Prompt */}
      <InstallPWAPrompt />

      {/* Trial Expired Overlay */}
      <TrialExpiredOverlay daysLeft={trialDaysLeft} plan={user?.plan || ""} />

      {/* Desktop Sidebar */}
      <motion.aside
        className="hidden md:flex flex-col border-r bg-gradient-to-b from-[#0d1428] via-[#0a0f1f] to-[#0d1428] border-cyan-500/20"
        initial={false}
        animate={{ width: sidebarCollapsed ? "4rem" : "16rem" }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        data-testid="sidebar-desktop"
        style={{
          boxShadow: "0 0 40px rgba(0, 200, 255, 0.1)",
        }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-cyan-500/20">
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
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

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4" data-testid="nav-desktop">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;

            return (
              <Link key={item.path} href={item.path}>
                <motion.div
                  className={`mx-2 mb-1 rounded-md transition-colors hover-elevate ${
                    isActive ? "bg-primary/10 text-primary" : "text-white"
                  }`}
                  whileHover={{ x: 4 }}
                  data-testid={`nav-item-${item.label.toLowerCase()}`}
                >
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <span className="text-sm font-medium">{item.label}</span>
                    )}
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </nav>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 border-b border-cyan-500/20 bg-gradient-to-r from-[#0d1428] via-[#0a0f1f] to-[#0d1428] flex items-center justify-between px-4 md:px-6" data-testid="navbar-top">
          {/* Mobile Menu Toggle */}
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
            <SheetContent side="left" className="w-64 p-0">
              <div className="p-4 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-6">
                  <div className="bg-gradient-to-b from-[#0d1428] via-[#0a0f1f] to-[#0d1428] p-1 rounded">
                    <img
                      src="/logo.png"
                      alt="Audnix AI"
                      className="h-8 w-auto object-contain"
                    />
                  </div>
                  <span className="font-bold text-xl bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Audnix</span>
                </div>
                <nav className="flex flex-col gap-1 flex-1">
                  {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              className="fixed top-0 left-0 bottom-0 w-80 bg-card/95 backdrop-blur-lg z-50 md:hidden overflow-y-auto shadow-2xl border-r border-border/50"
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              <div className="p-4 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-6">
                  <div className="bg-gradient-to-b from-[#0d1428] via-[#0a0f1f] to-[#0d1428] p-1 rounded">
                    <img
                      src="/logo.png"
                      alt="Audnix AI"
                      className="h-8 w-auto object-contain"
                    />
                  </div>
                  <span className="font-bold text-xl bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Audnix</span>
                </div>
                <nav className="flex flex-col gap-1 flex-1">
                  {filteredNavItems.map((item, index) => {
                    const isActive = location === item.path;
                    return (
                      <motion.div
                        key={item.path}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.05, duration: 0.2 }}
                      >
                        <Link href={item.path}>
                          <motion.div whileTap={{ scale: 0.98 }}>
                            <Button
                              variant="ghost"
                              className={`w-full justify-start gap-3 transition-all duration-200 ${
                                isActive
                                  ? "bg-primary/10 text-primary shadow-sm"
                                  : "text-foreground/80 hover:text-foreground hover:bg-accent/50"
                              }`}
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <item.icon className={`h-5 w-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                              <span className="font-medium">{item.label}</span>
                            </Button>
                          </motion.div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>
                <div className="mt-auto pt-4">
                  {user && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="gap-2 p-0 h-auto w-full justify-start text-foreground hover:text-foreground" data-testid="button-profile-mobile">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary">{user.name?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col items-start">
                            <span className="text-sm font-medium text-foreground">{user.name}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                          </div>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuLabel>
                          <div className="flex flex-col">
                            <p className="text-sm font-medium text-foreground">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <Link href="/dashboard/settings">
                          <DropdownMenuItem data-testid="menu-item-settings-mobile">
                            <Settings className="h-4 w-4 mr-2" />
                            Settings
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem 
                          onClick={handleSignOut}
                          disabled={signOutMutation.isPending}
                          data-testid="menu-item-logout-mobile"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          {signOutMutation.isPending ? 'Signing out...' : 'Sign out'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
                </nav>
              </div>
            </SheetContent>
          </Sheet>

          {/* Search */}
          <div className="flex-1 max-w-md mx-4 hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
              <Input
                placeholder="Search leads, conversations..."
                className="pl-9 bg-background/50 text-foreground placeholder:text-foreground/50 border-border/50"
                data-testid="input-global-search"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-foreground hover:text-foreground" data-testid="button-notifications">
                  <Bell className="h-5 w-5 text-foreground" />
                  {unreadNotifications > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                      data-testid="badge-notification-count"
                    >
                      {unreadNotifications}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80" data-testid="dropdown-notifications">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notification: any, index: number) => {
                      const getRelativeTime = (timestamp: string | Date): string => {
                        const now = Date.now();
                        const then = new Date(timestamp).getTime();
                        const diffSeconds = Math.floor((now - then) / 1000);
                        
                        if (diffSeconds < 60) return 'Just now';
                        if (diffSeconds < 120) return '1 min ago';
                        if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} mins ago`;
                        if (diffSeconds < 7200) return '1 hour ago';
                        if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} hours ago`;
                        return new Date(timestamp).toLocaleString();
                      };

                      const getExactTime = (timestamp: string | Date): string => {
                        const date = new Date(timestamp);
                        return date.toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true
                        });
                      };

                      return (
                        <DropdownMenuItem 
                          key={notification.id} 
                          data-testid={`notification-item-${index}`}
                          onClick={() => handleNotificationClick(notification.id)}
                          className="cursor-pointer hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex flex-col gap-1 w-full py-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium flex-1">{notification.title}</p>
                              {!notification.read && (
                                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between gap-2 mt-1">
                              <p className="text-xs text-muted-foreground/70 font-medium">
                                {getRelativeTime(notification.timestamp)}
                              </p>
                              <p className="text-xs text-muted-foreground/50">
                                {getExactTime(notification.timestamp)}
                              </p>
                            </div>
                            {notification.metadata?.activityType && (
                              <div className="mt-1 pt-1 border-t border-border/30">
                                <p className="text-xs text-primary/70">
                                  {notification.metadata.activityType === 'conversion' && '💰 Conversion'}
                                  {notification.metadata.activityType === 'meeting_booked' && '📅 Meeting Scheduled'}
                                  {notification.metadata.activityType === 'status_change' && `📊 ${notification.metadata.oldStatus} → ${notification.metadata.newStatus}`}
                                </p>
                                {notification.metadata.reason && (
                                  <p className="text-xs text-muted-foreground/60 mt-0.5">
                                    {notification.metadata.reason}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </DropdownMenuItem>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No notifications yet
                    </div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 text-foreground hover:text-foreground hidden md:flex" data-testid="button-profile">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">{user.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline text-sm text-foreground">{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" data-testid="dropdown-profile">
                  <DropdownMenuLabel>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <Badge variant="secondary" className="w-fit mt-1">
                        {user.plan}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link href="/dashboard/settings">
                    <DropdownMenuItem data-testid="menu-item-settings">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    disabled={signOutMutation.isPending}
                    data-testid="menu-item-logout"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {signOutMutation.isPending ? 'Signing out...' : 'Sign out'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        {/* Plan Badge Banner */}
        <PlanBadgeBanner plan={user?.plan || ""} />

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border/50 md:hidden z-50 shadow-lg"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="flex items-center justify-around p-2 safe-bottom">
          {mobileNavItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`flex flex-col items-center gap-1 h-auto py-2 px-3 transition-all duration-200 ${
                      isActive 
                        ? "text-primary bg-primary/10" 
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`}
                  >
                    <item.icon className={`h-5 w-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                    <span className="text-xs font-medium">{item.label}</span>
                  </Button>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}