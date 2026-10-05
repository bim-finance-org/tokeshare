// Server-side client for Alfred's v1 API (off-ramp: Stellar USDC → LATAM bank).
//
// Credentials never leave the server: every call the browser needs goes through
// our own /api/stellar/ramp/alfred/* routes, which call in here.
//
// Every state-changing POST carries an `Idempotency-Key` (a UUID, required by
// Alfred). Where a retry must not create a second object — a customer for a
// wallet, a payout for a quote — the key is derived from that business
// identity, so a double click or a retried request replays the original
// response instead of moving money twice.
//
// Never import from a client component.

import { createHash, randomUUID } from 'crypto';
import { getLogger } from '@/lib/logger';
import type {
  AlfredBalance,
  AlfredCustomer,
  AlfredCustomerProfile,
  AlfredDeposit,
  AlfredDepositAddress,
  AlfredEndorsement,
  AlfredEvent,
  AlfredFiatPayout,
  AlfredLinkedAccount,
  AlfredOnboardingLink,
  AlfredQuote,
  CreateFiatPayoutRequest,
  CreateLinkedAccountRequest,
  CreateQuoteRequest,
} from './types';

const log = getLogger('alfred:client');

/**
 * Production has no public host yet: Alfred hands it out once the account is
 * enabled for production, so it must come from ALFRED_API_BASE_URL.
 */
const BASE_URLS: Record<string, string | undefined> = {
  sandbox: 'https://api.sandbox.alfredpay.io',
  production: undefined,
};

const TIMEOUT_MS = 20_000;

export class AlfredError extends Error {
  constructor(
    message: string,
    readonly status: number,
    /** Alfred's `error.code` (`quote_expired`, `insufficient_balance`…), for mapping to user copy. */
    readonly code?: string,
  ) {
    super(message);
    this.name = 'AlfredError';
  }
}

const alfredEnv = (): string => process.env.ALFRED_API_ENV || 'sandbox';

/** The simulators under /v1/test/ only exist on the sandbox host. */
export const isAlfredSandbox = (): boolean => alfredEnv() === 'sandbox';

function credentials(): { baseUrl: string; headers: Record<string, string> } {
  const env = alfredEnv();
  const baseUrl = process.env.ALFRED_API_BASE_URL || BASE_URLS[env];
  if (!baseUrl) throw new AlfredError(`No Alfred base URL for ALFRED_API_ENV "${env}" (set ALFRED_API_BASE_URL)`, 500);

  const key = process.env.ALFRED_API_KEY;
  const secret = process.env.ALFRED_API_SECRET;
  if (!key) throw new AlfredError('ALFRED_API_KEY is not set', 500);
  // Two documented schemes: the key/secret pair, or the key alone as a bearer token.
  const headers: Record<string, string> = secret
    ? { 'api-key': key, 'api-secret': secret }
    : { Authorization: `Bearer ${key}` };
  return { baseUrl: baseUrl.replace(/\/$/, ''), headers };
}

export const isAlfredConfigured = (): boolean => !!process.env.ALFRED_API_KEY;

/**
 * A UUID derived from a business identity, so the same intent always carries
 * the same `Idempotency-Key` (Alfred keeps keys for 24 hours). Formatted as a
 * version-5-style UUID because Alfred refuses anything that is not a UUID.
 */
export function idempotencyKey(seed: string): string {
  const hex = createHash('sha256').update(`tokeshare:alfred:${seed}`).digest('hex');
  const variant = ((parseInt(hex[16]!, 16) & 0x3) | 0x8).toString(16);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${variant}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

/** Alfred's error envelope: `{ error: { type, code, message, param, request_id } }`. */
export function readAlfredError(status: number, body: unknown): AlfredError {
  const error = (body as { error?: { code?: unknown; message?: unknown; param?: unknown } } | null)?.error;
  const code = typeof error?.code === 'string' ? error.code : undefined;
  const base = typeof error?.message === 'string' ? error.message : `Alfred request failed (${status})`;
  const param = typeof error?.param === 'string' ? ` (${error.param})` : '';
  return new AlfredError(`${base}${param}`, status, code);
}

// ---- transport -------------------------------------------------------------

async function alfredFetch<T>(
  path: string,
  init?: { method?: 'GET' | 'POST' | 'PUT'; body?: unknown; idempotencyKey?: string },
): Promise<T> {
  const { baseUrl, headers } = credentials();
  const method = init?.method ?? 'GET';

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        accept: 'application/json',
        ...headers,
        ...(init?.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(method === 'POST' ? { 'Idempotency-Key': init?.idempotencyKey ?? randomUUID() } : {}),
      },
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: 'no-store',
    });
  } catch (error) {
    log.error(`alfred ${method} ${path} unreachable`, error);
    throw new AlfredError('Alfred is unreachable', 504);
  }

  const text = await response.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }

  if (!response.ok) {
    const error = readAlfredError(response.status, body);
    log.warn(`alfred ${method} ${path} -> ${response.status} ${error.code ?? ''}: ${error.message}`);
    throw error;
  }
  return body as T;
}

const enc = encodeURIComponent;

// ---- customers -------------------------------------------------------------

/** `seed` makes creation idempotent per wallet for 24 hours. */
export const createCustomer = (input: { email: string }, seed: string) =>
  alfredFetch<AlfredCustomer>('/v1/customers', {
    method: 'POST',
    body: { type: 'INDIVIDUAL', email: input.email },
    idempotencyKey: idempotencyKey(`customer:${seed}`),
  });

