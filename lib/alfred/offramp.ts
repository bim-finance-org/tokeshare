// Alfred off-ramp orchestration: the steps between "connected wallet" and
// "pesos on a bank account", and the state we keep for each.
//
//   1. customer   POST /v1/customers + PUT profile       → customerId
//   2. KYC        POST /v1/customers/{id}/onboarding-link → Alfred-hosted page
//   3. endorse    POST /v1/customers/{id}/endorsements    once ACTIVE
//   4. bank       POST /v1/customers/{id}/linked_accounts → wait VERIFIED
//   5. fund       wallet pays USDC to GET …/deposit_address?chain=XLM (+ memo)
//   6. payout     once `available`: POST …/quotes, then POST …/payouts/fiat
//
// Alfred v1 keeps money on the customer: a deposit lands on the customer's
// balance and a payout debits it, as two independent transactions. So the
// quote comes AFTER the USDC is credited — a quote lives ~2 minutes, a
// deposit has no deadline.
//
// State is always re-read from Alfred rather than replayed from webhook
// payloads: a webhook only says *which* resource changed. That makes delivery
// order irrelevant and a forged delivery harmless (it can only trigger a read
// with our own credentials). Payment instructions are never served from our
// mirror either — same rule as the SEP-24 path.

import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { getLogger } from '@/lib/logger';
import {
  ALFRED_CHAIN,
  ALFRED_CRYPTO_CURRENCY,
  ALFRED_REQUIRED_ENDORSEMENTS,
  type AlfredCorridor,
} from '@/config/alfred';
import {
  AlfredError,
  createCustomer,
  createFiatPayout,
  createLinkedAccount,
  createOnboardingLink,
  createQuote,
  getBalances,
  getCustomer,
  getDepositAddress,
  getFiatPayout,
  getLinkedAccount,
  getQuote,
  isAlfredSandbox,
  listEndorsements,
  requestEndorsement,
  simulateDeposit,
  simulateLinkedAccountActivation,
  updateCustomer,
} from './client';
import {
  ALFRED_CREDITED,
  ALFRED_SENT,
  TERMINAL_ALFRED_STATUSES,
  type AlfredDeposit,
  type AlfredEndorsement,
  type AlfredEvent,
  type AlfredFiatPayout,
} from './types';

const log = getLogger('alfred:offramp');

const PROVIDER = 'alfred';

type Row = NonNullable<Awaited<ReturnType<typeof prisma.alfredCustomer.findUnique>>>;

export interface OnboardingState {
  corridor: string;
  customerId: string;
  email: string;
  /** Alfred customer status (NOT_STARTED … ACTIVE). */
  status: string;
  endorsementsReady: boolean;
  /** Only the last digits — the full account number is never echoed back. */
  linkedAccountLast4: string | null;
  linkedAccountStatus: string | null;
  /** Everything Alfred needs before USDC can be received and paid out. */
  ready: boolean;
}

const toState = (row: Row): OnboardingState => ({
  corridor: row.corridor,
  customerId: row.customerId,
  email: row.email,
  status: row.status,
  endorsementsReady: row.endorsementsReady,
  linkedAccountLast4: row.linkedAccountLast4,
  linkedAccountStatus: row.linkedAccountStatus,
  ready: row.status === 'ACTIVE' && row.endorsementsReady && row.linkedAccountStatus === 'VERIFIED',
});

const key = (network: string, address: string, corridorKey: string) => ({
  network_address_corridor: { network, address, corridor: corridorKey },
});

const rowKey = (row: Row) => key(row.network, row.address, row.corridor);

async function requireRow(network: string, address: string, corridor: AlfredCorridor): Promise<Row> {
  const row = await prisma.alfredCustomer.findUnique({ where: key(network, address, corridor.key) });
  if (!row) throw new AlfredError('Start the onboarding first', 400);
  return row;
}

export async function getOnboarding(
  network: string,
  address: string,
  corridor: AlfredCorridor,
): Promise<OnboardingState | null> {
  const row = await prisma.alfredCustomer.findUnique({ where: key(network, address, corridor.key) });
  return row && toState(row);
}

