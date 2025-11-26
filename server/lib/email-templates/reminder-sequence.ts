/**
 * Audnix AI - Reminder & Nurture Email Sequence (V2.9.1)
 * All emails with branded CTA buttons matching brand colors
 * Electric Blue (#4A5BFF) for primary CTAs
 */

interface ReminderEmailOptions {
  userName: string;
  userEmail: string;
  leadsCount?: number;
}

const BRAND_PRIMARY = '#4A5BFF';    // Electric Blue
const BRAND_DARK = '#1B1F3A';       // Dark Navy

/**
 * +4 Hours: "It's Live" - Immediately push to import
 */
export function generateItsLiveEmail(options: ReminderEmailOptions): { html: string; text: string } {
  const { userName } = options;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f7f8fc;margin:0;padding:0}
.wrapper{max-width:600px;margin:0 auto;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.06);overflow:hidden}
.header{background:linear-gradient(135deg,${BRAND_DARK} 0%,#2D3548 100%);padding:40px 24px;text-align:center}
.header h1{color:#fff;font-size:24px;font-weight:700;margin:0}
.content{padding:40px 24px}
h2{color:${BRAND_DARK};font-size:18px;font-weight:600;margin:0 0 12px 0}
p{margin:0 0 16px 0;font-size:14px;line-height:1.8;color:#4a5a7a}
.highlight{background:#f0f4ff;padding:24px;border-left:4px solid ${BRAND_PRIMARY};border-radius:4px;margin:24px 0}
.cta-button{display:inline-block;background:${BRAND_PRIMARY};color:white;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;margin-top:24px;border:none;cursor:pointer;transition:background 0.2s}
.cta-button:hover{background:#3a4bee}
.footer{background:#fafbfc;padding:24px;text-align:center;border-top:1px solid #e5e7eb;font-size:12px;color:#7a8fa3}
</style>
</head>
<body>
<div class="wrapper">
<div class="header">
<h1>🚀 It's Finally Live</h1>
</div>
<div class="content">
<h2>${userName}, Your AI is Ready to Close Deals</h2>

<p>Your Audnix AI sales rep is now live and monitoring your account. It's time to put it to work.</p>

<div class="highlight">
<p><strong>The fastest way to your first win:</strong> Import leads right now. Your AI will contact them within 2-8 minutes.</p>
</div>

<p>In the next 3 minutes:</p>
<p>1. Go to your dashboard<br>
2. Import 10-20 of your hottest leads<br>
3. Watch your AI start closing</p>

<table cellpadding="0" cellspacing="0" style="margin-top:24px"><tr><td><a href="https://audnixai.com/dashboard/lead-import" class="cta-button">Import Leads Now →</a></td></tr></table>

<p style="margin-top:24px;font-size:13px;color:#7a8fa3">Your 3-day free trial is live. No credit card needed.</p>
</div>
<div class="footer">
<p>© 2025 Audnix AI. Your AI Sales Closer.</p>
</div>
</div>
</body>
</html>`;

  const text = `🚀 It's Finally Live

${userName}, Your AI is Ready to Close Deals

Your Audnix AI sales rep is now live and monitoring your account. It's time to put it to work.

The fastest way to your first win: Import leads right now. Your AI will contact them within 2-8 minutes.

In the next 3 minutes:
1. Go to your dashboard
2. Import 10-20 of your hottest leads
3. Watch your AI start closing

→ Import Leads Now: https://audnixai.com/dashboard/lead-import

Your 3-day free trial is live. No credit card needed.

© 2025 Audnix AI. Your AI Sales Closer.`;

  return { html, text };
}

/**
 * +50-69 Hours: Day 2 - Just checking in with social proof
 */
export function generateDay2CheckInEmail(options: ReminderEmailOptions): { html: string; text: string } {
  const { userName } = options;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f7f8fc;margin:0;padding:0}
.wrapper{max-width:600px;margin:0 auto;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.06);overflow:hidden}
.header{background:linear-gradient(135deg,${BRAND_DARK} 0%,#2D3548 100%);padding:40px 24px;text-align:center}
.header h1{color:#fff;font-size:20px;font-weight:700;margin:0}
.content{padding:40px 24px}
h2{color:${BRAND_DARK};font-size:18px;font-weight:600;margin:0 0 12px 0}
p{margin:0 0 16px 0;font-size:14px;line-height:1.8;color:#4a5a7a}
.proof{background:#f0f4ff;padding:20px;border-left:4px solid ${BRAND_PRIMARY};border-radius:4px;margin:20px 0;font-size:13px}
.cta-button{display:inline-block;background:${BRAND_PRIMARY};color:white;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;margin-top:24px;border:none;cursor:pointer}
.cta-button:hover{background:#3a4bee}
.footer{background:#fafbfc;padding:24px;text-align:center;border-top:1px solid #e5e7eb;font-size:12px;color:#7a8fa3}
</style>
</head>
<body>
<div class="wrapper">
<div class="header">
<h1>Just Checking In, ${userName}</h1>
</div>
<div class="content">
<p>Day 2 of your free trial — your AI is warming up leads right now.</p>

<div class="proof">
<p><strong>Here's what's happening:</strong><br>
Your leads are receiving personalized messages. Your AI is analyzing responses and planning follow-ups. Smart objection handling is already in motion.</p>
</div>

<p>Every minute your AI runs, it learns more about what resonates with your audience. The longer you leave it running, the better it gets.</p>

<p><strong>Haven't imported leads yet?</strong> Do it now. Your AI works best with real data.</p>

<table cellpadding="0" cellspacing="0" style="margin-top:24px"><tr><td><a href="https://audnixai.com/dashboard/lead-import" class="cta-button">Import Your Leads →</a></td></tr></table>

<p style="margin-top:24px;font-size:13px;color:#7a8fa3">Your leads are getting warmed up. Let your AI do the heavy lifting.</p>
</div>
<div class="footer">
<p>© 2025 Audnix AI. Automate Revenue.</p>
</div>
</div>
</body>
</html>`;

  const text = `Just Checking In, ${userName}

Day 2 of your free trial — your AI is warming up leads right now.

Here's what's happening:
Your leads are receiving personalized messages. Your AI is analyzing responses and planning follow-ups. Smart objection handling is already in motion.

Every minute your AI runs, it learns more about what resonates with your audience. The longer you leave it running, the better it gets.

Haven't imported leads yet? Do it now. Your AI works best with real data.

→ Import Your Leads: https://audnixai.com/dashboard/lead-import

Your leads are getting warmed up. Let your AI do the heavy lifting.

© 2025 Audnix AI. Automate Revenue.`;

  return { html, text };
}

/**
 * +50-69 Hours (Evening): Reminder trial ends tomorrow
 */
export function generateTrialEndsThermorrow(options: ReminderEmailOptions): { html: string; text: string } {
  const { userName } = options;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f7f8fc;margin:0;padding:0}
.wrapper{max-width:600px;margin:0 auto;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.06);overflow:hidden}
.header{background:linear-gradient(135deg,#d4462f 0%,#c23e29 100%);padding:40px 24px;text-align:center}
.header h1{color:#fff;font-size:20px;font-weight:700;margin:0}
.content{padding:40px 24px}
h2{color:#d4462f;font-size:18px;font-weight:600;margin:0 0 12px 0}
p{margin:0 0 16px 0;font-size:14px;line-height:1.8;color:#4a5a7a}
.alert{background:#fef2f2;padding:20px;border-left:4px solid #d4462f;border-radius:4px;margin:20px 0}
.alert p{color:#7a1f1f;margin:0}
.cta-button{display:inline-block;background:#d4462f;color:white;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;margin-top:24px;border:none;cursor:pointer}
.cta-button:hover{background:#c23e29}
.footer{background:#fafbfc;padding:24px;text-align:center;border-top:1px solid #e5e7eb;font-size:12px;color:#7a8fa3}
</style>
</head>
<body>
<div class="wrapper">
<div class="header">
<h1>⏰ Your Trial Ends Tomorrow</h1>
</div>
<div class="content">
<h2>Don't Let Your Momentum Stop</h2>

<p>You've got less than 24 hours left on your free trial. Tomorrow at midnight, your AI goes quiet.</p>

<div class="alert">
<p><strong>Here's what stops:</strong> No more lead contacts. No more objection handling. No more automatic follow-ups. The deals you could close? Gone.</p>
</div>

<p>Your competitors don't take breaks. Their AI never stops. Neither should yours.</p>

<p><strong>Upgrade today to keep closing.</strong> First month is 50% off with code CLOSING50</p>

<table cellpadding="0" cellspacing="0" style="margin-top:24px"><tr><td><a href="https://audnixai.com/dashboard/pricing" class="cta-button">Upgrade Now - Lock in Pro Pricing →</a></td></tr></table>

<p style="margin-top:24px;font-size:13px;color:#7a8fa3">Tomorrow night you'll either be closing deals or watching leads go cold. Your choice.</p>
</div>
<div class="footer">
<p>© 2025 Audnix AI. Automate Revenue.</p>
</div>
</div>
</body>
</html>`;

  const text = `⏰ Your Trial Ends Tomorrow

Don't Let Your Momentum Stop

You've got less than 24 hours left on your free trial. Tomorrow at midnight, your AI goes quiet.

Here's what stops: No more lead contacts. No more objection handling. No more automatic follow-ups. The deals you could close? Gone.

Your competitors don't take breaks. Their AI never stops. Neither should yours.

Upgrade today to keep closing. First month is 50% off with code CLOSING50

→ Upgrade Now - Lock in Pro Pricing: https://audnixai.com/dashboard/pricing

Tomorrow night you'll either be closing deals or watching leads go cold. Your choice.

© 2025 Audnix AI. Automate Revenue.`;

  return { html, text };
}

/**
 * +72 Hours: Trial ends today - Final urgency
 */
export function generateTrialEndsToday(options: ReminderEmailOptions): { html: string; text: string } {
  const { userName } = options;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f7f8fc;margin:0;padding:0}
.wrapper{max-width:600px;margin:0 auto;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.06);overflow:hidden}
.header{background:linear-gradient(135deg,#7c3f1f 0%,#6b3a1c 100%);padding:40px 24px;text-align:center}
.header h1{color:#fff;font-size:20px;font-weight:700;margin:0}
.content{padding:40px 24px}
h2{color:#7c3f1f;font-size:18px;font-weight:600;margin:0 0 12px 0}
p{margin:0 0 16px 0;font-size:14px;line-height:1.8;color:#4a5a7a}
.final-alert{background:#faf4f0;padding:20px;border-left:4px solid #7c3f1f;border-radius:4px;margin:20px 0}
.final-alert p{color:#6b3a1c;margin:0}
.cta-button{display:inline-block;background:#7c3f1f;color:white;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;margin-top:24px;border:none;cursor:pointer}
.cta-button:hover{background:#6b3a1c}
.footer{background:#fafbfc;padding:24px;text-align:center;border-top:1px solid #e5e7eb;font-size:12px;color:#7a8fa3}
</style>
</head>
<body>
<div class="wrapper">
<div class="header">
<h1>Your Free Trial Ends Today</h1>
</div>
<div class="content">
<h2>The Clock is Ticking</h2>

<p>This is it, ${userName}. Your 3-day free trial expires tonight at midnight.</p>

<div class="final-alert">
<p><strong>After midnight:</strong> You've exhausted your free trial. Your AI turns off. Your leads go cold. Your momentum dies.</p>
</div>

<p>Everything you built over the last 3 days? It stops. The relationships with leads? Lost. The deals you could close? Gone to competitors.</p>

<p><strong>You have hours left.</strong> Upgrade now and keep your AI running 24/7. First month 50% off with code CLOSING50</p>

<table cellpadding="0" cellspacing="0" style="margin-top:24px"><tr><td><a href="https://audnixai.com/dashboard/pricing" class="cta-button">Upgrade Before Midnight →</a></td></tr></table>

<p style="margin-top:24px;font-size:13px;color:#7a8fa3;font-weight:600">After tonight, it gets harder to re-engage cold leads. Don't lose what you've started.</p>
</div>
<div class="footer">
<p>© 2025 Audnix AI. Automate Revenue.</p>
</div>
</div>
</body>
</html>`;

  const text = `Your Free Trial Ends Today

The Clock is Ticking

This is it, ${userName}. Your 3-day free trial expires tonight at midnight.

After midnight: You've exhausted your free trial. Your AI turns off. Your leads go cold. Your momentum dies.

Everything you built over the last 3 days? It stops. The relationships with leads? Lost. The deals you could close? Gone to competitors.

You have hours left. Upgrade now and keep your AI running 24/7. First month 50% off with code CLOSING50

→ Upgrade Before Midnight: https://audnixai.com/dashboard/pricing

After tonight, it gets harder to re-engage cold leads. Don't lose what you've started.

© 2025 Audnix AI. Automate Revenue.`;

  return { html, text };
}

/**
 * No Activity Reminder: "Come back and close deals"
 */
export function generateNoActivityReminder(options: ReminderEmailOptions): { html: string; text: string } {
  const { userName } = options;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f7f8fc;margin:0;padding:0}
.wrapper{max-width:600px;margin:0 auto;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.06);overflow:hidden}
.header{background:linear-gradient(135deg,${BRAND_DARK} 0%,#2D3548 100%);padding:40px 24px;text-align:center}
.header h1{color:#fff;font-size:18px;font-weight:700;margin:0}
.content{padding:40px 24px}
h2{color:${BRAND_DARK};font-size:18px;font-weight:600;margin:0 0 12px 0}
p{margin:0 0 16px 0;font-size:14px;line-height:1.8;color:#4a5a7a}
.cta-button{display:inline-block;background:${BRAND_PRIMARY};color:white;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;margin-top:24px;border:none;cursor:pointer}
.cta-button:hover{background:#3a4bee}
.footer{background:#fafbfc;padding:24px;text-align:center;border-top:1px solid #e5e7eb;font-size:12px;color:#7a8fa3}
</style>
</head>
<body>
<div class="wrapper">
<div class="header">
<h1>You Haven't Missed Anything</h1>
</div>
<div class="content">
<h2>But Your Leads Are Waiting</h2>

<p>Hi ${userName}, we noticed you haven't been using Audnix AI lately.</p>

<p>Your leads are still there. Your AI is ready to close them. But it needs you to start it.</p>

<p><strong>3 steps to your first deal:</strong></p>
<p>1. Log back in<br>
2. Import your leads<br>
3. Let your AI close</p>

<table cellpadding="0" cellspacing="0" style="margin-top:24px"><tr><td><a href="https://audnixai.com/dashboard" class="cta-button">Come Close Some Deals →</a></td></tr></table>

<p style="margin-top:24px;font-size:13px;color:#7a8fa3">Your AI is waiting. Your leads are waiting. You deserve this win.</p>
</div>
<div class="footer">
<p>© 2025 Audnix AI. Automate Revenue.</p>
</div>
</div>
</body>
</html>`;

  const text = `You Haven't Missed Anything

But Your Leads Are Waiting

Hi ${userName}, we noticed you haven't been using Audnix AI lately.

Your leads are still there. Your AI is ready to close them. But it needs you to start it.

3 steps to your first deal:
1. Log back in
2. Import your leads
3. Let your AI close

→ Come Close Some Deals: https://audnixai.com/dashboard

Your AI is waiting. Your leads are waiting. You deserve this win.

© 2025 Audnix AI. Automate Revenue.`;

  return { html, text };
}
