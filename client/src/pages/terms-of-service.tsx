
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Scale, AlertTriangle, CreditCard, Ban, CheckCircle2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function TermsOfService() {
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
              <Scale className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Legal Agreement</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
            <p className="text-xl text-muted-foreground">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </motion.div>

          {/* Quick Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 mb-12 bg-primary/5 border-primary/20">
              <h2 className="text-xl font-bold mb-4">Agreement Summary</h2>
              <p className="text-muted-foreground mb-4">
                By using Audnix AI, you agree to these terms. Here's what you need to know:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  "3-day free trial, then paid subscription",
                  "You're responsible for your integrations",
                  "AI automation follows platform policies",
                  "Cancel anytime, no hidden fees"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Content Sections */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6 text-primary" />
                1. Acceptance of Terms
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  By accessing or using Audnix AI's services, you agree to be bound by these Terms of Service and our Privacy Policy. If you disagree with any part of these terms, you may not access our service.
                </p>
                <p>
                  These terms apply to all users, including but not limited to visitors, registered users, content creators, and businesses.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-primary" />
                2. Subscription Plans & Billing
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Free Trial</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>New users receive a 3-day free trial with full access to features</li>
                    <li>No credit card required during trial period</li>
                    <li>Trial automatically expires unless you upgrade to a paid plan</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Paid Subscriptions</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Starter Plan: $49.99/month - 2,500 leads, 100 voice minutes</li>
                    <li>Pro Plan: $99.99/month - 7,000 leads, 400 voice minutes</li>
                    <li>Enterprise Plan: $199.99/month - 20,000 leads, 1,000 voice minutes</li>
                    <li>All prices in USD, billed monthly via Stripe</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Top-Ups & Overages</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Voice minutes top-ups available starting at $29 for 60 minutes</li>
                    <li>Lead capacity top-ups available starting at $29 for 1,000 leads</li>
                    <li>Top-ups are one-time purchases and do not auto-renew</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Billing & Cancellation</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Subscriptions renew automatically on the monthly anniversary</li>
                    <li>Cancel anytime from your dashboard - no cancellation fees</li>
                    <li>Cancellations take effect at the end of current billing period</li>
                    <li>No refunds for partial months or unused voice minutes</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
                3. Service Usage & Restrictions
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Acceptable Use</h3>
                  <p>You agree to use Audnix AI only for lawful purposes and in accordance with these Terms. You are prohibited from:</p>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>Sending spam, unsolicited messages, or violating anti-spam laws</li>
                    <li>Violating Instagram, WhatsApp, or other platform terms of service</li>
                    <li>Using the service to harass, abuse, or harm others</li>
                    <li>Attempting to hack, reverse engineer, or compromise our security</li>
                    <li>Sharing account credentials or reselling our services</li>
                    <li>Using AI-generated content to impersonate or deceive others</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Instagram Private API Warning</h3>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mt-2">
                    <p className="text-amber-600 dark:text-amber-400 font-semibold mb-2">
                      ⚠️ IMPORTANT: Using unofficial Instagram APIs carries risk
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Your Instagram account may be banned by Meta (not our platform)</li>
                      <li>We provide safe rate limits (40 DMs/hour) but cannot guarantee immunity</li>
                      <li>We strongly recommend using official Instagram Graph API with Business accounts</li>
                      <li>Use unofficial APIs at your own risk - Audnix AI is not liable for bans</li>
                    </ul>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Rate Limits & Fair Use</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Voice message automation respects human-like delays (4-12 seconds)</li>
                    <li>DM sending follows safe limits to prevent platform bans</li>
                    <li>Excessive API abuse may result in account suspension</li>
                    <li>We reserve the right to throttle accounts violating fair use policies</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Ban className="w-6 h-6 text-red-500" />
                4. Account Termination
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>We reserve the right to suspend or terminate your account if:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>You violate these Terms of Service or our Privacy Policy</li>
                  <li>You engage in fraudulent activity or payment disputes</li>
                  <li>You abuse our platform or send spam/malicious content</li>
                  <li>Your account is used for illegal activities</li>
                  <li>We're required to do so by law or regulation</li>
                </ul>
                <p className="mt-4">
                  Upon termination, your access to services will cease immediately. You may request data export within 30 days of termination.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">5. Intellectual Property</h2>
              <div className="space-y-3 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Your Content</h3>
                  <p>You retain all rights to content you create using Audnix AI, including:</p>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>Voice recordings and AI-generated clones</li>
                    <li>Lead data and conversation transcripts</li>
                    <li>Custom automation workflows and templates</li>
                  </ul>
                  <p className="mt-2">
                    By using our service, you grant us a limited license to process and store your content solely to provide our services.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Our Platform</h3>
                  <p>
                    Audnix AI, including our software, AI models, brand assets, and documentation, are protected by copyright and intellectual property laws. You may not copy, modify, or redistribute our platform without explicit permission.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">6. Disclaimer of Warranties</h2>
              <div className="space-y-3 text-muted-foreground">
                <p className="font-semibold text-foreground">
                  AUDNIX AI IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND.
                </p>
                <p>We do not guarantee:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Uninterrupted or error-free service operation</li>
                  <li>Specific conversion rates or sales results</li>
                  <li>Immunity from third-party platform bans (Instagram, WhatsApp, etc.)</li>
                  <li>AI accuracy or voice cloning perfection</li>
                  <li>Compatibility with future platform API changes</li>
                </ul>
                <p className="mt-4">
                  While we strive for excellence, we cannot be held liable for third-party platform policy changes or account suspensions.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">7. Limitation of Liability</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, AUDNIX AI SHALL NOT BE LIABLE FOR:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Lost profits, revenue, or business opportunities</li>
                  <li>Instagram/WhatsApp account bans or suspensions</li>
                  <li>Data loss due to user error or third-party service failures</li>
                  <li>Indirect, incidental, or consequential damages</li>
                  <li>Damages exceeding the amount you paid in the past 12 months</li>
                </ul>
                <p className="mt-4">
                  Some jurisdictions do not allow liability limitations, so these may not apply to you.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">8. Indemnification</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  You agree to indemnify and hold harmless Audnix AI from any claims, damages, or expenses arising from:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Your violation of these Terms or third-party platform policies</li>
                  <li>Your use of our service in an unlawful manner</li>
                  <li>Infringement of third-party intellectual property rights</li>
                  <li>Your lead data or content violating privacy laws</li>
                </ul>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">9. Changes to Terms</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  We may modify these Terms at any time. We will notify you of significant changes via email or in-app notification at least 30 days before they take effect.
                </p>
                <p>
                  Your continued use of Audnix AI after changes constitutes acceptance of the new terms. If you disagree, you must cancel your subscription before the effective date.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">10. Governing Law & Disputes</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  These Terms are governed by the laws of [Your Jurisdiction], without regard to conflict of law provisions.
                </p>
                <p>
                  Any disputes shall be resolved through binding arbitration in accordance with [Arbitration Rules], except where prohibited by law.
                </p>
              </div>
            </Card>

            <Card className="p-8 bg-primary/5 border-primary/20">
              <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
              <p className="text-muted-foreground mb-4">
                Questions about these Terms? Contact our legal team:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Email:</strong> legal@audnixai.com</li>
                <li><strong>Support:</strong> support@audnixai.com</li>
                <li><strong>Address:</strong> Audnix AI, Legal Department</li>
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
