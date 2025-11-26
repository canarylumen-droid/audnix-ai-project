/**
 * Audnix AI - Reminder & Nurture Email Sequence
 * Multi-stage emails designed to drive adoption and conversions
 * Uses hello@audnixai.com for all reminders
 */

interface ReminderEmailOptions {
  userName: string;
  userEmail: string;
  trialDaysLeft?: number;
  leadsCount?: number;
}

/**
 * Day 1: Welcome Email - Set expectation and excitement
 */
export function generateWelcomeEmail(options: ReminderEmailOptions): { html: string; text: string } {
  const { userName, userEmail } = options;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f7f8fc;margin:0;padding:0;color:#0e0e0e}
.wrapper{max-width:600px;margin:0 auto;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.06);overflow:hidden}
.header{background:linear-gradient(135deg,#1B1F3A 0%,#2D3548 100%);padding:40px 24px;text-align:center}
.header h1{color:#fff;font-size:24px;font-weight:700;margin:0}
.tagline{color:#B4B8FF;font-size:13px;margin-top:6px;font-weight:500}
.content{padding:40px 24px}
h2{color:#1b1f3a;font-size:18px;font-weight:600;margin:0 0 16px 0}
p{margin:0 0 16px 0;font-size:14px;line-height:1.8;color:#4a5a7a}
strong{color:#1b1f3a;font-weight:600}
.highlight{background:#f0f4ff;padding:24px;border-left:4px solid #4a5bff;border-radius:4px;margin:24px 0}
.highlight p{margin:0;color:#1b1f3a}
.cta-button{display:inline-block;background:#4a5bff;color:white;padding:12px 28px;border-radius:4px;text-decoration:none;font-weight:600;font-size:13px;margin-top:24px}
.cta-button:hover{background:#3a4bee}
.footer{background:#fafbfc;padding:24px;text-align:center;border-top:1px solid #e5e7eb;font-size:12px;color:#7a8fa3}
.footer a{color:#4a5bff;text-decoration:none}
</style>
</head>
<body>
<div class="wrapper">
<div class="header">
<h1>Audnix AI</h1>
<p class="tagline">Your AI Sales Closer</p>
</div>
<div class="content">
<h2>Welcome, ${userName}! 🚀</h2>
<p>You're now part of a growing community of creators, coaches, and founders who are automating their sales.</p>

<div class="highlight">
<p><strong>Here's what happens next:</strong><br>
Your AI sales rep is now live and monitoring your leads. It's learning your voice, understanding your offers, and closing deals while you sleep.</p>
</div>

<p><strong>Your first 3 days are free.</strong> No credit card. No limits. Just results.</p>

<p>During your trial, your AI is:</p>
<p>✅ Following up with warm leads automatically<br>
✅ Handling objections with intelligent reframes<br>
✅ Booking calendar meetings in real-time<br>
✅ Learning what resonates with your audience</p>

<p style="margin-top:28px"><strong>Next step:</strong> Import your first batch of leads from WhatsApp, Email, or CSV. The AI will start closing within 2-8 minutes.</p>

<a href="https://audnixai.com/dashboard/lead-import" class="cta-button">Import Your First Leads</a>

<p style="margin-top:32px;font-size:13px;color:#7a8fa3">Questions? Reply to this email or check out our guides.</p>
</div>
<div class="footer">
<p>© 2025 Audnix AI. Your AI Sales Closer.</p>
</div>
</div>
</body>
</html>`;

  const text = `Welcome, ${userName}! 🚀

You're now part of a growing community of creators, coaches, and founders who are automating their sales.

Here's what happens next:
Your AI sales rep is now live and monitoring your leads. It's learning your voice, understanding your offers, and closing deals while you sleep.

Your first 3 days are free. No credit card. No limits. Just results.

During your trial, your AI is:
✅ Following up with warm leads automatically
✅ Handling objections with intelligent reframes
✅ Booking calendar meetings in real-time
✅ Learning what resonates with your audience

Next step: Import your first batch of leads from WhatsApp, Email, or CSV. The AI will start closing within 2-8 minutes.

→ Import Your First Leads: https://audnixai.com/dashboard/lead-import

Questions? Reply to this email or check out our guides.

© 2025 Audnix AI. Your AI Sales Closer.`;

  return { html, text };
}

/**
 * Day 2: Action Email - Inspire to import leads
 */
export function generateDay2ReminderEmail(options: ReminderEmailOptions): { html: string; text: string } {
  const { userName } = options;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f7f8fc;margin:0;padding:0;color:#0e0e0e}
.wrapper{max-width:600px;margin:0 auto;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.06);overflow:hidden}
.header{background:linear-gradient(135deg,#1B1F3A 0%,#2D3548 100%);padding:40px 24px;text-align:center}
.header h1{color:#fff;font-size:20px;font-weight:700;margin:0}
.tagline{color:#B4B8FF;font-size:12px;margin-top:6px}
.content{padding:40px 24px}
h2{color:#1b1f3a;font-size:18px;font-weight:600;margin:0 0 12px 0}
p{margin:0 0 16px 0;font-size:14px;line-height:1.8;color:#4a5a7a}
.stat-box{background:#f0f4ff;padding:20px;border-radius:4px;margin:20px 0;text-align:center;border-left:4px solid #4a5bff}
.stat-number{font-size:28px;font-weight:700;color:#1b1f3a}
.stat-label{font-size:12px;color:#4a5a7a;margin-top:4px}
.cta-button{display:inline-block;background:#4a5bff;color:white;padding:12px 28px;border-radius:4px;text-decoration:none;font-weight:600;font-size:13px;margin-top:20px}
.footer{background:#fafbfc;padding:24px;text-align:center;border-top:1px solid #e5e7eb;font-size:12px;color:#7a8fa3}
</style>
</head>
<body>
<div class="wrapper">
<div class="header">
<h1>Let's Get Your First Win, ${userName}</h1>
<p class="tagline">Your AI rep is ready to close</p>
</div>
<div class="content">
<p>Day 2 of your free trial — time to put your AI to work.</p>

<p>Here's what typically happens when you import leads:</p>

<div class="stat-box">
<div class="stat-number">2-8 min</div>
<div class="stat-label">First lead contacted automatically</div>
</div>

<div class="stat-box">
<div class="stat-number">40%+</div>
<div class="stat-label">Reply rate within first day</div>
</div>

<p><strong>The fastest path to your first sale:</strong></p>
<p>1. Import 10-20 of your hottest leads right now<br>
2. Watch your AI engage with them automatically<br>
3. See real conversations happening in your inbox<br>
4. Close your first deal</p>

<p style="font-weight:600;color:#1b1f3a">Ready? Import leads now and get your AI closing in the next 2 minutes.</p>

<a href="https://audnixai.com/dashboard/lead-import" class="cta-button">Import Leads Now</a>

<p style="margin-top:28px;font-size:13px">Your AI works 24/7 — even while you sleep. Results show up instantly in your dashboard.</p>
</div>
<div class="footer">
<p>© 2025 Audnix AI. Automate Revenue.</p>
</div>
</div>
</body>
</html>`;

  const text = `Let's Get Your First Win, ${userName}

Day 2 of your free trial — time to put your AI to work.

Here's what typically happens when you import leads:

First lead contacted automatically: 2-8 minutes
Reply rate within first day: 40%+

The fastest path to your first sale:
1. Import 10-20 of your hottest leads right now
2. Watch your AI engage with them automatically
3. See real conversations happening in your inbox
4. Close your first deal

Ready? Import leads now and get your AI closing in the next 2 minutes.

→ Import Leads Now: https://audnixai.com/dashboard/lead-import

Your AI works 24/7 — even while you sleep. Results show up instantly in your dashboard.

© 2025 Audnix AI. Automate Revenue.`;

  return { html, text };
}

/**
 * Day 3: Trial Ending - FOMO + Urgency to upgrade
 */
export function generateTrialExpiringEmail(options: ReminderEmailOptions): { html: string; text: string } {
  const { userName, leadsCount = 0 } = options;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f7f8fc;margin:0;padding:0;color:#0e0e0e}
.wrapper{max-width:600px;margin:0 auto;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.06);overflow:hidden}
.header{background:linear-gradient(135deg,#d4462f 0%,#c23e29 100%);padding:40px 24px;text-align:center}
.header h1{color:#fff;font-size:22px;font-weight:700;margin:0}
.content{padding:40px 24px}
h2{color:#d4462f;font-size:20px;font-weight:700;margin:0 0 16px 0}
p{margin:0 0 16px 0;font-size:14px;line-height:1.8;color:#4a5a7a}
.alert-box{background:#fef2f2;padding:24px;border-left:4px solid #d4462f;border-radius:4px;margin:24px 0}
.alert-box p{color:#7a1f1f;margin:0}
.alert-box strong{color:#7a1f1f}
.results{background:#f0f4ff;padding:20px;border-radius:4px;margin:20px 0}
.results p{margin:8px 0;font-size:13px}
.cta-button{display:inline-block;background:#d4462f;color:white;padding:14px 32px;border-radius:4px;text-decoration:none;font-weight:600;font-size:13px;margin-top:24px}
.cta-button:hover{background:#c23e29}
.features{font-size:13px;color:#4a5a7a;margin:20px 0}
.features li{margin:8px 0}
.footer{background:#fafbfc;padding:24px;text-align:center;border-top:1px solid #e5e7eb;font-size:12px;color:#7a8fa3}
</style>
</head>
<body>
<div class="wrapper">
<div class="header">
<h1>⏰ Your Free Trial Ends Today</h1>
</div>
<div class="content">
<h2>Keep Your AI Closing — Upgrade Now</h2>

<div class="alert-box">
<p><strong>Your 3-day free trial expires today at midnight.</strong> After that, your AI goes quiet and your leads start getting cold.</p>
</div>

<p>In just 3 days, your Audnix AI has:</p>
<div class="results">
<p>✅ Contacted ${leadsCount || 'your'} leads automatically</p>
<p>✅ Generated intelligent responses to objections</p>
<p>✅ Booked meetings in your calendar</p>
<p>✅ Started building momentum on your first sales</p>
</div>

<p><strong>Here's the problem:</strong> Once your trial ends, this all stops. Your leads don't wait. Your competitors don't sleep.</p>

<p style="font-size:15px;color:#1b1f3a;font-weight:600">Upgrade today and:</p>
<ul class="features">
<li>✓ Keep your AI closing 24/7 (never miss a lead again)</li>
<li>✓ Unlock unlimited lead imports</li>
<li>✓ Get real-time analytics on every conversation</li>
<li>✓ Scale to your team with multi-user access</li>
<li>✓ Lock in pro pricing today</li>
</ul>

<p style="margin-top:28px;color:#d4462f;font-weight:600">Pricing starts at $99/month. First month 50% off with code: CLOSING50</p>

<a href="https://audnixai.com/dashboard/pricing" class="cta-button">Upgrade & Keep Closing</a>

<p style="margin-top:24px;font-size:13px;color:#7a8fa3">Not ready? Your leads are cooling down. Every minute your AI isn't running, your competition is gaining ground.</p>
</div>
<div class="footer">
<p>© 2025 Audnix AI. Automate Revenue.</p>
</div>
</div>
</body>
</html>`;

  const text = `⏰ Your Free Trial Ends Today

Keep Your AI Closing — Upgrade Now

Your 3-day free trial expires today at midnight. After that, your AI goes quiet and your leads start getting cold.

In just 3 days, your Audnix AI has:
✅ Contacted ${leadsCount || 'your'} leads automatically
✅ Generated intelligent responses to objections
✅ Booked meetings in your calendar
✅ Started building momentum on your first sales

Here's the problem: Once your trial ends, this all stops. Your leads don't wait. Your competitors don't sleep.

Upgrade today and:
✓ Keep your AI closing 24/7 (never miss a lead again)
✓ Unlock unlimited lead imports
✓ Get real-time analytics on every conversation
✓ Scale to your team with multi-user access
✓ Lock in pro pricing today

Pricing starts at $99/month. First month 50% off with code: CLOSING50

→ Upgrade & Keep Closing: https://audnixai.com/dashboard/pricing

Not ready? Your leads are cooling down. Every minute your AI isn't running, your competition is gaining ground.

© 2025 Audnix AI. Automate Revenue.`;

  return { html, text };
}

/**
 * Post-Trial: Winback Email - "You Didn't Upgrade"
 */
export function generateWinbackEmail(options: ReminderEmailOptions): { html: string; text: string } {
  const { userName, leadsCount = 0 } = options;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f7f8fc;margin:0;padding:0;color:#0e0e0e}
.wrapper{max-width:600px;margin:0 auto;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.06);overflow:hidden}
.header{background:linear-gradient(135deg,#1B1F3A 0%,#2D3548 100%);padding:40px 24px;text-align:center}
.header h1{color:#fff;font-size:18px;font-weight:700;margin:0}
.content{padding:40px 24px}
h2{color:#1b1f3a;font-size:20px;font-weight:600;margin:0 0 16px 0}
p{margin:0 0 16px 0;font-size:14px;line-height:1.8;color:#4a5a7a}
.missed{background:#fef9e7;padding:20px;border-left:4px solid #f59e0b;border-radius:4px;margin:20px 0}
.missed p{margin:0;color:#7c5d1c}
.missed strong{color:#7c5d1c;font-weight:600}
.cta-button{display:inline-block;background:#4a5bff;color:white;padding:12px 28px;border-radius:4px;text-decoration:none;font-weight:600;font-size:13px;margin-top:24px}
.footer{background:#fafbfc;padding:24px;text-align:center;border-top:1px solid #e5e7eb;font-size:12px;color:#7a8fa3}
</style>
</head>
<body>
<div class="wrapper">
<div class="header">
<h1>Your Leads Are Getting Cold, ${userName}</h1>
</div>
<div class="content">
<h2>Wake Up Your Sales Engine</h2>

<p>You showed us what you're capable of during your trial. Your AI was closing deals, booking meetings, and converting cold leads into customers.</p>

<div class="missed">
<p><strong>Then you went silent.</strong> Since your trial ended, your ${leadsCount} leads have gone cold. They've already moved on to competitors. Every day you wait, that becomes harder to fix.</p>
</div>

<p><strong>The real cost of waiting:</strong></p>
<p>• Lost revenue from leads that would've converted<br>
• Your competitors are already using AI (are they winning?)<br>
• Twice as hard to re-engage leads after going quiet<br>
• Missing the momentum you had</p>

<p style="font-weight:600;color:#1b1f3a;margin-top:28px">Here's the truth: You need your AI running NOW.</p>

<p>For $99/month (50% off first month with code CLOSING50), your AI never stops. It reaches back out to cold leads, re-engages them with fresh angles, and closes the deals you're leaving on the table.</p>

<p style="font-size:13px;color:#7a8fa3">One customer using Audnix closed 3 deals in their first month — $12k in revenue. What's your number?</p>

<a href="https://audnixai.com/dashboard/pricing" class="cta-button">Reactivate & Recover Lost Leads</a>

<p style="margin-top:24px;font-size:12px;color:#7a8fa3">Your trial proved it works. Your leads proved they're interested. Now it's just about staying in the game.</p>
</div>
<div class="footer">
<p>© 2025 Audnix AI. Automate Revenue.</p>
</div>
</div>
</body>
</html>`;

  const text = `Your Leads Are Getting Cold, ${userName}

Wake Up Your Sales Engine

You showed us what you're capable of during your trial. Your AI was closing deals, booking meetings, and converting cold leads into customers.

Then you went silent. Since your trial ended, your ${leadsCount} leads have gone cold. They've already moved on to competitors. Every day you wait, that becomes harder to fix.

The real cost of waiting:
• Lost revenue from leads that would've converted
• Your competitors are already using AI (are they winning?)
• Twice as hard to re-engage leads after going quiet
• Missing the momentum you had

Here's the truth: You need your AI running NOW.

For $99/month (50% off first month with code CLOSING50), your AI never stops. It reaches back out to cold leads, re-engages them with fresh angles, and closes the deals you're leaving on the table.

One customer using Audnix closed 3 deals in their first month — $12k in revenue. What's your number?

→ Reactivate & Recover Lost Leads: https://audnixai.com/dashboard/pricing

Your trial proved it works. Your leads proved they're interested. Now it's just about staying in the game.

© 2025 Audnix AI. Automate Revenue.`;

  return { html, text };
}
