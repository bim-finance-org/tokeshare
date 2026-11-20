// Minimal client for a self-hosted Stellar Disbursement Platform (SDP v7)
// instance — the push channel of revenue distributions (see
// docs/stellar/tranche-2-sdp-plan.md).
//
// One SDP instance serves exactly one Stellar network (its NETWORK_PASSPHRASE
// is global), so the config is per network: SDP_TESTNET_* / SDP_MAINNET_*. A
// network without SDP_<NET>_BASE_URL has no SDP — the round planner then
// falls back to the distributor push (distribute_for).
//
// Auth is an SDP API key (`SDP_<id>.<secret>`), created once from the SDP
// dashboard owner account. Never import from client components.

import { getNetworkProfile, type StellarNetwork } from '@/config/stellar';

export interface SdpConfig {
  network: StellarNetwork;
  baseUrl: string;
  apiKey: string;
  /** The SDP distribution account (G...) — funded by the operator per round. */
  distributionAddress: string;
  /** SDP dashboard URL, for operator deep links (optional). */
  dashboardUrl: string;
  /**
   * SDP asset id of the payment asset (USDC), copied from the SDP dashboard.
   * Optional: without it the id is looked up via GET /assets, which needs an
   * API key with `read:all` instead of the minimal disbursement scopes.
   */
  assetId: string;
}

export function getSdpConfig(network: StellarNetwork): SdpConfig | null {
  const prefix = `SDP_${network.toUpperCase()}_`;
  const baseUrl = process.env[`${prefix}BASE_URL`]?.trim();
  if (!baseUrl) return null;
  const apiKey = process.env[`${prefix}API_KEY`]?.trim();
  const distributionAddress = process.env[`${prefix}DISTRIBUTION_ADDRESS`]?.trim();
  if (!apiKey || !distributionAddress) {
    throw new Error(`${prefix}BASE_URL is set but ${prefix}API_KEY or ${prefix}DISTRIBUTION_ADDRESS is missing`);
  }
  return {
    network,
    baseUrl: baseUrl.replace(/\/+$/, ''),
    apiKey,
    distributionAddress,
    dashboardUrl: (process.env[`${prefix}DASHBOARD_URL`] ?? '').trim().replace(/\/+$/, ''),
    assetId: (process.env[`${prefix}ASSET_ID`] ?? '').trim(),
  };
}

// ---- errors ----------------------------------------------------------------

export class SdpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = 'SdpError';
  }
}

/** 409 on start: the distribution account cannot cover this + in-flight payments. */
export class SdpInsufficientBalanceError extends SdpError {
  constructor(message: string, body?: unknown) {
    super(message, 409, body);
    this.name = 'SdpInsufficientBalanceError';
  }
}

// ---- transport -------------------------------------------------------------

const TIMEOUT_MS = 15_000;

