import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TrialExpiredOverlay } from "@/components/TrialExpiredOverlay";
import { InternetConnectionBanner } from "@/components/InternetConnectionBanner";
import { PlanBadgeBanner } from "@/components/PlanBadgeBanner";
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
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface NavItem {
  label: string;
  icon: any;
  path: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: "Dashboard", icon: Home, path: "/dashboard" },
  { label: "Inbox", icon: Inbox, path: "/dashboard/inbox" },
  { label: "Conversations", icon: MessageSquare, path: "/dashboard/conversations" },
  { label: "Deals", icon: Briefcase, path: "/dashboard/deals" },
  { label: "Calendar", icon: Calendar, path: "/dashboard/calendar" },
  { label: "Integrations", icon: Plug, path: "/dashboard/integrations" },
  { label: "Insights", icon: BarChart3, path: "/dashboard/insights" },
  { label: "Pricing", icon: CreditCard, path: "/dashboard/pricing" },
  { label: "Settings", icon: Settings, path: "/dashboard/settings" },
  { label: "Admin", icon: Shield, path: "/dashboard/admin", adminOnly: true },
];

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
                <img
                  src="/logo.jpg"
                  alt="Audnix AI"
                  className="h-8 w-auto object-contain"
                />
                <span className="font-bold text-xl text-primary">Audnix</span>
              </motion.div>
            )}
            {sidebarCollapsed && (
              <motion.img
                src="/logo.jpg"
                alt="Audnix AI"
                className="h-8 w-8 object-contain"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
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
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-foreground hover:text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5 text-foreground" /> : <Menu className="h-5 w-5 text-foreground" />}
          </Button>

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
            {/* Theme Toggle */}
            <ThemeToggle />
            
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
                    notifications.map((notification: any, index: number) => (
                      <DropdownMenuItem 
                        key={notification.id} 
                        data-testid={`notification-item-${index}`}
                        onClick={() => handleNotificationClick(notification.id)}
                      >
                        <div className="flex flex-col gap-1 w-full">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{notification.title}</p>
                            {!notification.read && (
                              <div className="w-2 h-2 rounded-full bg-cyan-400" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground/70">
                            {new Date(notification.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </DropdownMenuItem>
                    ))
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
                  <Button variant="ghost" className="gap-2 text-foreground hover:text-foreground" data-testid="button-profile">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">{user.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline text-sm text-foreground">Hey 👋 {user.name}</span>
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

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#0d1428] via-[#0a0f1f] to-[#0d1428] border-t border-cyan-500/20 flex items-center justify-around h-16 z-50" data-testid="nav-mobile" style={{ boxShadow: "0 -4px 20px rgba(0, 200, 255, 0.1)" }}>
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;

          return (
            <Link key={item.path} href={item.path}>
              <Button
                variant="ghost"
                size="icon"
                className={`flex flex-col h-auto py-2 gap-1 ${
                  isActive ? "text-primary" : "text-white"
                }`}
                data-testid={`mobile-nav-${item.label.toLowerCase()}`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs">{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Mobile Slide-out Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              data-testid="mobile-menu-overlay"
            />
            <motion.div
              className="md:hidden fixed left-0 top-0 bottom-0 w-64 bg-gradient-to-b from-[#0d1428] via-[#0a0f1f] to-[#0d1428] border-r border-cyan-500/20 z-50 overflow-y-auto"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 20 }}
              data-testid="mobile-menu-drawer"
              style={{
                boxShadow: "0 0 40px rgba(0, 200, 255, 0.2)",
              }}
            >
              <div className="p-4">
                <div className="flex items-center gap-2 mb-6">
                  <img
                    src="/logo.jpg"
                    alt="Audnix AI"
                    className="h-8 w-auto object-contain"
                  />
                  <span className="font-bold text-xl bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Audnix</span>
                </div>
                <nav className="flex flex-col gap-1">
                  {filteredNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location === item.path;

                    return (
                      <Link key={item.path} href={item.path}>
                        <div
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors hover-elevate ${
                            isActive ? "bg-primary/10 text-primary" : "text-white"
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
                          data-testid={`mobile-menu-item-${item.label.toLowerCase()}`}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-sm font-medium">{item.label}</span>
                        </div>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