// ---- 1. customer -----------------------------------------------------------

/**
 * Creates the Alfred customer for this wallet and declares its profile: an
 * individual moving their own funds, resident in the corridor's country. The
 * creation key is derived from the wallet, so a retry replays rather than
 * creating a second customer.
 */
export async function startOnboarding(opts: {
  network: string;
  address: string;
  corridor: AlfredCorridor;
  email: string;
}): Promise<OnboardingState> {
  const existing = await getOnboarding(opts.network, opts.address, opts.corridor);
  if (existing) return existing;

  const customer = await createCustomer({ email: opts.email }, `${opts.network}:${opts.address}:${opts.corridor.key}`);
  await updateCustomer(customer.id, {
    customerType: 'CUSTOMER',
    customerArchetypes: ['RETAIL_INDIVIDUAL'],
    useCases: ['on_off_ramp'],
    residencyCountry: opts.corridor.country,
    email: opts.email,
    actsOnOwnBehalf: true,
    ownFundsVsClientFunds: 'OWN_FUNDS',
  });

  const row = await prisma.alfredCustomer.create({
    data: {
      network: opts.network,
      address: opts.address,
      corridor: opts.corridor.key,
      customerId: customer.id,
      email: opts.email,
      status: customer.status,
    },
  });
  return toState(row);
}

// ---- 2. hosted KYC ---------------------------------------------------------

/** Alfred-hosted onboarding URL; identity data and documents never touch us. */
export async function startKyc(
  network: string,
  address: string,
  corridor: AlfredCorridor,
): Promise<{ url: string; expiresAt: string | null }> {
  const row = await requireRow(network, address, corridor);
  if (row.status === 'ACTIVE') throw new AlfredError('Identity is already verified', 400);
  const link = await createOnboardingLink(row.customerId);
  return { url: link.url, expiresAt: link.expiresAt ?? null };
}

// ---- 3. endorsements -------------------------------------------------------

/** Both gates cleared: Alfred's own status and every provider-side approval. */
export const endorsementCleared = (entry: AlfredEndorsement | undefined): boolean =>
  !!entry &&
  entry.endorsement_status === 'APPROVED' &&
  (entry.provider_endorsements ?? []).every((provider) => provider.status === 'approved');

/**
 * Requests whatever required endorsement is missing and reports whether all
 * are cleared. A REVOKED one has to be requested from scratch, which is what a
 * fresh request does; requesting before ACTIVE would park it at INCOMPLETE, so
 * callers only run this on an active customer.
 */
async function ensureEndorsements(customerId: string): Promise<boolean> {
  const entries = await listEndorsements(customerId);
  const byName = new Map(entries.map((entry) => [entry.endorsement, entry]));

  let ready = true;
  for (const name of ALFRED_REQUIRED_ENDORSEMENTS) {
    const entry = byName.get(name);
    if (endorsementCleared(entry)) continue;
    ready = false;
    if (!entry || entry.endorsement_status === 'REVOKED') await requestEndorsement(customerId, name);
  }
  return ready;
}

/** Re-reads the customer (and its endorsements once active) from Alfred. */
async function syncCustomer(row: Row): Promise<Row> {
  const customer = await getCustomer(row.customerId);
  const endorsementsReady = customer.status === 'ACTIVE' ? await ensureEndorsements(row.customerId) : false;
  if (customer.status === row.status && endorsementsReady === row.endorsementsReady) return row;
  return prisma.alfredCustomer.update({
    where: rowKey(row),
    data: { status: customer.status, endorsementsReady },
  });
}

/** Pulls status from Alfred — the fallback when a webhook was missed or is not configured. */
export async function refreshOnboarding(
  network: string,
  address: string,
  corridor: AlfredCorridor,
): Promise<OnboardingState | null> {
  const row = await prisma.alfredCustomer.findUnique({ where: key(network, address, corridor.key) });
  if (!row) return null;
  try {
    let synced = await syncCustomer(row);
    if (synced.linkedAccountId && synced.linkedAccountStatus !== 'VERIFIED') {
      synced = await syncLinkedAccount(synced);
    }
    return toState(synced);
  } catch (error) {
    log.warn('onboarding refresh failed', error);
    return toState(row);
  }
}

