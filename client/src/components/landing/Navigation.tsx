import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 bg-[#0d1428]/80 backdrop-blur-lg border-b border-white/10"
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
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-200 to-purple-200 bg-clip-text text-transparent">
              Audnix AI
            </span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <a
              href="#features"
              className="text-white/80 hover:text-white transition-colors"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-white/80 hover:text-white transition-colors"
            >
              Pricing
            </a>
            <a
              href="#contact"
              className="text-white/80 hover:text-white transition-colors"
            >
              Contact
            </a>
            <Link href="/auth">
              <Button
                size="sm"
                className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-semibold"
              >
                Start Free Trial
              </Button>
            </Link>
          </div>

          <button
            className="md:hidden text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
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
                className="text-white/80 hover:text-white transition-colors px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-white/80 hover:text-white transition-colors px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </a>
              <a
                href="#contact"
                className="text-white/80 hover:text-white transition-colors px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </a>
              <Link href="/auth">
                <Button
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-semibold"
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