async function sdpFetch<T>(config: SdpConfig, path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${config.apiKey}`);
  headers.set('Accept', 'application/json');

  let res: Response;
  try {
    res = await fetch(`${config.baseUrl}${path}`, {
      ...init,
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new SdpError(`SDP unreachable (${config.network}): ${reason}`, 0);
  }

  const text = await res.text();
  let body: unknown = undefined;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    body = text;
  }
  if (!res.ok) {
    const payload = body && typeof body === 'object' ? (body as { error?: unknown; extras?: unknown }) : {};
    const detail = payload.error ? String(payload.error) : `HTTP ${res.status}`;
    const extras = payload.extras ? ` ${JSON.stringify(payload.extras)}` : '';
    const message = `SDP ${init.method ?? 'GET'} ${path}: ${detail}${extras}`;
    if (res.status === 409 && /balance/i.test(detail)) throw new SdpInsufficientBalanceError(message, body);
    throw new SdpError(message, res.status, body);
  }
  return body as T;
}

/** Paginated SDP list responses: `{ pagination, data }` (empty: no data). */
interface Paginated<T> {
  pagination?: { next?: string; pages?: number; total?: number };
  data?: T[];
}

async function fetchAllPages<T>(config: SdpConfig, path: string): Promise<T[]> {
  const out: T[] = [];
  const separator = path.includes('?') ? '&' : '?';
  for (let page = 1; page <= 200; page += 1) {
    const res = await sdpFetch<Paginated<T>>(config, `${path}${separator}page=${page}&page_limit=50`);
    out.push(...(res.data ?? []));
    if (!res.pagination?.next) break;
  }
  return out;
}

// ---- assets ----------------------------------------------------------------

interface SdpAsset {
  id: string;
  code: string;
  issuer: string;
  deleted_at?: string | null;
}

const assetIdCache = new Map<StellarNetwork, string>();

/** The SDP asset id of the network's payment asset (USDC), matched by code + issuer. */
export async function resolvePayAssetId(config: SdpConfig): Promise<string> {
  if (config.assetId) return config.assetId;
  const cached = assetIdCache.get(config.network);
  if (cached) return cached;
  const { pay } = getNetworkProfile(config.network);
  const res = await sdpFetch<SdpAsset[] | Paginated<SdpAsset>>(config, '/assets');
  const assets = Array.isArray(res) ? res : (res.data ?? []);
  const match = assets.find((a) => !a.deleted_at && a.code === pay.code && a.issuer === pay.issuer);
  if (!match) {
    throw new SdpError(
      `SDP (${config.network}) has no ${pay.code}:${pay.issuer} asset — add it in the SDP dashboard (Assets) first`,
      404,
    );
  }
  assetIdCache.set(config.network, match.id);
  return match.id;
}

// ---- disbursements ---------------------------------------------------------

export type SdpDisbursementStatus = 'DRAFT' | 'READY' | 'STARTED' | 'PAUSED' | 'COMPLETED' | 'CANCELED';

export interface SdpDisbursement {
  id: string;
  name: string;
  status: SdpDisbursementStatus;
}

/** Disbursements whose name contains `query` (SDP does an ILIKE on the name). */
export async function findDisbursements(config: SdpConfig, query: string): Promise<SdpDisbursement[]> {
  return fetchAllPages<SdpDisbursement>(config, `/disbursements?q=${encodeURIComponent(query)}`);
}

export async function getDisbursement(config: SdpConfig, id: string): Promise<SdpDisbursement> {
  return sdpFetch<SdpDisbursement>(config, `/disbursements/${encodeURIComponent(id)}`);
}

/**
 * Creates a disbursement AND uploads its instructions in one transactional
 * call (multipart: `data` = JSON, `file` = CSV). Lands in READY.
 * No idempotency key exists on the SDP side — callers must look for an
 * existing disbursement (by name) before retrying.
 */
export async function createDisbursement(
  config: SdpConfig,
  input: { name: string; assetId: string; csv: string },
): Promise<SdpDisbursement> {
  const form = new FormData();
  form.set(
    'data',
    JSON.stringify({
      name: input.name,
      asset_id: input.assetId,
      // Known-wallet mode: wallet_id is ignored (the SDP picks its "User
      // Managed Wallet"), verification_field is not allowed.
      registration_contact_type: 'EMAIL_AND_WALLET_ADDRESS',
    }),
  );
  form.set('file', new Blob([input.csv], { type: 'text/csv' }), 'instructions.csv');
  return sdpFetch<SdpDisbursement>(config, '/disbursements', { method: 'POST', body: form });
}

export async function startDisbursement(config: SdpConfig, id: string): Promise<void> {
  await sdpFetch(config, `/disbursements/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'STARTED' }),
  });
}

// ---- payments --------------------------------------------------------------

export type SdpPaymentStatus = 'DRAFT' | 'READY' | 'PENDING' | 'PAUSED' | 'SUCCESS' | 'FAILED' | 'CANCELED';

export interface SdpPaymentLine {
  /** Receiver wallet address (G... / C...). */
  address: string;
  paymentId: string;
  status: SdpPaymentStatus;
  amount: string;
  /** Stellar transaction hash once submitted. */
  txHash: string | null;
  /** Last status message (the failure reason on FAILED). */
  message: string | null;
  updatedAt: string;
}

interface SdpDisbursementReceiver {
  external_id?: string;
  receiver_wallet?: { stellar_address?: string } | null;
  payment?: {
    id: string;
    amount: string;
    status: SdpPaymentStatus;
    stellar_transaction_id?: string;
    status_history?: { status: string; status_message?: string; timestamp?: string }[];
    updated_at: string;
  } | null;
}

/** Every payment of one disbursement, keyed by receiver wallet address. */
export async function getDisbursementPayments(config: SdpConfig, id: string): Promise<SdpPaymentLine[]> {
  const receivers = await fetchAllPages<SdpDisbursementReceiver>(
    config,
    `/disbursements/${encodeURIComponent(id)}/receivers`,
  );
  return receivers
    .filter((r) => r.payment)
    .map((r) => {
      const payment = r.payment!;
      const history = payment.status_history ?? [];
      const message = [...history].reverse().find((h) => h.status_message)?.status_message ?? null;
      return {
        address: (r.receiver_wallet?.stellar_address || r.external_id || '').toUpperCase(),
        paymentId: payment.id,
        status: payment.status,
        amount: payment.amount,
        txHash: payment.stellar_transaction_id || null,
        message,
        updatedAt: payment.updated_at,
      };
    });
}

/** Deep link to a disbursement in the SDP dashboard, when its URL is configured. */
export const sdpDisbursementUrl = (config: SdpConfig, id: string): string | null =>
  config.dashboardUrl ? `${config.dashboardUrl}/disbursements/${id}` : null;
