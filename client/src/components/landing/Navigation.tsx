import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { Menu, X, Sparkles } from "lucide-react";

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
    { name: "Product", href: "#features" },
    { name: "ROI", href: "#calc" },
    { name: "Pricing", href: "#pricing" },
    { name: "Privacy", action: () => document.getElementById('privacy-modal')?.classList.remove('hidden') },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4 md:p-6 pointer-events-none">
      <motion.nav
        className={`pointer-events-auto flex items-center justify-between px-6 py-3 transition-all duration-500 rounded-full border border-white/10 ${scrolled ? "bg-black/40 backdrop-blur-2xl shadow-2xl w-full translate-y-0" : "bg-white/5 backdrop-blur-md w-full md:w-[90%] lg:w-[80%]"
          }`}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center gap-8">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <div className="absolute -inset-2 bg-primary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="bg-white/10 p-1.5 rounded-xl border border-white/10 relative">
                  <img src="/logo.png" alt="Audnix" className="h-6 w-6 object-contain" />
                </div>
              </div>
              <span className="text-lg font-black tracking-tighter text-white">
                AUDNIX<span className="text-primary italic">.AI</span>
              </span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => {
                  if (link.action) {
                    e.preventDefault();
                    link.action();
                  } else if (link.href?.startsWith("#")) {
                    e.preventDefault();
                    document.getElementById(link.href.slice(1))?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="text-sm font-semibold text-white/50 hover:text-white transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/auth">
            <Button
              variant="ghost"
              className="hidden sm:flex text-white font-bold hover:bg-white/5 rounded-full px-6"
            >
              Log in
            </Button>
          </Link>
          <Link href="/auth">
            <Button
              className="bg-primary text-black font-black rounded-full px-6 shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
            >
              Get Started
              <Sparkles className="w-4 h-4 ml-2 fill-current" />
            </Button>
          </Link>

          <button
            className="lg:hidden text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-4 top-24 z-40 lg:hidden"
          >
            <div className="glass-card rounded-[2rem] p-8 flex flex-col gap-6 h-fit pointer-events-auto">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => {
                    setMobileMenuOpen(false);
                    if (link.action) {
                      e.preventDefault();
                      link.action();
                    }
                  }}
                  className="text-2xl font-bold text-white hover:text-primary transition-colors"
                >
                  {link.name}
                </a>
              ))}
              <div className="h-px bg-white/10" />
              <Link href="/auth">
                <Button className="w-full bg-primary text-black font-black py-6 rounded-2xl text-xl">
                  Get Started
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}