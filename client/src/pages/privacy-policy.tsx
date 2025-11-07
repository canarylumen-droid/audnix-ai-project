
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, Lock, Eye, Database, UserCheck, FileText, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <img src="/logo.jpg" alt="Audnix AI" className="h-8 w-auto" />
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Audnix AI
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Your Privacy Matters</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-xl text-muted-foreground">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </motion.div>

          {/* Quick Summary Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-12">
            {[
              { icon: Lock, title: "End-to-End Encrypted", desc: "AES-256-GCM encryption" },
              { icon: Eye, title: "No Data Selling", desc: "We never sell your data" },
              { icon: UserCheck, title: "GDPR Compliant", desc: "Full data control" }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                <Card className="p-6 text-center border-primary/20 hover:border-primary/40 transition-colors">
                  <item.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Content Sections */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Database className="w-6 h-6 text-primary" />
                Information We Collect
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Account Information</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Email address and name for account creation</li>
                    <li>Subscription plan and billing information (processed via Stripe)</li>
                    <li>Profile information you choose to provide</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Integration Data</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Instagram, WhatsApp, and Email connection credentials (end-to-end encrypted)</li>
                    <li>Voice recordings for AI cloning (stored encrypted, deleted on request)</li>
                    <li>Lead information you import or capture through our platform</li>
                    <li>Conversation history and message content (encrypted at rest)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Usage Data</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Analytics on feature usage and engagement metrics</li>
                    <li>Voice minutes consumed and lead count</li>
                    <li>AI automation performance and success rates</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Lock className="w-6 h-6 text-primary" />
                How We Protect Your Data
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Enterprise-Grade Encryption</h3>
                  <p>All sensitive data including integration credentials, chat sessions, and voice recordings are encrypted using AES-256-GCM encryption. Even our administrators cannot access your encrypted data without your unique encryption key.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Secure Infrastructure</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Hosted on secure, SOC 2 certified cloud infrastructure</li>
                    <li>Regular security audits and penetration testing</li>
                    <li>Automated backups with encryption at rest and in transit</li>
                    <li>DDoS protection and intrusion detection systems</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Password Protection</h3>
                  <p>Instagram and WhatsApp passwords are NEVER stored. They are used only once during authentication to generate encrypted session tokens, then immediately discarded.</p>
                </div>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Eye className="w-6 h-6 text-primary" />
                How We Use Your Information
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>We use your information solely to provide and improve our services:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Process and manage your account and subscriptions</li>
                  <li>Enable AI-powered automation and voice message delivery</li>
                  <li>Provide customer support and respond to your requests</li>
                  <li>Send important service updates and security notifications</li>
                  <li>Improve our AI models and platform performance</li>
                  <li>Prevent fraud and ensure platform security</li>
                </ul>
                <p className="font-semibold text-foreground mt-4">We NEVER:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Sell your personal data to third parties</li>
                  <li>Share your conversation content with advertisers</li>
                  <li>Use your leads for our own marketing purposes</li>
                  <li>Train AI models on your private conversations without permission</li>
                </ul>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-primary" />
                Your Rights (GDPR Compliance)
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>You have complete control over your data:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Access:</strong> Request a copy of all data we store about you</li>
                  <li><strong>Correction:</strong> Update or correct any inaccurate information</li>
                  <li><strong>Deletion:</strong> Request permanent deletion of your account and all associated data</li>
                  <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
                  <li><strong>Objection:</strong> Opt out of certain data processing activities</li>
                  <li><strong>Restriction:</strong> Limit how we use your data</li>
                </ul>
                <p className="mt-4">To exercise any of these rights, contact us at <strong>privacy@audnix.ai</strong></p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6 text-primary" />
                Third-Party Services
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>We integrate with trusted third-party services:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Stripe:</strong> Payment processing (PCI-DSS compliant)</li>
                  <li><strong>OpenAI:</strong> AI conversation generation (no data retention)</li>
                  <li><strong>ElevenLabs:</strong> Voice cloning technology (encrypted storage)</li>
                  <li><strong>Supabase:</strong> Database and authentication (encrypted at rest)</li>
                  <li><strong>Instagram/Meta:</strong> Direct integration with official and unofficial APIs</li>
                  <li><strong>WhatsApp:</strong> Message delivery via official Business API</li>
                </ul>
                <p className="mt-4">Each service has its own privacy policy and we ensure they meet our security standards.</p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">Data Retention</h2>
              <div className="space-y-3 text-muted-foreground">
                <ul className="list-disc list-inside space-y-1">
                  <li>Account data: Retained while your account is active</li>
                  <li>Voice recordings: Retained until you delete them or close your account</li>
                  <li>Conversation history: Retained for 12 months or until deletion</li>
                  <li>Usage analytics: Anonymized and retained for 24 months</li>
                  <li>Deleted data: Permanently removed within 30 days of deletion request</li>
                </ul>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">Children's Privacy</h2>
              <p className="text-muted-foreground">
                Audnix AI is not intended for users under 18 years of age. We do not knowingly collect information from children. If you believe a child has provided us with personal information, please contact us immediately.
              </p>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy periodically. We will notify you of significant changes via email or through our platform. Your continued use of Audnix AI after changes constitutes acceptance of the updated policy.
              </p>
            </Card>

            <Card className="p-8 bg-primary/5 border-primary/20">
              <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
              <p className="text-muted-foreground mb-4">
                If you have questions about this Privacy Policy or how we handle your data:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Email:</strong> privacy@audnix.ai</li>
                <li><strong>Support:</strong> support@audnix.ai</li>
                <li><strong>Address:</strong> Audnix AI, Privacy Compliance Department</li>
              </ul>
            </Card>
          </motion.div>

          {/* Back to Home */}
          <div className="text-center mt-12">
            <Link href="/">
              <Button size="lg" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