// ---- 4. payout destination -------------------------------------------------

async function syncLinkedAccount(row: Row): Promise<Row> {
  if (!row.linkedAccountId) return row;
  const account = await getLinkedAccount(row.linkedAccountId);
  const status = account.relationship?.relationship_status ?? null;
  if (status === row.linkedAccountStatus) return row;
  return prisma.alfredCustomer.update({
    where: rowKey(row),
    data: { linkedAccountStatus: status },
  });
}

/**
 * Registers the payout bank account. Alfred derives the rail and verifies
 * ownership itself; on sandbox the review queue is skipped with the activation
 * simulator, which is the documented way to test a payout in a minute.
 */
export async function registerBankAccount(opts: {
  network: string;
  address: string;
  corridor: AlfredCorridor;
  identifier: string;
  holderName: string;
  holderTaxId?: string;
}): Promise<OnboardingState> {
  const row = await requireRow(opts.network, opts.address, opts.corridor);
  if (row.status !== 'ACTIVE') throw new AlfredError('Verify your identity first', 400);

  const account = await createLinkedAccount(row.customerId, {
    destinationType: 'BANK_ACCOUNT',
    country: opts.corridor.country,
    currency: opts.corridor.currency,
    holderName: opts.holderName,
    ...(opts.corridor.account.requiresTaxId ? { holderTaxId: opts.holderTaxId } : {}),
    bankAccount: { identifierType: opts.corridor.account.identifierType, identifier: opts.identifier },
  });
  if (!account.supportedRails.includes(opts.corridor.rail)) {
    throw new AlfredError(`This account cannot receive ${opts.corridor.rail} transfers`, 422);
  }

  const activated = isAlfredSandbox() ? await simulateLinkedAccountActivation(account.id) : account;
  const updated = await prisma.alfredCustomer.update({
    where: key(opts.network, opts.address, opts.corridor.key),
    data: {
      linkedAccountId: account.id,
      linkedAccountLast4: (account.identifierMasked ?? opts.identifier).slice(-4),
      linkedAccountStatus: activated.relationship?.relationship_status ?? 'PENDING',
    },
  });
  return toState(updated);
}

// ---- 5. funding ------------------------------------------------------------

export interface DepositInstructions {
  destination: string;
  memo: string | null;
  assetCode: string;
}

/** Where the wallet sends USDC — always read live from Alfred, never from a stored row. */
export async function readDepositInstructions(
  network: string,
  address: string,
  corridor: AlfredCorridor,
): Promise<DepositInstructions> {
  const row = await requireRow(network, address, corridor);
  if (row.status !== 'ACTIVE' || !row.endorsementsReady) {
    throw new AlfredError('Your Alfred account is not ready to receive USDC yet', 400);
  }
  const deposit = await getDepositAddress(row.customerId, ALFRED_CHAIN);
  if (deposit.status !== 'active') throw new AlfredError('Your Alfred deposit address is suspended', 409);
  return { destination: deposit.address, memo: deposit.tag ?? null, assetCode: ALFRED_CRYPTO_CURRENCY };
}

/** Records the on-chain payment so the history shows it until Alfred credits it. */
export async function recordDeposit(opts: {
  network: string;
  address: string;
  corridor: AlfredCorridor;
  hash: string;
  amount: string;
}): Promise<void> {
  await requireRow(opts.network, opts.address, opts.corridor);
  await prisma.rampTransaction.upsert({
    where: { network_provider_anchorTxId: { network: opts.network, provider: PROVIDER, anchorTxId: opts.hash } },
    create: {
      network: opts.network,
      provider: PROVIDER,
      direction: 'withdrawal',
      address: opts.address,
      anchorTxId: opts.hash,
      assetCode: ALFRED_CRYPTO_CURRENCY,
      amountIn: opts.amount,
      status: ALFRED_SENT,
      stellarTxHash: opts.hash,
    },
    update: {},
  });
}

