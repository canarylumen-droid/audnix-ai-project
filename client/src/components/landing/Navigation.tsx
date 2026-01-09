import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { Sparkles, ChevronDown, Shield, FileText, LayoutGrid, Zap, Brain, MessageSquare } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SOLUTIONS = [
  {
    name: "For Agencies",
    desc: "Scale your client outreach without increasing headcount.",
    icon: LayoutGrid,
    badge: "Scale"
  },
  {
    name: "For Sales Teams",
    desc: "Close more deals with autonomous objection handling.",
    icon: Zap,
    badge: "Velocity"
  },
  {
    name: "For Creators",
    desc: "Monetize your audience with 24/7 AI monetization logs.",
    icon: Brain,
    badge: "New"
  }
];

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Framework", href: "#how-it-works" },
    { name: "Economic ROI", href: "#calc" },
    { name: "Ecosystem", href: "#pricing" },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex justify-center p-4 md:p-8 pointer-events-none">
      <motion.nav
        className={`pointer-events-auto flex items-center justify-between px-8 py-4 transition-all duration-700 rounded-[2rem] border border-white/10 perspective-tilt shadow-2xl ${scrolled
          ? "bg-black/60 backdrop-blur-3xl w-full max-w-7xl"
          : "bg-white/5 backdrop-blur-xl w-full md:w-[95%] lg:w-[85%]"
          }`}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center gap-12">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <div className="absolute -inset-2 bg-primary/30 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="bg-white/10 p-2 rounded-2xl border border-white/10 relative overflow-hidden">
                  <img src="/logo.png" alt="Audnix" className="h-6 w-6 object-contain grayscale brightness-200" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent" />
                </div>
              </div>
              <span className="text-xl font-black tracking-tighter text-white">
                AUDNIX<span className="text-primary italic">.AI</span>
              </span>
            </div>
          </Link>

          <div className="hidden xl:flex items-center gap-8">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1.5 text-sm font-black uppercase tracking-widest text-white/40 hover:text-white transition-all duration-500 outline-none group">
                Solutions
                <ChevronDown className="w-3 h-3 transition-transform duration-500 group-data-[state=open]:rotate-180" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-black/90 backdrop-blur-3xl border-white/10 rounded-[2.5rem] p-4 min-w-[380px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] border-t-primary/20">
                <div className="grid gap-3">
                  {SOLUTIONS.map((sol) => (
                    <DropdownMenuItem
                      key={sol.name}
                      className="flex items-start gap-5 p-4 rounded-3xl cursor-pointer hover:bg-white/5 transition-all group/item border border-transparent hover:border-white/5"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/60 group-hover/item:text-primary group-hover/item:bg-primary/10 transition-colors">
                        <sol.icon className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                          <span className="text-base font-black text-white">{sol.name}</span>
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest leading-none">
                            {sol.badge}
                          </span>
                        </div>
                        <span className="text-xs text-white/40 font-medium leading-relaxed">{sol.desc}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

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
                className="text-sm font-black uppercase tracking-widest text-white/40 hover:text-primary transition-all duration-500 relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-500 group-hover:w-full" />
              </a>
            ))}

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1.5 text-sm font-black uppercase tracking-widest text-white/40 hover:text-white transition-all duration-500 outline-none group">
                Governance
                <ChevronDown className="w-3 h-3 transition-transform duration-500 group-data-[state=open]:rotate-180" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-black/90 backdrop-blur-3xl border-white/10 rounded-[2rem] p-3 min-w-[240px] shadow-2xl border-t-white/10">
                <DropdownMenuItem
                  className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer hover:bg-white/5 text-white/60 hover:text-white transition-all"
                  onClick={() => document.getElementById('privacy-modal')?.classList.remove('hidden')}
                >
                  <Shield className="w-5 h-5 text-primary" />
                  <div className="flex flex-col">
                    <span className="text-sm font-black uppercase tracking-widest leading-none mb-1">Privacy Protocol</span>
                    <span className="text-[10px] opacity-40 font-bold italic">AES-256 Encryption</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer hover:bg-white/5 text-white/60 hover:text-white transition-all">
                  <FileText className="w-5 h-5 text-primary" />
                  <div className="flex flex-col">
                    <span className="text-sm font-black uppercase tracking-widest leading-none mb-1">Terms of Service</span>
                    <span className="text-[10px] opacity-40 font-bold italic">Usage Agreement</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/auth">
            <Button
              variant="ghost"
              className="hidden sm:flex text-white font-black uppercase tracking-[0.2em] text-[10px] hover:bg-white/5 rounded-full px-8 py-6 h-auto transition-all"
            >
              Log in
            </Button>
          </Link>
          <Link href="/auth">
            <Button
              className="group relative bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-full px-10 py-6 h-auto shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:scale-105 transition-all duration-500 overflow-hidden"
            >
              <span className="relative z-10">Start Deployment</span>
              <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 -inset-full h-full w-1/2 z-20 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white/40 opacity-40 group-hover:animate-shimmer" />
            </Button>
          </Link>

          {/* Animated Hamburger Icon */}
          <button
            className="xl:hidden w-12 h-12 rounded-2xl bg-white/5 flex flex-col items-center justify-center gap-1.5 focus:outline-none group relative overflow-hidden border border-white/10"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <motion.span
              animate={mobileMenuOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
              className="w-6 h-0.5 bg-white rounded-full transition-all duration-500"
            />
            <motion.span
              animate={mobileMenuOpen ? { opacity: 0, x: 20 } : { opacity: 1, x: 0 }}
              className="w-6 h-0.5 bg-white rounded-full transition-all duration-500"
            />
            <motion.span
              animate={mobileMenuOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
              className="w-6 h-0.5 bg-white rounded-full transition-all duration-500"
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
              className="fixed inset-0 bg-black/60 backdrop-blur-2xl z-40 xl:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[85%] max-w-md bg-black/90 border-l border-white/10 z-50 p-12 flex flex-col gap-8 xl:hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="text-xl font-black text-white tracking-widest italic">AUDNIX.</span>
                <button onClick={() => setMobileMenuOpen(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
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
                  className="text-4xl font-black text-white hover:text-primary transition-all tracking-tighter"
                >
                  {link.name}
                </a>
              ))}
              <div className="mt-auto flex flex-col gap-4">
                <Link href="/auth">
                  <Button className="w-full bg-white text-black font-black py-8 rounded-[2rem] text-xl shadow-2xl">
                    Get Started
                  </Button>
                </Link>
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em] text-center">Protocol v4.0 Active</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}