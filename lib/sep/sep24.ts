// SEP-24: hosted (interactive) deposit and withdrawal against an anchor.
//
// The anchor hosts the whole KYC/amount UI at the returned interactive URL —
// the app only starts the flow with the SEP-10 JWT, then polls /transaction
// until a terminal status. For withdrawals the anchor eventually asks the user
// to send USDC on-chain (status pending_user_transfer_start, destination +
// memo in the transaction record).

export type RampDirection = 'deposit' | 'withdrawal';

export type Sep24Status =
  | 'incomplete'
  | 'pending_user_transfer_start'
  | 'pending_user_transfer_complete'
  | 'pending_external'
  | 'pending_anchor'
  | 'pending_stellar'
  | 'pending_trust'
  | 'pending_user'
  | 'completed'
  | 'refunded'
  | 'expired'
  | 'no_market'
  | 'too_small'
  | 'too_large'
  | 'error';

/** Statuses after which the anchor will never move the transaction again. */
export const TERMINAL_SEP24_STATUSES: ReadonlySet<string> = new Set([
  'completed',
  'refunded',
  'expired',
  'no_market',
  'too_small',
  'too_large',
  'error',
]);

export interface Sep24Transaction {
  id: string;
  kind: RampDirection;
  status: Sep24Status | string;
  status_eta?: number | null;
  more_info_url?: string | null;
  amount_in?: string | null;
  amount_out?: string | null;
  amount_fee?: string | null;
  external_transaction_id?: string | null;
  stellar_transaction_id?: string | null;
  message?: string | null;
  /** Withdrawal only: where and how to send the on-chain funds. */
  withdraw_anchor_account?: string | null;
  withdraw_memo?: string | null;
  withdraw_memo_type?: 'text' | 'id' | 'hash' | null;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface InteractiveFlow {
  id: string;
  /** Anchor-hosted URL to open in a popup/webview. */
  url: string;
}

export async function startInteractiveFlow(opts: {
  transferServer: string;
  direction: RampDirection;
  jwt: string;
  assetCode: string;
  account: string;
  lang?: string;
}): Promise<InteractiveFlow> {
  const path = opts.direction === 'deposit' ? 'deposit' : 'withdraw';
  const res = await fetch(`${opts.transferServer}/transactions/${path}/interactive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${opts.jwt}` },
    body: JSON.stringify({ asset_code: opts.assetCode, account: opts.account, lang: opts.lang ?? 'en' }),
  });
  const body = (await res.json().catch(() => ({}))) as { id?: string; url?: string; error?: string };
  if (!res.ok || !body.id || !body.url) {
    throw new Error(body.error || `The anchor could not start the ${opts.direction} (${res.status})`);
  }
  return { id: body.id, url: body.url };
}

export async function getSep24Transaction(opts: {
  transferServer: string;
  jwt: string;
  id: string;
}): Promise<Sep24Transaction> {
  const res = await fetch(`${opts.transferServer}/transaction?id=${encodeURIComponent(opts.id)}`, {
    headers: { Authorization: `Bearer ${opts.jwt}` },
  });
  const body = (await res.json().catch(() => ({}))) as { transaction?: Sep24Transaction; error?: string };
  if (!res.ok || !body.transaction) {
    throw new Error(body.error || `Could not load the transaction status (${res.status})`);
  }
  return body.transaction;
}