/** Sandbox only: Alfred's deposit simulator stands in for a real on-chain arrival. */
export async function simulateFunding(opts: {
  network: string;
  address: string;
  corridor: AlfredCorridor;
  amount: string;
}): Promise<void> {
  if (!isAlfredSandbox()) throw new AlfredError('The deposit simulator only exists on the Alfred sandbox', 404);
  const row = await requireRow(opts.network, opts.address, opts.corridor);
  const deposit = await getDepositAddress(row.customerId, ALFRED_CHAIN);
  await simulateDeposit(row.customerId, { depositAddressId: deposit.id, amount: opts.amount });
}

/** Spendable USDC on the customer's Stellar balance. Only `available` can fund a payout. */
export async function readBalance(
  network: string,
  address: string,
  corridor: AlfredCorridor,
): Promise<{ available: string; pending: string }> {
  const row = await requireRow(network, address, corridor);
  const balances = await getBalances(row.customerId);
  const usdc = balances.find(
    (balance) => balance.asset === ALFRED_CRYPTO_CURRENCY && (!balance.chain || balance.chain === ALFRED_CHAIN),
  );
  return { available: usdc?.available ?? '0', pending: usdc?.pending ?? '0' };
}

// ---- 6. payout -------------------------------------------------------------

export interface WithdrawalQuote {
  quoteId: string;
  fromAmount: string;
  toAmount: string;
  currency: string;
  rate: string;
  /** Itemized, never folded into the rate. */
  fees: { type: string; amount: string; currency: string }[];
  expiresAt: string;
}

/** Prices USDC → fiat on the corridor's rail. Only once the funds are available. */
export async function quoteWithdrawal(opts: {
  network: string;
  address: string;
  corridor: AlfredCorridor;
  amount: string;
}): Promise<WithdrawalQuote> {
  const row = await requireRow(opts.network, opts.address, opts.corridor);
  const { available } = await readBalance(opts.network, opts.address, opts.corridor);
  if (Number(available) < Number(opts.amount)) {
    throw new AlfredError(`Only ${available} USDC is available on your Alfred balance`, 422, 'insufficient_balance');
  }

  const quote = await createQuote(row.customerId, {
    fromCurrency: ALFRED_CRYPTO_CURRENCY,
    toCurrency: opts.corridor.currency,
    fromAmount: opts.amount,
    chain: ALFRED_CHAIN,
    rail: opts.corridor.rail,
  });
  return {
    quoteId: quote.id,
    fromAmount: quote.fromAmount,
    toAmount: quote.toAmount,
    currency: quote.toCurrency,
    rate: quote.rate,
    fees: quote.fees ?? [],
    expiresAt: quote.expiresAt,
  };
}

/**
 * Executes the payout a quote prices. The quote is re-read from Alfred so the
 * amounts recorded and sent come from Alfred, not from the browser; the
 * payout's idempotency key is the quote id, so a retry cannot pay twice.
 */
export async function executeWithdrawal(opts: {
  network: string;
  address: string;
  corridor: AlfredCorridor;
  quoteId: string;
}): Promise<{ payoutId: string; status: string }> {
  const row = await requireRow(opts.network, opts.address, opts.corridor);
  if (!toState(row).ready || !row.linkedAccountId)
    throw new AlfredError('Your payout account is not verified yet', 400);

  const quote = await getQuote(opts.quoteId);
  if (quote.customerId !== row.customerId) throw new AlfredError('Unknown quote', 404);

  const payout = await createFiatPayout(row.customerId, {
    linkedAccountId: row.linkedAccountId,
    quoteId: quote.id,
    amount: { value: quote.toAmount, currency: quote.toCurrency },
    payment_flow_id: randomUUID(),
    reference: 'Tokeshare withdrawal',
  }).catch(async (error: unknown) => {
    // A destination can expire after it was verified; re-read it so the panel
    // asks for the account again instead of failing the same way forever.
    if (error instanceof AlfredError && error.code === 'recipient_not_linked') {
      await syncLinkedAccount(row).catch((syncError) => log.warn('destination resync failed', syncError));
    }
    throw error;
  });

  await prisma.rampTransaction.upsert({
    where: { network_provider_anchorTxId: { network: opts.network, provider: PROVIDER, anchorTxId: payout.id } },
    create: {
      network: opts.network,
      provider: PROVIDER,
      direction: 'withdrawal',
      address: opts.address,
      anchorTxId: payout.id,
      assetCode: ALFRED_CRYPTO_CURRENCY,
      amountIn: quote.fromAmount,
      amountOut: quote.toAmount,
      payoutCurrency: quote.toCurrency,
      status: payout.transaction_status,
    },
    update: { status: payout.transaction_status },
  });
  return { payoutId: payout.id, status: payout.transaction_status };
}

