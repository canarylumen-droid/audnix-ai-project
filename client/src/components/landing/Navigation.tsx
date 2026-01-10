import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { Sparkles, ChevronDown, Shield, FileText, LayoutGrid, Zap, Brain } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const SOLUTIONS = [
  {
    name: "For Agencies",
    desc: "Scale your client outreach without increasing headcount.",
    icon: LayoutGrid,
    badge: "Scale",
    href: "/solutions/agencies"
  },
  {
    name: "For Sales Teams",
    desc: "Close more deals with autonomous objection handling.",
    icon: Zap,
    badge: "Velocity",
    href: "/solutions/sales-teams"
  },
  {
    name: "For Creators",
    desc: "Monetize your audience with 24/7 AI engagement.",
    icon: Brain,
    badge: "New",
    href: "/solutions/creators"
  }
];

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "How it works", href: "#how-it-works" },
    { name: "ROI Calculator", href: "#calc" },
    { name: "Pricing", href: "#pricing" },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex justify-center p-4 pointer-events-none">
      <motion.nav
        className={`pointer-events-auto flex items-center justify-between px-8 py-3 transition-all duration-500 rounded-2xl border border-white/5 shadow-2xl ${scrolled
          ? "bg-background/30 backdrop-blur-md w-full max-w-7xl border-white/5 shadow-premium"
          : "bg-transparent backdrop-blur-none w-full md:w-[95%] lg:w-[85%] border-transparent"
          }`}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center gap-12">
          <Link href="/">
            <Logo />
          </Link>

          <div className="hidden lg:flex items-center gap-10">
            {/* Solutions Dropdown */}
            <div
              className="relative py-2 group"
              onMouseEnter={() => setHoveredMenu('solutions')}
              onMouseLeave={() => setHoveredMenu(null)}
            >
              <button className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-all outline-none">
                Solutions
                <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${hoveredMenu === 'solutions' ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {hoveredMenu === 'solutions' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-2 bg-card/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 min-w-[340px] shadow-2xl"
                  >
                    <div className="grid gap-1">
                      {SOLUTIONS.map((sol) => (
                        <Link key={sol.name} href={sol.href}>
                          <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors group/item">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary transition-colors">
                              <sol.icon className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-foreground">{sol.name}</span>
                                <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[8px] font-bold uppercase tracking-wider">
                                  {sol.badge}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground font-medium mt-0.5">{sol.desc}</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => {
                  if (link.href?.startsWith("#")) {
                    e.preventDefault();
                    document.getElementById(link.href.slice(1))?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-all relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all group-hover:w-full" />
              </a>
            ))}

            {/* Resources Dropdown */}
            <div
              className="relative py-2 group"
              onMouseEnter={() => setHoveredMenu('resources')}
              onMouseLeave={() => setHoveredMenu(null)}
            >
              <button className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-all outline-none">
                Resources
                <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${hoveredMenu === 'resources' ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {hoveredMenu === 'resources' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-2 bg-card/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 min-w-[220px] shadow-2xl"
                  >
                    <div className="grid gap-1">
                      <div
                        className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-white/5 transition-colors"
                        onClick={() => document.getElementById('privacy-modal')?.classList.remove('hidden')}
                      >
                        <Shield className="w-4 h-4 text-primary" />
                        <span className="text-xs font-bold uppercase tracking-wider">Privacy Policy</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="text-xs font-bold uppercase tracking-wider">Terms of Service</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/auth">
            <Button
              variant="ghost"
              className="hidden sm:flex text-[11px] font-bold uppercase tracking-widest px-6 h-10 rounded-full hover:bg-muted"
            >
              Log in
            </Button>
          </Link>
          <Link href="/auth">
            <Button
              className="h-10 px-6 rounded-full text-[11px] font-semibold uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow"
            >
              Get Started
            </Button>
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden w-10 h-10 rounded-xl bg-muted flex flex-col items-center justify-center gap-1 focus:outline-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <motion.span
              animate={mobileMenuOpen ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }}
              className="w-5 h-0.5 bg-foreground rounded-full"
            />
            <motion.span
              animate={mobileMenuOpen ? { opacity: 0 } : { opacity: 1 }}
              className="w-5 h-0.5 bg-foreground rounded-full"
            />
            <motion.span
              animate={mobileMenuOpen ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }}
              className="w-5 h-0.5 bg-foreground rounded-full"
            />
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-md z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[80%] max-w-sm bg-card border-l z-50 p-8 flex flex-col lg:hidden shadow-2xl"
            >
              <div className="flex items-center justify-between mb-12">
                <span className="text-lg font-bold tracking-tight">AUDNIX<span className="text-primary">.AI</span></span>
                <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} className="rounded-full">
                  <ChevronDown className="w-5 h-5 rotate-90" />
                </Button>
              </div>
              <div className="flex flex-col gap-6">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={(e) => {
                      setMobileMenuOpen(false);
                      if (link.href?.startsWith("#")) {
                        e.preventDefault();
                        document.getElementById(link.href.slice(1))?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="text-2xl font-bold tracking-tight hover:text-primary transition-colors"
                  >
                    {link.name}
                  </a>
                ))}
              </div>
              <div className="mt-auto flex flex-col gap-4">
                <Link href="/auth">
                  <Button className="w-full h-14 rounded-2xl text-base font-bold shadow-xl shadow-primary/20">
                    Get Started
                  </Button>
                </Link>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">v4.0.0 Stable</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}