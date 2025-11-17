
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, Lock, Eye, Database, UserCheck, FileText, ArrowLeft, Mail, Calendar, MessageSquare, Phone } from "lucide-react";
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
              <span className="text-sm font-semibold text-primary">Enterprise-Grade Privacy</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-xl text-muted-foreground">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </motion.div>

          {/* Quick Summary Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-12">
            {[
              { icon: Lock, title: "AES-256-GCM Encrypted", desc: "Military-grade encryption" },
              { icon: Eye, title: "Zero Data Selling", desc: "We never sell your data" },
              { icon: UserCheck, title: "GDPR + CCPA Compliant", desc: "Full data ownership" }
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
                Information We Collect & Why
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Account Information</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Email address (for authentication and notifications)</li>
                    <li>Name (for personalization)</li>
                    <li>Subscription plan (to enforce usage limits)</li>
                    <li>Billing information (processed securely via Stripe - we never store card details)</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="p-8 border-primary/20">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Mail className="w-6 h-6 text-primary" />
                Gmail Integration - Detailed Scope Explanation
              </h2>
              <div className="space-y-6 text-muted-foreground">
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                  <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-400" />
                    Why We Need Gmail Access
                  </h3>
                  <p className="text-sm">
                    Audnix AI automates lead follow-ups via email. To do this effectively, we need to read incoming messages, 
                    understand conversation context, and send intelligent replies on your behalf.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-3">Scopes We Request (3 Minimal Scopes Only)</h3>
                  
                  <div className="space-y-4">
                    <div className="border-l-4 border-emerald-500 pl-4">
                      <h4 className="font-semibold text-foreground">1. gmail.readonly</h4>
                      <p className="text-sm mt-1"><strong>What it allows:</strong> Read email messages and metadata</p>
                      <p className="text-sm mt-1"><strong>Why we need it:</strong></p>
                      <ul className="list-disc list-inside text-sm ml-4 space-y-1 mt-2">
                        <li>Monitor incoming lead messages in real-time</li>
                        <li>Understand full conversation history for context-aware AI replies</li>
                        <li>Detect follow-up opportunities (e.g., unanswered questions from leads)</li>
                        <li>Analyze lead engagement (opened emails, replied threads)</li>
                      </ul>
                      <p className="text-sm mt-2 text-emerald-400"><strong>What we DON'T do:</strong> We do not scan unrelated emails or access emails outside of lead conversations you import.</p>
                    </div>

                    <div className="border-l-4 border-cyan-500 pl-4">
                      <h4 className="font-semibold text-foreground">2. gmail.modify</h4>
                      <p className="text-sm mt-1"><strong>What it allows:</strong> Mark messages as read, add/remove labels, organize threads</p>
                      <p className="text-sm mt-1"><strong>Why we need it:</strong></p>
                      <ul className="list-disc list-inside text-sm ml-4 space-y-1 mt-2">
                        <li>Mark AI-handled messages as "read" to keep your inbox clean</li>
                        <li>Add labels like "Audnix Handled", "Follow-up Needed", "Hot Lead" for organization</li>
                        <li>Archive or categorize threads automatically based on AI actions</li>
                        <li>Keep your Gmail organized without manual intervention</li>
                      </ul>
                      <p className="text-sm mt-2 text-cyan-400"><strong>What we DON'T do:</strong> We never delete emails or modify content. We only organize them.</p>
                    </div>

                    <div className="border-l-4 border-purple-500 pl-4">
                      <h4 className="font-semibold text-foreground">3. gmail.send</h4>
                      <p className="text-sm mt-1"><strong>What it allows:</strong> Send emails from your Gmail address</p>
                      <p className="text-sm mt-1"><strong>Why we need it:</strong></p>
                      <ul className="list-disc list-inside text-sm ml-4 space-y-1 mt-2">
                        <li>Send AI-generated follow-up emails to leads automatically</li>
                        <li>Reply to lead inquiries with context-aware, personalized responses</li>
                        <li>Send nurture sequences (e.g., "checking in", "did you see my last message?")</li>
                        <li>Close deals by sending booking links, proposals, or answers to objections</li>
                      </ul>
                      <p className="text-sm mt-2 text-purple-400"><strong>What we DON'T do:</strong> We never send spam, promotional emails, or emails unrelated to your leads.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-400 mb-2">⚠️ Important: Email Storage Policy</h4>
                  <p className="text-sm">
                    <strong>We do NOT permanently store your emails.</strong> Emails are processed in real-time, 
                    used to generate AI replies, and then only the lead conversation metadata (e.g., "replied on X date") 
                    is stored. Full email content is never retained on our servers.
                  </p>
                  <p className="text-sm mt-2">
                    <strong>Exception:</strong> If you enable "conversation history" in settings, we store message summaries 
                    (not full emails) encrypted at rest for context in future conversations.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-8 border-primary/20">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-primary" />
                Google Calendar Integration - Detailed Scope Explanation
              </h2>
              <div className="space-y-6 text-muted-foreground">
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                  <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-400" />
                    Why We Need Calendar Access
                  </h3>
                  <p className="text-sm">
                    Audnix AI automatically books calls with leads. To prevent double-bookings and suggest available times, 
                    we need to check your calendar availability and create events.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-3">Scopes We Request (2 Minimal Scopes Only)</h3>
                  
                  <div className="space-y-4">
                    <div className="border-l-4 border-emerald-500 pl-4">
                      <h4 className="font-semibold text-foreground">1. calendar.events</h4>
                      <p className="text-sm mt-1"><strong>What it allows:</strong> Create, edit, and delete calendar events</p>
                      <p className="text-sm mt-1"><strong>Why we need it:</strong></p>
                      <ul className="list-disc list-inside text-sm ml-4 space-y-1 mt-2">
                        <li>Automatically create calendar events when leads book calls</li>
                        <li>Add Google Meet links for video calls</li>
                        <li>Send calendar invites to leads automatically</li>
                        <li>Update event details if leads reschedule</li>
                      </ul>
                      <p className="text-sm mt-2 text-emerald-400"><strong>What we DON'T do:</strong> We only create events related to Audnix lead bookings. We never modify your personal events.</p>
                    </div>

                    <div className="border-l-4 border-cyan-500 pl-4">
                      <h4 className="font-semibold text-foreground">2. calendar.events.readonly</h4>
                      <p className="text-sm mt-1"><strong>What it allows:</strong> View existing calendar events (read-only)</p>
                      <p className="text-sm mt-1"><strong>Why we need it:</strong></p>
                      <ul className="list-disc list-inside text-sm ml-4 space-y-1 mt-2">
                        <li>Check your availability before suggesting call times to leads</li>
                        <li>Prevent double-bookings by detecting conflicts</li>
                        <li>Suggest alternative times if requested slot is already taken</li>
                        <li>Show your upcoming appointments in Audnix dashboard</li>
                      </ul>
                      <p className="text-sm mt-2 text-cyan-400"><strong>What we DON'T do:</strong> We never read event content (e.g., meeting notes). We only check start/end times for availability.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                  <h4 className="font-semibold text-emerald-400 mb-2">✅ Calendar Data Usage</h4>
                  <ul className="text-sm space-y-1">
                    <li>✓ We only check if time slots are "busy" or "free" - no event details are stored</li>
                    <li>✓ Calendar data is processed in real-time and never permanently stored</li>
                    <li>✓ You can disconnect your calendar at any time without losing lead data</li>
                    <li>✓ Events created by Audnix are clearly labeled so you can identify them</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="p-8 border-primary/20">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-primary" />
                Instagram Integration - Detailed Access Explanation
              </h2>
              <div className="space-y-6 text-muted-foreground">
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                  <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-400" />
                    Why We Need Instagram Access
                  </h3>
                  <p className="text-sm">
                    Audnix AI automates Instagram DM replies and comment engagement. We need access to read incoming messages, 
                    detect buying intent in comments, and send personalized follow-ups.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-3">What We Access</h3>
                  
                  <div className="space-y-4">
                    <div className="border-l-4 border-pink-500 pl-4">
                      <h4 className="font-semibold text-foreground">Instagram Direct Messages (DMs)</h4>
                      <p className="text-sm mt-1"><strong>What we access:</strong></p>
                      <ul className="list-disc list-inside text-sm ml-4 space-y-1 mt-2">
                        <li>Incoming DMs from leads (messages sent to you)</li>
                        <li>Your outgoing DM history (to understand conversation context)</li>
                        <li>Message metadata (timestamps, read status, sender profile)</li>
                      </ul>
                      <p className="text-sm mt-2"><strong>Why we need it:</strong></p>
                      <ul className="list-disc list-inside text-sm ml-4 space-y-1 mt-2">
                        <li>Detect when leads message you with questions or interest</li>
                        <li>Understand full conversation history for context-aware AI replies</li>
                        <li>Send automated follow-ups if leads go silent</li>
                        <li>Handle objections and book calls via DM</li>
                      </ul>
                      <p className="text-sm mt-2 text-pink-400"><strong>Security:</strong> DM credentials are AES-256 encrypted and never logged in plain text.</p>
                    </div>

                    <div className="border-l-4 border-purple-500 pl-4">
                      <h4 className="font-semibold text-foreground">Post Comments</h4>
                      <p className="text-sm mt-1"><strong>What we access:</strong></p>
                      <ul className="list-disc list-inside text-sm ml-4 space-y-1 mt-2">
                        <li>Comments on your posts (public data)</li>
                        <li>Commenter usernames and profile info</li>
                        <li>Emoji reactions and engagement signals</li>
                      </ul>
                      <p className="text-sm mt-2"><strong>Why we need it:</strong></p>
                      <ul className="list-disc list-inside text-sm ml-4 space-y-1 mt-2">
                        <li>Detect buying intent in comments (e.g., "How much?", "I need this")</li>
                        <li>Automatically DM interested commenters</li>
                        <li>Filter spam/competitor comments</li>
                        <li>Track engagement metrics for analytics</li>
                      </ul>
                      <p className="text-sm mt-2 text-purple-400"><strong>Privacy:</strong> Comments are public data. We only process comments on YOUR posts.</p>
                    </div>

                    <div className="border-l-4 border-indigo-500 pl-4">
                      <h4 className="font-semibold text-foreground">Profile Information</h4>
                      <p className="text-sm mt-1"><strong>What we access:</strong></p>
                      <ul className="list-disc list-inside text-sm ml-4 space-y-1 mt-2">
                        <li>Your Instagram username and profile picture</li>
                        <li>Lead usernames when they engage with you</li>
                        <li>Follower count (for analytics only)</li>
                      </ul>
                      <p className="text-sm mt-2 text-indigo-400"><strong>Usage:</strong> Only for displaying your profile in the dashboard and personalizing AI messages.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-400 mb-2">⚠️ Instagram Private API Warning</h4>
                  <p className="text-sm">
                    <strong>Important:</strong> Instagram's unofficial API is used for DM automation. While we implement safe rate limits 
                    (40 DMs/hour) and human-like delays, there is always a risk of account restrictions from Meta. 
                    We strongly recommend using Instagram Graph API (official) with a Business account for maximum safety.
                  </p>
                  <p className="text-sm mt-2">
                    <strong>Your password is NEVER stored.</strong> It's used once during login to generate an encrypted session token, 
                    then immediately discarded.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-8 border-primary/20">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Phone className="w-6 h-6 text-primary" />
                WhatsApp Integration - Detailed Access Explanation
              </h2>
              <div className="space-y-6 text-muted-foreground">
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                  <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-400" />
                    Why We Need WhatsApp Access
                  </h3>
                  <p className="text-sm">
                    Audnix AI automates WhatsApp follow-ups and voice message replies. We need access to send messages, 
                    read incoming chats, and deliver AI-cloned voice notes on your behalf.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-3">What We Access</h3>
                  
                  <div className="space-y-4">
                    <div className="border-l-4 border-emerald-500 pl-4">
                      <h4 className="font-semibold text-foreground">WhatsApp Messages</h4>
                      <p className="text-sm mt-1"><strong>What we access:</strong></p>
                      <ul className="list-disc list-inside text-sm ml-4 space-y-1 mt-2">
                        <li>Incoming messages from leads you import</li>
                        <li>Your outgoing message history (for conversation context)</li>
                        <li>Message status (delivered, read, replied)</li>
                      </ul>
                      <p className="text-sm mt-2"><strong>Why we need it:</strong></p>
                      <ul className="list-disc list-inside text-sm ml-4 space-y-1 mt-2">
                        <li>Detect when leads respond to your outreach</li>
                        <li>Understand conversation flow for intelligent AI replies</li>
                        <li>Send follow-up messages if leads don't respond</li>
                        <li>Handle objections and close deals via WhatsApp</li>
                      </ul>
                      <p className="text-sm mt-2 text-emerald-400"><strong>Encryption:</strong> WhatsApp messages are end-to-end encrypted by WhatsApp. We only process message text for AI replies.</p>
                    </div>

                    <div className="border-l-4 border-cyan-500 pl-4">
                      <h4 className="font-semibold text-foreground">Voice Notes</h4>
                      <p className="text-sm mt-1"><strong>What we access:</strong></p>
                      <ul className="list-disc list-inside text-sm ml-4 space-y-1 mt-2">
                        <li>Your voice sample (30 seconds recording for AI cloning)</li>
                        <li>Permission to send voice notes using your cloned voice</li>
                      </ul>
                      <p className="text-sm mt-2"><strong>Why we need it:</strong></p>
                      <ul className="list-disc list-inside text-sm ml-4 space-y-1 mt-2">
                        <li>Clone your voice for personalized follow-up messages</li>
                        <li>Send AI-generated voice notes that sound exactly like you</li>
                        <li>Increase response rates (voice notes get 3x more replies than text)</li>
                      </ul>
                      <p className="text-sm mt-2 text-cyan-400"><strong>Voice Storage:</strong> Your voice sample is encrypted with AES-256-GCM and stored securely. You can delete it at any time.</p>
                    </div>

                    <div className="border-l-4 border-purple-500 pl-4">
                      <h4 className="font-semibold text-foreground">Contact Information</h4>
                      <p className="text-sm mt-1"><strong>What we access:</strong></p>
                      <ul className="list-disc list-inside text-sm ml-4 space-y-1 mt-2">
                        <li>Phone numbers of leads you manually import or add</li>
                        <li>Contact names (if saved in your WhatsApp)</li>
                      </ul>
                      <p className="text-sm mt-2 text-purple-400"><strong>Privacy:</strong> We only access contacts YOU explicitly import into Audnix. We never scan your entire contact list.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                  <h4 className="font-semibold text-emerald-400 mb-2">✅ WhatsApp Connection Methods</h4>
                  <p className="text-sm mb-2">
                    <strong>QR Code Login (Recommended):</strong> Scan a QR code to connect WhatsApp Web. Your password is NEVER entered or stored.
                  </p>
                  <p className="text-sm">
                    <strong>Session Tokens:</strong> After QR code login, an encrypted session token is stored. This token is refreshed automatically and can be revoked at any time.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Lock className="w-6 h-6 text-primary" />
                How We Protect Your Data (Enterprise-Grade Security)
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">1. Military-Grade Encryption</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>AES-256-GCM:</strong> All sensitive data (OAuth tokens, session cookies, voice recordings) are encrypted at rest using AES-256-GCM, the same encryption used by governments and military organizations.</li>
                    <li><strong>TLS 1.3:</strong> All data in transit uses TLS 1.3 encryption (HTTPS) to prevent interception.</li>
                    <li><strong>Unique Encryption Keys:</strong> Each user has a unique encryption key. Even our administrators cannot decrypt your data without your key.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">2. Secure Infrastructure</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>SOC 2 Type II Certified:</strong> Hosted on Supabase (SOC 2 Type II certified) and Google Cloud Platform</li>
                    <li><strong>DDoS Protection:</strong> Cloudflare-powered DDoS mitigation and WAF (Web Application Firewall)</li>
                    <li><strong>Automated Backups:</strong> Daily encrypted backups with 30-day retention, stored in geographically distributed regions</li>
                    <li><strong>Intrusion Detection:</strong> Real-time monitoring for suspicious activity with automated alerting</li>
                    <li><strong>Penetration Testing:</strong> Quarterly security audits by third-party cybersecurity firms</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">3. Password & Credential Security</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Zero Password Storage:</strong> Instagram and WhatsApp passwords are NEVER stored. They are used only once during authentication to generate encrypted session tokens, then immediately discarded from memory.</li>
                    <li><strong>OAuth 2.0:</strong> Gmail and Google Calendar use OAuth 2.0 (industry-standard secure authorization)</li>
                    <li><strong>Session Tokens:</strong> Encrypted with AES-256-GCM and automatically rotated every 7 days</li>
                    <li><strong>Token Revocation:</strong> You can instantly revoke all access tokens from your dashboard</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">4. Access Controls</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Row-Level Security (RLS):</strong> Database policies ensure you can only access YOUR data, not other users' data</li>
                    <li><strong>Role-Based Access Control:</strong> Admin vs. user permissions strictly enforced</li>
                    <li><strong>Audit Logs:</strong> All data access is logged with timestamps and IP addresses for compliance</li>
                    <li><strong>2FA Support:</strong> Two-factor authentication available for account security</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Eye className="w-6 h-6 text-primary" />
                How We Use Your Data (Transparent Data Processing)
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p><strong>We use your information solely to provide and improve Audnix AI services:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Process and manage your account:</strong> Authentication, subscription management, billing</li>
                  <li><strong>Enable AI automation:</strong> Generate intelligent replies, detect buying intent, handle objections</li>
                  <li><strong>Deliver voice messages:</strong> Clone your voice and send personalized voice notes</li>
                  <li><strong>Provide customer support:</strong> Respond to your requests, troubleshoot issues</li>
                  <li><strong>Send service updates:</strong> Critical security notifications, feature announcements (opt-out available)</li>
                  <li><strong>Improve AI models:</strong> Anonymized conversation data to train better AI (opt-out available)</li>
                  <li><strong>Prevent fraud:</strong> Detect suspicious activity, enforce usage limits</li>
                </ul>
                <p className="font-semibold text-foreground mt-4">We NEVER:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>❌ Sell your personal data to third parties (guaranteed by contract)</li>
                  <li>❌ Share conversation content with advertisers or data brokers</li>
                  <li>❌ Use your leads for our own marketing purposes</li>
                  <li>❌ Train AI models on your private conversations without explicit consent</li>
                  <li>❌ Access your data for any reason other than providing the service</li>
                </ul>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-primary" />
                Your Rights (GDPR, CCPA, and Global Compliance)
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p><strong>You have complete control over your data under GDPR, CCPA, and other privacy laws:</strong></p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Right to Access:</strong> Request a complete copy of all data we store about you (delivered within 30 days)</li>
                  <li><strong>Right to Correction:</strong> Update or correct any inaccurate information in your account</li>
                  <li><strong>Right to Deletion:</strong> Request permanent deletion of your account and all associated data (completed within 7 days)</li>
                  <li><strong>Right to Portability:</strong> Export your data in CSV/JSON format for migration to another platform</li>
                  <li><strong>Right to Objection:</strong> Opt out of certain data processing activities (e.g., AI model training)</li>
                  <li><strong>Right to Restriction:</strong> Limit how we use your data (e.g., disable analytics)</li>
                  <li><strong>Right to Withdraw Consent:</strong> Disconnect any integration at any time without losing your account</li>
                </ul>
                <p className="mt-4">To exercise any of these rights, contact us at <strong className="text-primary">privacy@audnixai.com</strong> or use the data management tools in your dashboard.</p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6 text-primary" />
                Third-Party Services & Subprocessors
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p><strong>We integrate with trusted, enterprise-grade third-party services. Each has strict data processing agreements:</strong></p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Stripe (USA):</strong> Payment processing - PCI-DSS Level 1 compliant. We never store credit card details. Privacy: <a href="https://stripe.com/privacy" className="text-primary hover:underline" target="_blank">stripe.com/privacy</a></li>
                  <li><strong>OpenAI (USA):</strong> AI conversation generation - Zero data retention policy (conversations deleted after processing). Privacy: <a href="https://openai.com/privacy" className="text-primary hover:underline" target="_blank">openai.com/privacy</a></li>
                  <li><strong>ElevenLabs (USA):</strong> Voice cloning technology - Encrypted storage, GDPR compliant. Privacy: <a href="https://elevenlabs.io/privacy" className="text-primary hover:underline" target="_blank">elevenlabs.io/privacy</a></li>
                  <li><strong>Supabase (USA/EU):</strong> Database and authentication - SOC 2 Type II, ISO 27001. Privacy: <a href="https://supabase.com/privacy" className="text-primary hover:underline" target="_blank">supabase.com/privacy</a></li>
                  <li><strong>Meta/Instagram (USA):</strong> Official and unofficial Instagram API - Subject to Meta's privacy policies. Privacy: <a href="https://www.facebook.com/privacy/policy" className="text-primary hover:underline" target="_blank">facebook.com/privacy/policy</a></li>
                  <li><strong>WhatsApp (USA):</strong> Messaging via official WhatsApp Business API - End-to-end encrypted. Privacy: <a href="https://www.whatsapp.com/legal/privacy-policy" className="text-primary hover:underline" target="_blank">whatsapp.com/privacy-policy</a></li>
                  <li><strong>Google (USA):</strong> Gmail, Calendar, OAuth - GDPR compliant. Privacy: <a href="https://policies.google.com/privacy" className="text-primary hover:underline" target="_blank">google.com/privacy</a></li>
                </ul>
                <p className="mt-4 text-sm bg-primary/5 p-3 rounded-lg border border-primary/20">
                  <strong>Data Processing Agreements (DPAs):</strong> We have signed DPAs with all subprocessors to ensure GDPR compliance and data security standards.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">Data Retention & Deletion</h2>
              <div className="space-y-3 text-muted-foreground">
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Account data:</strong> Retained while your account is active + 90 days after deletion (for legal compliance)</li>
                  <li><strong>Voice recordings:</strong> Retained until you delete them or close your account (permanent deletion within 7 days)</li>
                  <li><strong>Conversation history:</strong> Retained for 12 months or until manual deletion (whichever comes first)</li>
                  <li><strong>OAuth tokens:</strong> Automatically refreshed or deleted after 90 days of inactivity</li>
                  <li><strong>Usage analytics:</strong> Anonymized and aggregated after 30 days, retained for 24 months for product improvement</li>
                  <li><strong>Billing records:</strong> Retained for 7 years (required by law for tax/accounting purposes)</li>
                  <li><strong>Audit logs:</strong> Retained for 1 year (for security and compliance)</li>
                </ul>
                <p className="mt-4 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/30">
                  <strong className="text-emerald-400">Guaranteed Deletion:</strong> When you delete your account, all personal data is permanently removed within 30 days. We send a confirmation email once deletion is complete.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">Children's Privacy</h2>
              <p className="text-muted-foreground">
                Audnix AI is not intended for users under 18 years of age. We do not knowingly collect information from children. 
                If you believe a child has provided us with personal information, please contact us immediately at <strong className="text-primary">privacy@audnixai.com</strong> 
                and we will delete the account within 24 hours.
              </p>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">International Data Transfers</h2>
              <div className="space-y-3 text-muted-foreground">
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

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">Data Breach Notification</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  In the unlikely event of a data breach that affects your personal information, we will:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Notify you via email within 72 hours of discovery</li>
                  <li>Report to relevant data protection authorities as required by law</li>
                  <li>Provide details of what data was affected and steps we're taking</li>
                  <li>Offer credit monitoring services if financial data was compromised</li>
                </ul>
                <p className="mt-2 text-sm">
                  <strong>Bug Bounty Program:</strong> We run a responsible disclosure program. Security researchers can report vulnerabilities at <strong>security@audnixai.com</strong>
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy periodically to reflect changes in our practices, technology, or legal requirements. 
                We will notify you of significant changes via email at least <strong>30 days before</strong> they take effect. 
                Your continued use of Audnix AI after changes constitutes acceptance of the updated policy.
              </p>
              <p className="text-muted-foreground mt-2">
                <strong>Version History:</strong> All previous versions are archived and available upon request.
              </p>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">Your Consent & Control</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  <strong>By using Audnix AI, you consent to this Privacy Policy.</strong> However, you can:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>✅ Disconnect any integration at any time (Settings → Integrations)</li>
                  <li>✅ Delete your voice recordings (Settings → Voice)</li>
                  <li>✅ Opt out of analytics and AI training (Settings → Privacy)</li>
                  <li>✅ Export your data (Settings → Data & Privacy → Export)</li>
                  <li>✅ Delete your account permanently (Settings → Account → Delete Account)</li>
                </ul>
                <p className="mt-4 text-sm bg-primary/5 p-3 rounded-lg border border-primary/20">
                  <strong>Granular Controls:</strong> Unlike most SaaS tools, we give you per-feature privacy controls. Turn off what you don't need.
                </p>
              </div>
            </Card>

            <Card className="p-8 bg-primary/5 border-primary/20">
              <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
              <p className="text-muted-foreground mb-4">
                If you have questions about this Privacy Policy, how we handle your data, or want to exercise your rights:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Privacy Inquiries:</strong> <a href="mailto:privacy@audnixai.com" className="text-primary hover:underline">privacy@audnixai.com</a></li>
                <li><strong>Data Protection Officer:</strong> <a href="mailto:dpo@audnixai.com" className="text-primary hover:underline">dpo@audnixai.com</a></li>
                <li><strong>Security Reports:</strong> <a href="mailto:security@audnixai.com" className="text-primary hover:underline">security@audnixai.com</a></li>
                <li><strong>General Support:</strong> <a href="mailto:support@audnixai.com" className="text-primary hover:underline">support@audnixai.com</a></li>
                <li><strong>Mailing Address:</strong> Audnix AI, Privacy Compliance Department, [Your Address]</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                <strong>Response Time:</strong> We respond to privacy requests within 48 hours (business days).
              </p>
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