async function syncPayout(payout: AlfredFiatPayout): Promise<void> {
  const complete = payout.transaction_status === 'COMPLETE' && payout.settlement_status === 'SETTLED';
  await prisma.rampTransaction.updateMany({
    where: { provider: PROVIDER, anchorTxId: payout.id },
    data: {
      status: payout.transaction_status,
      ...(complete ? { completedAt: new Date() } : {}),
    },
  });
}

// ---- webhooks --------------------------------------------------------------

const str = (value: unknown): string | undefined => (typeof value === 'string' && value ? value : undefined);

/**
 * Applies an Alfred event by re-reading the resource it points at. Unknown
 * event types and unknown resources are ignored — Alfred adds types without a
 * version bump, and a 2xx is owed for every delivery.
 */
export async function applyEvent(event: AlfredEvent): Promise<void> {
  const object = event.data?.object ?? {};

  if (event.type.startsWith('customer.')) {
    // customer.updated carries the customer itself; verification/endorsement events carry its id.
    const customerId = str(object.customerId) ?? (event.type === 'customer.updated' ? str(object.id) : undefined);
    if (!customerId) return;
    const rows = await prisma.alfredCustomer.findMany({ where: { customerId } });
    for (const row of rows) await syncCustomer(row);
    return;
  }

  if (event.type === 'linked_account.updated') {
    const linkedAccountId = str(object.id);
    if (!linkedAccountId) return;
    const rows = await prisma.alfredCustomer.findMany({ where: { linkedAccountId } });
    for (const row of rows) await syncLinkedAccount(row);
    return;
  }

  if (event.type === 'deposit.credited') {
    // Match the credited deposit to the on-chain payment we recorded, when Alfred echoes its hash.
    const deposit = object as Partial<AlfredDeposit>;
    const hash = str(deposit.converted?.chain_tx_hash) ?? str(deposit.reference);
    if (!hash) return;
    await prisma.rampTransaction.updateMany({
      where: { provider: PROVIDER, anchorTxId: hash, status: ALFRED_SENT },
      data: { status: ALFRED_CREDITED, completedAt: new Date() },
    });
    return;
  }

  if (event.type === 'payout.fiat.updated') {
    const payoutId = str(object.id);
    if (!payoutId) return;
    const known = await prisma.rampTransaction.findFirst({ where: { provider: PROVIDER, anchorTxId: payoutId } });
    if (!known || TERMINAL_ALFRED_STATUSES.has(known.status)) return;
    await syncPayout(await getFiatPayout(payoutId));
    return;
  }

  log.info(`ignoring Alfred event ${event.type}`);
}

/** Pull-side fallback for payouts still in flight (webhook missed or not configured). */
export async function refreshPayouts(network: string, address: string): Promise<void> {
  const open = await prisma.rampTransaction.findMany({
    where: {
      network,
      address,
      provider: PROVIDER,
      NOT: { status: { in: [...TERMINAL_ALFRED_STATUSES, ALFRED_SENT, ALFRED_CREDITED] } },
    },
    take: 5,
  });
  for (const row of open) {
    try {
      await syncPayout(await getFiatPayout(row.anchorTxId));
    } catch (error) {
      log.warn(`payout refresh failed for ${row.anchorTxId}`, error);
    }
  }
}
