// Transactional email through Resend. Server-only.
//
// Callers decide whether a failed send is fatal; this module only reports it.
// Without RESEND_API_KEY / RESEND_FROM_EMAIL every send throws, so a missing
// configuration shows up in the logs instead of silently dropping mail.

import { Resend } from 'resend';
import { getLogger } from '@/lib/logger';

const log = getLogger('email');

let client: Resend | null = null;

/** Escapes a value interpolated into an HTML email body. */
export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export async function sendEmail(input: { to: string; subject: string; html: string; text: string }): Promise<string> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) throw new Error('Email is not configured (RESEND_API_KEY / RESEND_FROM_EMAIL)');

  client ??= new Resend(apiKey);
  const { data, error } = await client.emails.send({ from: `Tokeshare <${from}>`, ...input });
  if (error) throw new Error(`Resend refused the email: ${error.message}`);
  log.info('email sent', { id: data?.id, subject: input.subject });
  return data?.id ?? '';
}
