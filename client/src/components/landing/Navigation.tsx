import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img
              src="/logo.jpg"
              alt="Audnix AI Logo"
              className="h-8 w-auto object-contain"
            />
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Audnix AI
            </span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <a
              href="#features"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-foreground/80 hover:text-foreground transition-colors cursor-pointer"
            >
              Features
            </a>
            <a
              href="#pricing"
              onClick={(e) => {
                e.preventDefault();
                const pricingSection = document.querySelector('[id*="pricing"]');
                pricingSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-foreground/80 hover:text-foreground transition-colors cursor-pointer"
            >
              Pricing
            </a>
            <a
              href="#use-cases"
              onClick={(e) => {
                e.preventDefault();
                const useCasesSection = document.querySelector('section:has(h2:contains("Built for"))');
                if (useCasesSection) {
                  useCasesSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="text-foreground/80 hover:text-foreground transition-colors cursor-pointer"
            >
              Use Cases
            </a>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            <Link href="/auth">
              <Button
                size="sm"
                className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-semibold rounded-lg px-6"
              >
                Start Free Trial
              </Button>
            </Link>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            <button
              className="text-foreground p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <motion.div
            className="md:hidden py-4 border-t border-white/10"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex flex-col gap-4">
              <a
                href="#features"
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-foreground/80 hover:text-foreground transition-colors px-4 py-2 cursor-pointer"
              >
                Features
              </a>
              <a
                href="#pricing"
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  const pricingSection = document.querySelector('[id*="pricing"]');
                  pricingSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-foreground/80 hover:text-foreground transition-colors px-4 py-2 cursor-pointer"
              >
                Pricing
              </a>
              <a
                href="#use-cases"
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  const useCasesSection = document.querySelector('section:has(h2:contains("Built for"))');
                  if (useCasesSection) {
                    useCasesSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="text-foreground/80 hover:text-foreground transition-colors px-4 py-2 cursor-pointer"
              >
                Use Cases
              </a>
              <Link href="/auth">
                <Button
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-semibold rounded-lg py-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
}