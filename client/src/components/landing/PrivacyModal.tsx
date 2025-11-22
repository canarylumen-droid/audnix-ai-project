import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export function PrivacyModal() {
  const closeModal = () => {
    const modal = document.getElementById('privacy-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  };

  return (
    <AnimatePresence>
      <div
        id="privacy-modal"
        className="hidden fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={closeModal}
      >
        <motion.div
          className="bg-gradient-to-b from-gray-900 to-black border border-cyan-500/30 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-cyan-600/20 via-purple-600/20 to-pink-600/20 border-b border-cyan-500/20 p-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Privacy Policy</h2>
            <button
              onClick={closeModal}
              className="text-foreground/60 hover:text-foreground transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 text-white/80">
            <section>
              <h3 className="text-xl font-semibold text-white mb-3">1. Information We Collect</h3>
              <p className="leading-relaxed">
                We collect information you provide directly, including email, phone number, and business details. We also collect usage data to improve our service.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">2. How We Use Your Information</h3>
              <p className="leading-relaxed mb-3">
                Your information is used to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Provide and improve our services</li>
                <li>Send transactional emails and notifications</li>
                <li>Process payments and billing</li>
                <li>Analyze usage patterns and optimize features</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">3. Data Security</h3>
              <p className="leading-relaxed">
                We implement industry-standard security measures including encryption (AES-256), secure sessions, and rate limiting to protect your information.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">4. Third-Party Integrations</h3>
              <p className="leading-relaxed">
                You control which services (WhatsApp, Email, Calendly, Stripe) connect to your account. We never access your credentials without permission.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">5. Your Rights</h3>
              <p className="leading-relaxed mb-3">
                You have the right to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Access your data anytime</li>
                <li>Request data deletion</li>
                <li>Disconnect integrations</li>
                <li>Cancel your subscription</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">6. Changes to This Policy</h3>
              <p className="leading-relaxed">
                We may update this policy periodically. We'll notify you of significant changes via email.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">7. Contact Us</h3>
              <p className="leading-relaxed">
                Questions about privacy? Email us at <span className="text-cyan-400">privacy@audnixai.com</span>
              </p>
            </section>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-900/50 border-t border-cyan-500/20 p-6 flex justify-end">
            <button
              onClick={closeModal}
              className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