export const updateCustomer = (customerId: string, profile: AlfredCustomerProfile) =>
  alfredFetch<AlfredCustomer>(`/v1/customers/${enc(customerId)}`, { method: 'PUT', body: profile });

export const getCustomer = (customerId: string) => alfredFetch<AlfredCustomer>(`/v1/customers/${enc(customerId)}`);

/**
 * Hosted onboarding: identity capture, documents and selfie happen on Alfred's
 * page. A new link supersedes the previous one.
 */
export const createOnboardingLink = (customerId: string) =>
  alfredFetch<AlfredOnboardingLink>(`/v1/customers/${enc(customerId)}/onboarding-link`, { method: 'POST' });

// ---- endorsements ----------------------------------------------------------

export const listEndorsements = async (customerId: string): Promise<AlfredEndorsement[]> =>
  (await alfredFetch<{ data?: AlfredEndorsement[] }>(`/v1/customers/${enc(customerId)}/endorsements`)).data ?? [];

export const requestEndorsement = (customerId: string, endorsement: string) =>
  alfredFetch<AlfredEndorsement>(`/v1/customers/${enc(customerId)}/endorsements`, {
    method: 'POST',
    body: { endorsement },
    idempotencyKey: idempotencyKey(`endorsement:${customerId}:${endorsement}`),
  });

// ---- money in --------------------------------------------------------------

/** Permanent, custody-issued address. Stellar deposits must carry its `tag` as memo. */
export const getDepositAddress = (customerId: string, chain: string) =>
  alfredFetch<AlfredDepositAddress>(`/v1/customers/${enc(customerId)}/deposit_address?chain=${enc(chain)}`);

export const getBalances = async (customerId: string): Promise<AlfredBalance[]> =>
  (await alfredFetch<{ data?: AlfredBalance[] }>(`/v1/customers/${enc(customerId)}/balances?type=stablecoin`)).data ??
  [];

// ---- payout destination ----------------------------------------------------

export const createLinkedAccount = (customerId: string, request: CreateLinkedAccountRequest) =>
  alfredFetch<AlfredLinkedAccount>(`/v1/customers/${enc(customerId)}/linked_accounts`, {
    method: 'POST',
    body: request,
    idempotencyKey: idempotencyKey(
      `linked:${customerId}:${request.bankAccount.identifierType}:${request.bankAccount.identifier}`,
    ),
  });

export const getLinkedAccount = (linkedAccountId: string) =>
  alfredFetch<AlfredLinkedAccount>(`/v1/linked_accounts/${enc(linkedAccountId)}`);

// ---- quote + payout --------------------------------------------------------

/** Expires in ~2 minutes: request it once the funds are already `available`. */
export const createQuote = (customerId: string, request: CreateQuoteRequest) =>
  alfredFetch<AlfredQuote>(`/v1/customers/${enc(customerId)}/quotes`, { method: 'POST', body: request });

export const getQuote = (quoteId: string) => alfredFetch<AlfredQuote>(`/v1/quotes/${enc(quoteId)}`);

/** Keyed on the quote: one quote can fund exactly one payout, even across retries. */
export const createFiatPayout = (customerId: string, request: CreateFiatPayoutRequest) =>
  alfredFetch<AlfredFiatPayout>(`/v1/customers/${enc(customerId)}/payouts/fiat`, {
    method: 'POST',
    body: request,
    idempotencyKey: idempotencyKey(`payout:${request.quoteId}`),
  });

export const getFiatPayout = (payoutId: string) => alfredFetch<AlfredFiatPayout>(`/v1/payouts/fiat/${enc(payoutId)}`);

// ---- events ----------------------------------------------------------------

/** The authoritative copy of a webhook delivery, read with our own credentials. */
export const getEvent = (eventId: string) => alfredFetch<AlfredEvent>(`/v1/events/${enc(eventId)}`);

export const createWebhookEndpoint = (url: string, eventTypes: string[]) =>
  alfredFetch<{ id: string; url: string; secret?: string; event_types: string[] }>('/v1/webhook_endpoints', {
    method: 'POST',
    body: { url, event_types: eventTypes },
  });

// ---- sandbox simulators ----------------------------------------------------

export const simulateDeposit = (customerId: string, input: { depositAddressId: string; amount: string }) =>
  alfredFetch<AlfredDeposit>(`/v1/test/customers/${enc(customerId)}/deposits/simulate`, {
    method: 'POST',
    body: { depositAddressId: input.depositAddressId, amount: { value: input.amount, currency: 'USDC' } },
  });

export const simulateLinkedAccountActivation = (linkedAccountId: string) =>
  alfredFetch<AlfredLinkedAccount>(`/v1/test/linked_accounts/${enc(linkedAccountId)}/simulate_activation`, {
    method: 'POST',
    idempotencyKey: idempotencyKey(`activate:${linkedAccountId}`),
  });

/** Route registry for one country — used by the smoke script to confirm a corridor is LIVE. */
export const getCountry = (country: string) =>
  alfredFetch<{
    code: string;
    routes?: { currency: string; destinationType: string; rail: string; status: string; operations?: string[] }[];
  }>(`/v1/countries/${enc(country)}`);
