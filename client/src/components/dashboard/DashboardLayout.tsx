import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, Link } from "wouter";
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
  const [location] = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadNotifications] = useState(3);

  // Mock user - replace with real auth context
  const user = {
    name: "Alex Johnson",
    email: "alex@example.com",
    avatar: null,
    role: "admin" as const,
    plan: "pro" as const,
  };

  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || user.role === "admin"
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <motion.aside
        className="hidden md:flex flex-col border-r bg-card"
        initial={false}
        animate={{ width: sidebarCollapsed ? "4rem" : "16rem" }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        data-testid="sidebar-desktop"
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b">
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-bold text-xl text-primary"
              data-testid="logo-text"
            >
              Audnix
            </motion.div>
          )}
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
                    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground"
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
        <header className="h-16 border-b bg-card flex items-center justify-between px-4 md:px-6" data-testid="navbar-top">
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Search */}
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads, conversations..."
                className="pl-9"
                data-testid="input-global-search"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
                  <Bell className="h-5 w-5" />
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
                  <DropdownMenuItem data-testid="notification-item-0">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium">New conversion!</p>
                      <p className="text-xs text-muted-foreground">
                        Sarah from Instagram just booked a call
                      </p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem data-testid="notification-item-1">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium">Webhook error</p>
                      <p className="text-xs text-muted-foreground">
                        Failed to sync Instagram messages
                      </p>
                    </div>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2" data-testid="button-profile">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar || undefined} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline text-sm">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" data-testid="dropdown-profile">
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">{user.name}</p>
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
                <DropdownMenuItem data-testid="menu-item-logout">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t flex items-center justify-around h-16 z-50" data-testid="nav-mobile">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;

          return (
            <Link key={item.path} href={item.path}>
              <Button
                variant="ghost"
                size="icon"
                className={`flex flex-col h-auto py-2 gap-1 ${
                  isActive ? "text-primary" : "text-muted-foreground"
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
              className="md:hidden fixed left-0 top-0 bottom-0 w-64 bg-card border-r z-50 overflow-y-auto"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 20 }}
              data-testid="mobile-menu-drawer"
            >
              <div className="p-4">
                <div className="font-bold text-xl text-primary mb-6">Audnix</div>
                <nav className="flex flex-col gap-1">
                  {filteredNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location === item.path;

                    return (
                      <Link key={item.path} href={item.path}>
                        <div
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors hover-elevate ${
                            isActive ? "bg-primary/10 text-primary" : "text-muted-foreground"
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
