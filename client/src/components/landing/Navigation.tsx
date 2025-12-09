import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="bg-gradient-to-b from-[#0d1428] via-[#0a0f1f] to-[#0d1428] p-1.5 rounded-lg border border-cyan-500/30">
                <img
                  src="/logo.png"
                  alt="Audnix AI Logo"
                  className="h-7 w-7 object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Audnix AI
                </span>
                <span className="text-[10px] text-foreground/60 -mt-1 hidden sm:block">Your AI Closer</span>
              </div>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <a
              href="#features"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-foreground/80 hover:text-foreground transition-colors cursor-pointer text-sm"
            >
              How It Works
            </a>
            <a
              href="#pricing"
              onClick={(e) => {
                e.preventDefault();
                const pricingSection = document.querySelector('[id*="pricing"]');
                pricingSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-foreground/80 hover:text-foreground transition-colors cursor-pointer text-sm"
            >
              Pricing
            </a>
            <a
              href="#features"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('instagram')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-foreground/80 hover:text-foreground transition-colors cursor-pointer text-sm"
            >
              Resources
            </a>
            <button
              onClick={() => {
                const privacyModal = document.getElementById('privacy-modal');
                if (privacyModal) {
                  privacyModal.classList.remove('hidden');
                }
              }}
              className="text-foreground/80 hover:text-foreground transition-colors cursor-pointer text-sm"
            >
              Privacy
            </button>
            <Link href="/auth">
              <Button
                size="sm"
                className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold rounded-lg px-6"
              >
                Recover My Clients
              </Button>
            </Link>
          </div>

          <div className="md:hidden flex items-center gap-2">
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
                How It Works
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
                href="#features"
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  document.getElementById('instagram')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-foreground/80 hover:text-foreground transition-colors px-4 py-2 cursor-pointer"
              >
                Resources
              </a>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  const privacyModal = document.getElementById('privacy-modal');
                  if (privacyModal) {
                    privacyModal.classList.remove('hidden');
                  }
                }}
                className="text-foreground/80 hover:text-foreground transition-colors px-4 py-2 cursor-pointer text-left"
              >
                Privacy
              </button>
              <Link href="/auth">
                <Button
                  className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold rounded-lg py-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Recover My Clients
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
}