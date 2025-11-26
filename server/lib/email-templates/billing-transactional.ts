/**
 * Audnix AI - Billing & Transactional Emails
 * Sent from billing@audnixai.com immediately after payment/upgrade
 * Clean, professional, trust-building
 */

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
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f7f8fc;margin:0;padding:0;color:#0e0e0e}
.wrapper{max-width:600px;margin:0 auto;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.06);overflow:hidden}
.header{background:linear-gradient(135deg,#1B1F3A 0%,#2D3548 100%);padding:40px 24px;text-align:center}
.header h1{color:#fff;font-size:20px;font-weight:700;margin:0}
.subheader{color:#B4B8FF;font-size:13px;margin-top:8px}
.content{padding:40px 24px}
h2{color:#1b1f3a;font-size:18px;font-weight:600;margin:0 0 16px 0}
p{margin:0 0 16px 0;font-size:14px;line-height:1.8;color:#4a5a7a}
.invoice-box{background:#f7f8fc;padding:24px;border-radius:4px;margin:24px 0;border-left:4px solid #10b981}
.invoice-row{display:flex;justify-content:space-between;margin:12px 0;font-size:14px}
.invoice-label{color:#4a5a7a;font-weight:500}
.invoice-value{color:#1b1f3a;font-weight:600}
.invoice-total{border-top:2px solid #e5e7eb;padding-top:12px;margin-top:12px}
.success-badge{display:inline-block;background:#d1fae5;color:#065f46;padding:8px 12px;border-radius:4px;font-size:12px;font-weight:600;margin-bottom:24px}
.cta-button{display:inline-block;background:#4a5bff;color:white;padding:12px 28px;border-radius:4px;text-decoration:none;font-weight:600;font-size:13px;margin-top:24px}
.footer{background:#fafbfc;padding:24px;text-align:center;border-top:1px solid #e5e7eb;font-size:12px;color:#7a8fa3}
.footer a{color:#4a5bff;text-decoration:none}
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
<span class="invoice-value" style="color:#10b981">Active ✓</span>
</div>
</div>

<p><strong>What's now unlocked:</strong></p>
<p>✅ Unlimited lead imports from WhatsApp, Email, CSV<br>
✅ 24/7 AI closing and objection handling<br>
✅ Real-time meeting booking<br>
✅ Advanced analytics dashboard<br>
✅ Priority support</p>

<p style="margin-top:24px">Your AI is already working. Check your dashboard to see conversations happening in real-time.</p>

<a href="https://audnixai.com/dashboard" class="cta-button">View Your Dashboard</a>

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
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f7f8fc;margin:0;padding:0}
.wrapper{max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden}
.content{padding:32px 24px}
h2{color:#1b1f3a;font-size:16px;font-weight:600;margin:0 0 12px 0}
p{margin:0 0 12px 0;font-size:13px;line-height:1.6;color:#4a5a7a}
.invoice-box{background:#f7f8fc;padding:16px;border-radius:4px;margin:16px 0}
.invoice-row{display:flex;justify-content:space-between;font-size:13px;margin:8px 0}
.footer{text-align:center;border-top:1px solid #e5e7eb;padding-top:16px;font-size:11px;color:#7a8fa3}
</style>
</head>
<body>
<div class="wrapper">
<div class="content">
<h2>Your ${planName} Invoice for This Month</h2>
<p>Hi ${userName},</p>
<p>Your recurring charge has been processed. Below is your invoice.</p>

<div class="invoice-box">
<div class="invoice-row">
<span>Plan</span>
<span style="font-weight:600;color:#1b1f3a">${planName}</span>
</div>
<div class="invoice-row">
<span>Amount</span>
<span style="font-weight:600;color:#1b1f3a">$${amount}</span>
</div>
<div class="invoice-row">
<span>Invoice #</span>
<span style="font-weight:600;color:#1b1f3a">${invoiceId}</span>
</div>
<div class="invoice-row">
<span>Next Billing Date</span>
<span style="font-weight:600;color:#1b1f3a">${renewalDate}</span>
</div>
</div>

<p>Your AI is closing deals. Your subscription is active and working 24/7.</p>
<p style="font-size:12px;color:#7a8fa3">Questions about this charge? <a href="https://audnixai.com/support" style="color:#4a5bff;text-decoration:none">Contact support</a></p>

<div class="footer">
<p>© 2025 Audnix AI</p>
</div>
</div>
</body>
</html>`;

  const text = `Your ${planName} Invoice for This Month

Hi ${userName},

Your recurring charge has been processed. Below is your invoice.

INVOICE DETAILS:
Plan: ${planName}
Amount: $${amount}
Invoice #: ${invoiceId}
Next Billing Date: ${renewalDate}

Your AI is closing deals. Your subscription is active and working 24/7.

Questions about this charge? Contact support: https://audnixai.com/support

© 2025 Audnix AI`;

  return { html, text };
}
