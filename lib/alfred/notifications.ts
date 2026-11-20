// Emails of the manual KYC relay. Alfred exposes no API to mint its hosted
// verification link, so a human sits in the loop:
//
//   1. a user opens an Alfred account  → the operators get an alert
//   2. an operator copies the link from Alfred's dashboard into our console
//   3. the user gets the link by email (and in the withdrawal panel)
//
// Server-only.

import { escapeHtml, sendEmail } from '@/lib/email';

/** Operators alerted when a new customer awaits its verification link. */
const ADMIN_EMAIL = () => process.env.ALFRED_ADMIN_EMAIL || 'contact@bim.finance';

const SITE_URL = () =>
  (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXTAUTH_URL ?? 'https://tokeshare.co').replace(/\/$/, '');

const ALFRED_DASHBOARD_URL = 'https://dashboard.alfredpay.io';

interface CustomerRef {
  network: string;
  address: string;
  corridor: string;
  customerId: string;
  email: string;
}

const layout = (body: string) => `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f6f7f9;font-family:Arial,Helvetica,sans-serif;color:#1f2937">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px">${body}</div>
</body></html>`;

const row = (label: string, value: string) =>
  `<tr><td style="padding:4px 12px 4px 0;color:#6b7280;white-space:nowrap">${escapeHtml(label)}</td>` +
  `<td style="padding:4px 0;font-family:monospace;word-break:break-all">${escapeHtml(value)}</td></tr>`;

const button = (href: string, label: string) =>
  `<a href="${escapeHtml(href)}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;` +
  `padding:12px 20px;border-radius:8px;font-weight:bold">${escapeHtml(label)}</a>`;

/** Step 1 — tells the operators a customer is waiting for its link. */
export async function sendAdminNewCustomerAlert(customer: CustomerRef): Promise<void> {
  const consoleUrl = `${SITE_URL()}/dashboard`;
  const fields: [string, string][] = [
    ['User email', customer.email],
    ['Alfred customer ID', customer.customerId],
    ['Corridor', customer.corridor],
    ['Stellar network', customer.network],
    ['Wallet', customer.address],
  ];

  await sendEmail({
    to: ADMIN_EMAIL(),
    subject: `Alfred — verification link needed for ${customer.email}`,
    html: layout(`
      <h2 style="margin:0 0 12px">New Alfred withdrawal account</h2>
      <p>A user started an Alfred withdrawal account and is waiting for their identity verification link.</p>
      <table style="border-collapse:collapse;font-size:14px;margin:16px 0">${fields.map(([l, v]) => row(l, v)).join('')}</table>
      <ol style="padding-left:20px;line-height:1.6">
        <li>Open <a href="${ALFRED_DASHBOARD_URL}">Alfred's dashboard</a> → Customers, and find the customer ID above.</li>
        <li>Copy the verification link shown there.</li>
        <li>Paste it in the Tokeshare console: the user receives it by email automatically.</li>
      </ol>
      <p style="margin-top:20px">${button(consoleUrl, 'Open the Tokeshare console')}</p>`),
    text: [
      'A user started an Alfred withdrawal account and is waiting for their identity verification link.',
      '',
      ...fields.map(([l, v]) => `${l}: ${v}`),
      '',
      `1. Open ${ALFRED_DASHBOARD_URL} → Customers, and find the customer ID above.`,
      '2. Copy the verification link shown there.',
      `3. Paste it in the Tokeshare console (${consoleUrl}): the user receives it by email automatically.`,
    ].join('\n'),
  });
}

/** Step 3 — hands the verification link to the user. */
export async function sendUserKycLink(customer: Pick<CustomerRef, 'email'>, kycUrl: string): Promise<void> {
  const panelUrl = `${SITE_URL()}/user/dashboard`;

  await sendEmail({
    to: customer.email,
    subject: 'Tokeshare — verify your identity to withdraw',
    html: layout(`
      <h2 style="margin:0 0 12px">Your verification link is ready</h2>
      <p>To withdraw your USDC to your bank account, our payment partner Alfred needs to verify your identity.
      It takes a few minutes on Alfred's own secure page: your documents are sent to them, never to Tokeshare.</p>
      <p style="margin:24px 0">${button(kycUrl, 'Verify my identity')}</p>
      <p style="font-size:13px;color:#6b7280">Once Alfred approves it, continue your withdrawal from
      <a href="${escapeHtml(panelUrl)}">your Tokeshare dashboard</a>. The same link is also available there.</p>
      <p style="font-size:13px;color:#6b7280">If you did not request a withdrawal on Tokeshare, you can ignore this email.</p>`),
    text: [
      'Your verification link is ready.',
      '',
      "To withdraw your USDC to your bank account, our payment partner Alfred needs to verify your identity. It takes a few minutes on Alfred's own secure page: your documents are sent to them, never to Tokeshare.",
      '',
      `Verify my identity: ${kycUrl}`,
      '',
      `Once Alfred approves it, continue your withdrawal from your Tokeshare dashboard: ${panelUrl}`,
      '',
      'If you did not request a withdrawal on Tokeshare, you can ignore this email.',
    ].join('\n'),
  });
}
