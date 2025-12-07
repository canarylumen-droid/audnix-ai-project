import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Scale, AlertTriangle, CreditCard, Ban, CheckCircle2, ArrowLeft, Shield } from "lucide-react";
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
              <div className="bg-gradient-to-b from-[#0d1428] via-[#0a0f1f] to-[#0d1428] p-1 rounded">
                <img src="/logo.png" alt="Audnix AI" className="h-8 w-auto" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
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
                  These terms apply to all users, including but not limited to visitors, registered users, content creators, and businesses using Audnix AI for sales automation.
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
                    <li>New users receive a 3-day free trial with full feature access with trial-level limits (500 leads, 30 voice minutes).</li>
                    <li>No credit card required during trial period</li>
                    <li>Trial automatically expires unless you upgrade to a paid plan</li>
                    <li>One trial per person/business (based on email address)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Paid Subscriptions</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Starter Plan: $49.99/month - 2,500 leads, 100 voice minutes</li>
                    <li>Pro Plan: $99.99/month - 7,000 leads, 400 voice minutes</li>
                    <li>Enterprise Plan: $199.99/month - 20,000 leads, 1,000 voice minutes</li>
                    <li>All prices in USD, billed monthly via Stripe</li>
                    <li>Taxes may apply based on your location</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Top-Ups & Overages</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Voice minutes top-ups available starting at $29 for 60 minutes</li>
                    <li>Lead capacity top-ups available starting at $29 for 1,000 leads</li>
                    <li>Top-ups are one-time purchases and do not auto-renew</li>
                    <li>Unused top-ups carry over to next billing cycle</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Billing & Cancellation</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Subscriptions renew automatically on the monthly anniversary</li>
                    <li>Cancel anytime from your dashboard - no cancellation fees</li>
                    <li>Cancellations take effect at the end of current billing period</li>
                    <li>No refunds for partial months or unused voice minutes. Refunds are only provided in cases of duplicate charges or clear billing errors.</li>
                    <li>Failed payments may result in service suspension after 7-day grace period</li>
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
                    <li>Sending spam, unsolicited messages, or violating CAN-SPAM Act / GDPR</li>
                    <li>Violating Instagram or other platform terms of service</li>
                    <li>Using the service to harass, abuse, threaten, or harm others</li>
                    <li>Attempting to hack, reverse engineer, or compromise our security</li>
                    <li>Sharing account credentials or reselling our services</li>
                    <li>Using AI-generated content to impersonate or deceive others</li>
                    <li>Scraping or bulk-downloading data from the platform</li>
                    <li>Bypassing usage limits or rate limits</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Instagram Integration</h3>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 mt-2">
                    <p className="text-emerald-600 dark:text-emerald-400 font-semibold mb-2">
                      ✅ Official Instagram Graph API Integration
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Audnix AI uses the official Instagram Graph API for all Instagram features</li>
                      <li>Requires an Instagram Business or Creator account connected to a Facebook Page</li>
                      <li>Uses Meta's official OAuth authentication flow for secure access</li>
                      <li>Complies with Instagram Platform Policy and Meta's terms of service</li>
                      <li>You are responsible for following Instagram Community Guidelines in your messaging</li>
                    </ul>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Rate Limits & Fair Use</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Voice message automation respects human-like delays (4-12 seconds between messages)</li>
                    <li>Instagram DMs limited to 40/hour to prevent platform flags</li>
                    <li>Email sending follows your SMTP provider's rate limits</li>
                    <li>Excessive API abuse may result in temporary or permanent account suspension</li>
                    <li>We reserve the right to throttle accounts violating fair use policies</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Platform-Specific Policies</h3>
                  <p className="text-sm mb-2">By using Audnix AI, you also agree to comply with:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>Instagram:</strong> <a href="https://help.instagram.com/581066165581870" className="text-primary hover:underline" target="_blank">Instagram Community Guidelines</a> and <a href="https://www.facebook.com/help/instagram/477434105621119" className="text-primary hover:underline" target="_blank">Terms of Use</a></li>
                    <li><strong>Email:</strong> Your email provider's terms of service and anti-spam policies (CAN-SPAM, GDPR)</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                4. Data Security & Integration Responsibilities
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Our Security Obligations</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Encrypt all sensitive data using AES-256-GCM encryption</li>
                    <li>Use TLS 1.3 for all data in transit</li>
                    <li>Implement row-level security (RLS) to isolate user data</li>
                    <li>Never store passwords (OAuth tokens only, encrypted)</li>
                    <li>Conduct regular security audits and penetration testing</li>
                    <li>Notify you within 72 hours of any data breach</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Your Responsibilities</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Keep your account credentials secure and confidential</li>
                    <li>Use strong, unique passwords and enable 2FA when available</li>
                    <li>Do not share your account with unauthorized users</li>
                    <li>Comply with all third-party platform policies (Instagram, Email providers)</li>
                    <li>Ensure you have legal permission to contact leads in your database</li>
                    <li>Review and approve AI-generated messages before automation (if uncertain)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Integration Disconnection</h3>
                  <p className="text-sm">
                    You can disconnect any integration (Email, Instagram, Calendar) at any time without losing your account or lead data.
                    Disconnecting will revoke all access tokens and stop automated messaging for that platform.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Ban className="w-6 h-6 text-red-500" />
                5. Account Termination
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>We reserve the right to suspend or terminate your account if:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>You violate these Terms of Service or our Privacy Policy</li>
                  <li>You engage in fraudulent activity, chargebacks, or payment disputes</li>
                  <li>You abuse our platform, send spam, or engage in malicious content delivery</li>
                  <li>Your account is used for illegal activities (phishing, fraud, harassment)</li>
                  <li>We're required to do so by law, court order, or regulation</li>
                  <li>Your account remains inactive for 12+ months without payment</li>
                </ul>
                <p className="mt-4">
                  <strong>Termination Process:</strong> Upon termination, your access to services will cease immediately. You may request data export within 30 days of termination.
                  After 30 days, all data will be permanently deleted.
                </p>
                <p className="mt-2">
                  <strong>Appeals:</strong> If you believe your account was terminated in error, contact <strong className="text-primary">support@audnixai.com</strong> within 14 days.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">6. Intellectual Property</h2>
              <div className="space-y-3 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Your Content</h3>
                  <p>You retain all rights to content you create using Audnix AI, including:</p>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>Voice recordings and AI-generated voice clones</li>
                    <li>Lead data, conversation transcripts, and message content</li>
                    <li>Custom automation workflows, templates, and scripts</li>
                    <li>Brand documents, PDFs, and training materials you upload</li>
                  </ul>
                  <p className="mt-2">
                    <strong>License Grant:</strong> By using our service, you grant us a limited, non-exclusive, royalty-free license to process, store, and use your content
                    solely to provide Audnix AI services. This license terminates when you delete the content or close your account.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Our Platform</h3>
                  <p>
                    Audnix AI, including our software, AI models, algorithms, brand assets, logos, and documentation, are protected by copyright, trademark,
                    and intellectual property laws. You may not:
                  </p>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>Copy, modify, or distribute our platform without explicit permission</li>
                    <li>Reverse engineer or decompile our software</li>
                    <li>Remove copyright notices or proprietary markings</li>
                    <li>Use our brand name, logo, or trademarks without written authorization</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">AI-Generated Content</h3>
                  <p className="text-sm">
                    <strong>Ownership:</strong> You own AI-generated messages created by Audnix AI for your leads. However, you are responsible for ensuring
                    these messages comply with platform policies and legal regulations.
                  </p>
                  <p className="text-sm mt-2">
                    <strong>Training Data:</strong> With your consent (opt-in), anonymized conversation data may be used to improve AI models. You can opt out at any time in Settings.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">7. Disclaimer of Warranties</h2>
              <div className="space-y-3 text-muted-foreground">
                <p className="font-semibold text-foreground">
                  AUDNIX AI IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
                </p>
                <p>We do not guarantee:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Uninterrupted Service:</strong> We may experience downtime for maintenance, updates, or unforeseen technical issues</li>
                  <li><strong>Specific Results:</strong> We do not guarantee conversion rates, sales, or business outcomes from using our platform</li>
                  <li><strong>Platform Immunity:</strong> We cannot prevent third-party platforms (Instagram, email providers) from banning or restricting your account</li>
                  <li><strong>AI Accuracy:</strong> AI-generated messages may occasionally be incorrect, inappropriate, or require human review</li>
                  <li><strong>Voice Cloning Perfection:</strong> Voice clones aim for 90%+ accuracy but may not perfectly replicate all speech nuances. Users are solely responsible for ensuring they have rights to use any voice they upload or clone.</li>
                  <li><strong>API Compatibility:</strong> Third-party APIs (Instagram, email providers) may change without notice, affecting functionality</li>
                  <li><strong>Data Loss Prevention:</strong> While we implement backups, we are not liable for data loss due to user error or force majeure</li>
                </ul>
                <p className="mt-4">
                  <strong>Testing Recommendation:</strong> We strongly recommend testing automation workflows on a small subset of leads before full deployment.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">8. Limitation of Liability</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, AUDNIX AI AND ITS AFFILIATES SHALL NOT BE LIABLE FOR:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Lost Profits or Revenue:</strong> Any loss of business, sales, or opportunities</li>
                  <li><strong>Platform Bans:</strong> Instagram or email account suspensions or restrictions</li>
                  <li><strong>Data Loss:</strong> Loss of lead data, messages, or content due to user error or third-party service failures</li>
                  <li><strong>Indirect Damages:</strong> Consequential, incidental, punitive, or special damages</li>
                  <li><strong>Third-Party Actions:</strong> Actions or failures of OpenAI, ElevenLabs, Stripe, or other integrated services</li>
                  <li><strong>Unauthorized Access:</strong> Security breaches caused by user negligence (weak passwords, shared credentials)</li>
                </ul>
                <p className="mt-4">
                  <strong>Maximum Liability:</strong> Our total liability to you for any claims arising from these Terms shall not exceed the amount you paid to Audnix AI
                  in the 12 months preceding the claim.
                </p>
                <p className="mt-2 text-sm">
                  <strong>Note:</strong> Some jurisdictions do not allow liability limitations, so these may not apply to you.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">9. Indemnification</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  You agree to indemnify, defend, and hold harmless Audnix AI, its affiliates, officers, directors, employees, and agents from any claims, damages,
                  losses, liabilities, and expenses (including legal fees) arising from:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Your violation of these Terms or third-party platform policies</li>
                  <li>Your use of Audnix AI in an unlawful, fraudulent, or abusive manner</li>
                  <li>Infringement of third-party intellectual property rights (e.g., using copyrighted content without permission)</li>
                  <li>Your lead data or messaging content violating privacy laws (GDPR, CCPA, CAN-SPAM)</li>
                  <li>Claims by leads, customers, or third parties arising from your use of our platform</li>
                </ul>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">10. Compliance with Laws</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>You agree to comply with all applicable laws and regulations, including:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>CAN-SPAM Act (USA):</strong> Do not send unsolicited commercial emails. Include unsubscribe links.</li>
                  <li><strong>GDPR (EU):</strong> Obtain consent before messaging EU residents. Honor data deletion requests.</li>
                  <li><strong>CCPA (California):</strong> Provide privacy notices and allow California residents to opt out of data sales.</li>
                  <li><strong>TCPA (USA):</strong> Do not send automated text messages without prior express written consent.</li>
                  <li><strong>Data Protection Laws:</strong> Ensure you have legal permission to contact and store lead data.</li>
                </ul>
                <p className="mt-2 text-sm">
                  <strong>Your Responsibility:</strong> You are solely responsible for ensuring your use of Audnix AI complies with laws in your jurisdiction and your leads' jurisdictions.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">11. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We may modify these Terms at any time. We will notify you of significant changes via email or in-app notification at least <strong>30 days before</strong> they take effect.
              </p>
              <p className="text-muted-foreground mt-2">
                Your continued use of Audnix AI after changes constitutes acceptance of the new terms. If you disagree, you must cancel your subscription before the effective date.
              </p>
              <p className="text-muted-foreground mt-2">
                <strong>Version History:</strong> All previous versions are archived at <a href="/terms-history" className="text-primary hover:underline">audnixai.com/terms-history</a>
              </p>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">13. Governing Law & Disputes</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  These Terms are governed by the laws of <strong>[Your Jurisdiction - e.g., State of Delaware, USA]</strong>, without regard to conflict of law provisions.
                </p>
                <p>
                  <strong>Dispute Resolution:</strong> Any disputes arising from these Terms shall be resolved through:
                </p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li><strong>Informal Negotiation:</strong> Contact <strong>legal@audnixai.com</strong> to attempt resolution (30-day good-faith period)</li>
                  <li><strong>Binding Arbitration:</strong> If negotiation fails, disputes shall be resolved through binding arbitration in accordance with
                  the American Arbitration Association (AAA) rules, except where prohibited by law. BY USING THE SERVICE YOU WAIVE YOUR RIGHT TO A JURY TRIAL.</li>
                  <li><strong>Class Action Waiver:</strong> You agree to resolve disputes individually, not as part of a class action lawsuit</li>
                </ol>
                <p className="mt-2 text-sm">
                  <strong>Exception:</strong> Either party may seek injunctive relief in court for intellectual property violations or breaches of confidentiality.
                </p>
              </div>
            </Card>

            <Card className="p-8 border-amber-500/20 bg-amber-500/5">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
                13. AI-Generated Communications Disclaimer
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  <strong>Important:</strong> Audnix AI uses artificial intelligence to generate and send automated messages on your behalf (email, WhatsApp, SMS, voice). Please understand the following:
                </p>
                
                <div className="bg-background/50 p-4 rounded-lg border border-amber-500/20">
                  <h3 className="font-semibold text-foreground mb-2">AI Messages Are Not Legally Binding</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>AI-generated messages are <strong>informational only</strong> and do not represent official company commitments or policies</li>
                    <li>Recipients should not rely on AI messages for legal, financial, or binding business decisions</li>
                    <li>Only written communications from authorized company representatives are legally binding</li>
                    <li>For official policies, commitments, or legal matters, recipients must contact your company directly</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">Your Responsibility</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>You are responsible for the content of all AI-generated messages sent through Audnix AI</li>
                    <li>You must ensure AI messages comply with all applicable laws (CAN-SPAM, GDPR, CCPA, TCPA, etc.)</li>
                    <li>You must ensure you have permission to contact all recipients with automated messages</li>
                    <li>You must regularly review AI-generated content to ensure accuracy and compliance</li>
                    <li>If an AI message makes statements you disagree with or that violate laws, you are still liable</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">Regulated Industries</h3>
                  <p className="text-sm">
                    If you operate in regulated industries (finance, healthcare, legal, real estate), you must:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                    <li>Obtain prior written approval before using AI to send regulated communications</li>
                    <li>Ensure compliance with industry-specific regulations and licensing requirements</li>
                    <li>Add human review before sending high-value or sensitive communications</li>
                  </ul>
                </div>

                <p className="text-sm bg-amber-500/10 p-3 rounded border border-amber-500/20">
                  <strong>Summary:</strong> AI messages are tools for efficiency, not replacements for official company communication. Always verify important information directly with authorized representatives.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">14. Miscellaneous</h2>
              <div className="space-y-3 text-muted-foreground">
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Entire Agreement:</strong> These Terms, along with our Privacy Policy, constitute the entire agreement between you and Audnix AI</li>
                  <li><strong>Severability:</strong> If any provision is found invalid, the remaining provisions remain in effect</li>
                  <li><strong>No Waiver:</strong> Our failure to enforce any right does not waive that right</li>
                  <li><strong>Assignment:</strong> You may not assign these Terms. We may assign them to affiliates or acquirers</li>
                  <li><strong>Force Majeure:</strong> We are not liable for delays or failures due to events beyond our control (natural disasters, wars, pandemics)</li>
                  <li><strong>Export Compliance:</strong> You agree not to export or re-export our software to embargoed countries or prohibited entities</li>
                </ul>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">15. International Data Transfers & Storage</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  <strong>Data Residency:</strong> All user data is stored on Supabase infrastructure (SOC 2 Type II certified) with primary storage regions in the United States.
                  EU users' data may be replicated to EU-based Supabase servers for compliance.
                </p>
                <p>
                  Audnix AI operates globally. Your data may be transferred to and processed in countries outside your residence,
                  including the United States and European Union.
                </p>
                <p>
                  <strong>EU-US Data Transfers:</strong> We comply with the EU-US Data Privacy Framework and use Standard Contractual Clauses (SCCs)
                  approved by the European Commission for data transfers.
                </p>
                <p>
                  <strong>Data Localization:</strong> You can request that your data be stored in specific regions (EU, US) if required by local regulations.
                </p>
              </div>
            </Card>

            <Card className="p-8 bg-primary/5 border-primary/20">
              <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
              <p className="text-muted-foreground mb-4">
                Questions about these Terms? Contact our legal team:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Legal Inquiries:</strong> <a href="mailto:legal@audnixai.com" className="text-primary hover:underline">legal@audnixai.com</a></li>
                <li><strong>General Support:</strong> <a href="mailto:support@audnixai.com" className="text-primary hover:underline">support@audnixai.com</a></li>
                <li><strong>Billing Questions:</strong> <a href="mailto:billing@audnixai.com" className="text-primary hover:underline">billing@audnixai.com</a></li>
                <li><strong>Mailing Address:</strong> Audnix AI, Inc., 251 18th Street, 7th Floor, New York, NY 10011, USA</li>
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