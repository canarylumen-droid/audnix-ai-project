/**
 * Audnix AI - Billing & Transactional Emails
 * Sent from billing@audnixai.com immediately after payment/upgrade
 * All with branded CTA buttons (#4A5BFF + #1B1F3A)
 */

const BRAND_PRIMARY = '#4A5BFF';    // Electric Blue
const BRAND_DARK = '#1B1F3A';       // Dark Navy
const BRAND_SUCCESS = '#10b981';    // Success Green

interface BillingEmailOptions {
  userName: string;
  userEmail: string;
  planName: string;
  amount: number;
  invoiceId: string;
  renewalDate: string;
}

/**
 * Payment Confirmation Email - Immediate delivery after purchase
 */
export function generatePaymentConfirmationEmail(options: BillingEmailOptions): { html: string; text: string } {
  const { userName, planName, amount, invoiceId, renewalDate } = options;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f7f8fc;margin:0;padding:0}
.wrapper{max-width:600px;margin:0 auto;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.06);overflow:hidden}
.header{background:linear-gradient(135deg,${BRAND_DARK} 0%,#2D3548 100%);padding:40px 24px;text-align:center}
.header h1{color:#fff;font-size:20px;font-weight:700;margin:0}
.subheader{color:#B4B8FF;font-size:13px;margin-top:8px}
.content{padding:40px 24px}
h2{color:${BRAND_DARK};font-size:18px;font-weight:600;margin:0 0 16px 0}
p{margin:0 0 16px 0;font-size:14px;line-height:1.8;color:#4a5a7a}
.invoice-box{background:#f7f8fc;padding:24px;border-radius:4px;margin:24px 0;border-left:4px solid ${BRAND_SUCCESS}}
.invoice-row{display:flex;justify-content:space-between;margin:12px 0;font-size:14px}
.invoice-label{color:#4a5a7a;font-weight:500}
.invoice-value{color:${BRAND_DARK};font-weight:600}
.invoice-total{border-top:2px solid #e5e7eb;padding-top:12px;margin-top:12px}
.success-badge{display:inline-block;background:#d1fae5;color:#065f46;padding:8px 12px;border-radius:4px;font-size:12px;font-weight:600;margin-bottom:24px}
.cta-button{display:inline-block;background:${BRAND_PRIMARY};color:white;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;margin-top:24px;border:none;cursor:pointer}
.cta-button:hover{background:#3a4bee}
.footer{background:#fafbfc;padding:24px;text-align:center;border-top:1px solid #e5e7eb;font-size:12px;color:#7a8fa3}
.footer a{color:${BRAND_PRIMARY};text-decoration:none}
</style>
</head>
<body>
<div class="wrapper">
<div class="header">
<h1>Payment Confirmed</h1>
<p class="subheader">Your AI Sales Closer is now fully active</p>
</div>
<div class="content">
<div class="success-badge">✅ PAYMENT RECEIVED</div>

<h2>Welcome to ${planName}, ${userName}</h2>

<p>Your payment has been processed successfully. Your ${planName} plan is now active and your AI sales rep is closing deals right now.</p>

<div class="invoice-box">
<div class="invoice-row">
<span class="invoice-label">Plan</span>
<span class="invoice-value">${planName}</span>
</div>
<div class="invoice-row">
<span class="invoice-label">Amount Charged</span>
<span class="invoice-value">$${amount}</span>
</div>
<div class="invoice-row">
<span class="invoice-label">Invoice #</span>
<span class="invoice-value">${invoiceId}</span>
</div>
<div class="invoice-row">
<span class="invoice-label">Next Renewal</span>
<span class="invoice-value">${renewalDate}</span>
</div>
<div class="invoice-row invoice-total">
<span class="invoice-label">Status</span>
<span class="invoice-value" style="color:${BRAND_SUCCESS}">Active ✓</span>
</div>
</div>

<p><strong>What's now unlocked:</strong></p>
<p>✅ Unlimited lead imports from WhatsApp, Email, CSV<br>
✅ 24/7 AI closing and objection handling<br>
✅ Real-time meeting booking<br>
✅ Advanced analytics dashboard<br>
✅ Priority support</p>

<p style="margin-top:24px">Your AI is already working. Check your dashboard to see conversations happening in real-time.</p>

<table cellpadding="0" cellspacing="0" style="margin-top:24px"><tr><td><a href="https://audnixai.com/dashboard" class="cta-button">View Your Dashboard →</a></td></tr></table>

<p style="margin-top:28px;font-size:13px;color:#7a8fa3">Need help? Contact our support team or reply to this email.</p>
</div>
<div class="footer">
<p><a href="https://audnixai.com/support">Support</a> • <a href="https://audnixai.com/privacy">Privacy</a> • <a href="https://audnixai.com/billing">Manage Subscription</a></p>
<p>© 2025 Audnix AI. Automate Revenue.</p>
</div>
</div>
</body>
</html>`;

  const text = `Payment Confirmed
Your AI Sales Closer is now fully active

✅ PAYMENT RECEIVED

Welcome to ${planName}, ${userName}

Your payment has been processed successfully. Your ${planName} plan is now active and your AI sales rep is closing deals right now.

INVOICE DETAILS:
Plan: ${planName}
Amount Charged: $${amount}
Invoice #: ${invoiceId}
Next Renewal: ${renewalDate}
Status: Active ✓

What's now unlocked:
✅ Unlimited lead imports from WhatsApp, Email, CSV
✅ 24/7 AI closing and objection handling
✅ Real-time meeting booking
✅ Advanced analytics dashboard
✅ Priority support

Your AI is already working. Check your dashboard to see conversations happening in real-time.

→ View Your Dashboard: https://audnixai.com/dashboard

Need help? Contact our support team or reply to this email.

Support: https://audnixai.com/support
Privacy: https://audnixai.com/privacy
Manage Subscription: https://audnixai.com/billing

© 2025 Audnix AI. Automate Revenue.`;

  return { html, text };
}

/**
 * Invoice Email - Recurring billing cycle
 */
export function generateInvoiceEmail(options: BillingEmailOptions): { html: string; text: string } {
  const { userName, planName, amount, invoiceId, renewalDate } = options;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f7f8fc;margin:0;padding:0}
.wrapper{max-width:600px;margin:0 auto;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.06);overflow:hidden}
.header{background:linear-gradient(135deg,${BRAND_DARK} 0%,#2D3548 100%);padding:32px 24px;text-align:center}
.header h1{color:#fff;font-size:18px;font-weight:700;margin:0}
.content{padding:32px 24px}
h2{color:${BRAND_DARK};font-size:16px;font-weight:600;margin:0 0 12px 0}
p{margin:0 0 12px 0;font-size:13px;line-height:1.6;color:#4a5a7a}
.invoice-box{background:#f7f8fc;padding:16px;border-radius:4px;margin:16px 0;border-left:4px solid ${BRAND_PRIMARY}}
.invoice-row{display:flex;justify-content:space-between;font-size:13px;margin:8px 0}
.invoice-label{color:#4a5a7a;font-weight:500}
.invoice-value{color:${BRAND_DARK};font-weight:600}
.cta-button{display:inline-block;background:${BRAND_PRIMARY};color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:13px;margin-top:16px;border:none;cursor:pointer}
.cta-button:hover{background:#3a4bee}
.footer{text-align:center;border-top:1px solid #e5e7eb;padding-top:16px;font-size:11px;color:#7a8fa3}
.footer a{color:${BRAND_PRIMARY};text-decoration:none}
</style>
</head>
<body>
<div class="wrapper">
<div class="header">
<h1>Your Invoice - ${planName}</h1>
</div>
<div class="content">
<h2>Hi ${userName},</h2>
<p>Your monthly invoice for Audnix AI is ready. Your ${planName} plan continues to close deals 24/7.</p>

<div class="invoice-box">
<div class="invoice-row">
<span class="invoice-label">Plan</span>
<span class="invoice-value">${planName}</span>
</div>
<div class="invoice-row">
<span class="invoice-label">Amount</span>
<span class="invoice-value">$${amount}</span>
</div>
<div class="invoice-row">
<span class="invoice-label">Invoice #</span>
<span class="invoice-value">${invoiceId}</span>
</div>
<div class="invoice-row">
<span class="invoice-label">Next Billing Date</span>
<span class="invoice-value">${renewalDate}</span>
</div>
</div>

<p>Your AI continues running, your leads continue closing. Thank you for trusting Audnix AI.</p>

<table cellpadding="0" cellspacing="0" style="margin-top:16px"><tr><td><a href="https://audnixai.com/dashboard/billing" class="cta-button">View Invoice Details →</a></td></tr></table>

<p style="margin-top:16px;font-size:12px;color:#7a8fa3">Questions about this charge? <a href="https://audnixai.com/support" style="color:${BRAND_PRIMARY};text-decoration:none">Contact support</a></p>

<div class="footer">
<p><a href="https://audnixai.com/support">Support</a> • <a href="https://audnixai.com/privacy">Privacy</a> • <a href="https://audnixai.com/billing">Manage Subscription</a></p>
<p>© 2025 Audnix AI</p>
</div>
</div>
</body>
</html>`;

  const text = `Your Invoice - ${planName}

Hi ${userName},

Your monthly invoice for Audnix AI is ready. Your ${planName} plan continues to close deals 24/7.

INVOICE DETAILS:
Plan: ${planName}
Amount: $${amount}
Invoice #: ${invoiceId}
Next Billing Date: ${renewalDate}

Your AI continues running, your leads continue closing. Thank you for trusting Audnix AI.

→ View Invoice Details: https://audnixai.com/dashboard/billing

Questions about this charge? Contact support: https://audnixai.com/support

Support: https://audnixai.com/support
Privacy: https://audnixai.com/privacy
Manage Subscription: https://audnixai.com/billing

© 2025 Audnix AI`;

  return { html, text };
}
