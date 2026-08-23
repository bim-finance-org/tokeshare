// One indexing pass for one network: fetch events since the cursor, store them
// idempotently, derive state (holders, trades, distributions), advance the
// cursor.
//
// Two-phase design: phase 1 persists raw events keyed by their globally unique
// RPC id (`createMany skipDuplicates` — re-fetching a range is harmless);
// phase 2 walks rows with `processed = false` and applies each one exactly
// once. A crash between the phases loses nothing: the next run re-enters
// phase 2 on the same unprocessed rows.
//
// ⚠️ Balances are NEVER derived from replayed events. Events only grow the
// holder SET; the balance of each touched address is re-read from the token
// contract by simulation (the source of truth for payouts).

import { Address, nativeToScVal, rpc } from '@stellar/stellar-sdk';
import { STELLAR_ASSETS, type StellarAsset } from '@/config/stellar-assets';
import { getNetworkProfile, type StellarNetwork, type StellarNetworkProfile } from '@/config/stellar';
import { readTokenBalance } from '@/lib/stellar-assets';
import { getServer } from '@/lib/stellar';
import { prisma } from '@/lib/prisma';
import { decodeEvent, type DecodedEvent, type Json, type RawRpcEvent } from './decode';

const PAGE_LIMIT = 200;
/** First boot with no cursor: start this many ledgers back (~30 min at ~5s). */
const FIRST_BOOT_LOOKBACK = 360;

export interface WatchedNetwork {
  profile: StellarNetworkProfile;
  /** token contract id → asset slug */
  tokens: Map<string, string>;
  /** sale contract id → asset slug */
  sales: Map<string, string>;
  distributorId: string;
}

/** Groups the registry's configured assets by network. */
export function buildWatched(): WatchedNetwork[] {
  const byNetwork = new Map<StellarNetwork, StellarAsset[]>();
  for (const asset of STELLAR_ASSETS) {
    if (!asset.tokenId) continue;
    byNetwork.set(asset.network, [...(byNetwork.get(asset.network) ?? []), asset]);
  }
  return [...byNetwork.entries()].map(([network, assets]) => ({
    profile: getNetworkProfile(network),
    tokens: new Map(assets.map((a) => [a.tokenId, a.slug])),
    sales: new Map(assets.filter((a) => a.saleId).map((a) => [a.saleId, a.slug])),
    distributorId: getNetworkProfile(network).distributorId,
  }));
}

export interface PollStats {
  network: StellarNetwork;
  fetched: number;
  processed: number;
  lastLedger: number;
  latestLedger: number;
  /** Ledgers permanently lost to RPC retention (0 in normal operation). */
  gapLedgers: number;
}

// ---- fetch -----------------------------------------------------------------

const symTransferB64 = nativeToScVal('transfer', { type: 'symbol' }).toXDR('base64');
const addrB64 = (address: string) => new Address(address).toScVal().toXDR('base64');

type EventFilter = { type: 'contract'; contractIds?: string[]; topics?: string[][] };

const chunk = <T>(items: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
};

/** All filters to watch on one network, each within the RPC's per-filter caps. */
function buildFilters(watched: WatchedNetwork): EventFilter[] {
  const filters: EventFilter[] = [];

  // Our own contracts: every event they emit.
  const own = [...watched.tokens.keys(), ...(watched.distributorId ? [watched.distributorId] : [])];
  for (const ids of chunk(own, 5)) filters.push({ type: 'contract', contractIds: ids });

  // USDC SAC: only transfers touching a sale contract (the payment legs of
  // buys/sells). Unfiltered, mainnet USDC would be a firehose. SAC transfer
  // topics: [transfer, from, to, sep11-asset-string].
  const patterns = [...watched.sales.keys()].flatMap((sale) => [
    [symTransferB64, addrB64(sale), '*', '*'],
    [symTransferB64, '*', addrB64(sale), '*'],
  ]);
  for (const topics of chunk(patterns, 5)) {
    filters.push({ type: 'contract', contractIds: [watched.profile.pay.sacId], topics });
  }
  return filters;
}

/**
 * Fetches every event matching `filter` from `startLedger` to the RPC's
 * latest, following pagination. Returns the rows plus the latest ledger the
 * stream is complete up to.
 */
async function fetchStream(
  server: rpc.Server,
  filter: EventFilter,
  startLedger: number,
): Promise<{ events: DecodedEvent[]; latestLedger: number }> {
  const events: DecodedEvent[] = [];
  let cursor: string | undefined;
  let latestLedger = 0;
  for (;;) {
    const page = await server.getEvents(
      cursor
        ? { filters: [filter], cursor, limit: PAGE_LIMIT }
        : { filters: [filter], startLedger, limit: PAGE_LIMIT },
    );
    latestLedger = page.latestLedger;
    for (const raw of page.events as unknown as RawRpcEvent[]) {
      if (raw.inSuccessfulContractCall === false) continue;
      events.push(decodeEvent(raw));
    }
    if (page.events.length < PAGE_LIMIT || !page.cursor) break;
    cursor = String(page.cursor);
  }
  return { events, latestLedger };
}

const isOutOfRangeError = (error: unknown): boolean =>
  error instanceof Error && /startLedger|oldest|out of range|LedgerNotFound/i.test(error.message);

// ---- derivation ------------------------------------------------------------

const asString = (value: Json | undefined): string | null => (typeof value === 'string' ? value : null);

const asBigInt = (value: Json | undefined): bigint | null => {
  if (typeof value === 'string' || typeof value === 'number') {
    try {
      return BigInt(value);
    } catch {
      return null;
    }
  }
  return null;
};

/** Event data is either a bare amount (SEP-41) or a map holding one. */
const amountOf = (data: Json): bigint | null =>
  asBigInt(data as string) ??
  (data && typeof data === 'object' && !Array.isArray(data) ? asBigInt(data.amount) : null);

type DbEvent = {
  id: string;
  contractId: string;
  txHash: string;
  kind: string;
  ledger: number;
  ledgerClosedAt: Date;
  topics: Json;
  data: Json;
};

/** Applies one token transfer/mint/burn: grows the holder set, records trades. */
async function applyTokenEvent(
  watched: WatchedNetwork,
  event: DbEvent,
  touched: Map<string, Set<string>>,
): Promise<void> {
  const slug = watched.tokens.get(event.contractId);
  if (!slug) return;
  const topics = event.topics as Json[];
  const network = watched.profile.network;

  // Addresses whose balance changed. topics: transfer=[t,from,to] mint=[t,to] burn=[t,from]
  const parties = topics.slice(1).map(asString).filter((a): a is string => !!a && /^[GC]/.test(a));
  const set = touched.get(slug) ?? new Set<string>();
  for (const address of parties) set.add(address);
  touched.set(slug, set);

  // Trade detection: a transfer with the asset's sale contract on one leg.
  if (event.kind !== 'transfer' || parties.length !== 2) return;
  const [from, to] = parties;
  const saleId = [...watched.sales.entries()].find(([, s]) => s === slug)?.[0];
  if (!saleId || (from !== saleId && to !== saleId)) return;

  const kind = from === saleId ? 'buy' : 'sell';
  const investor = from === saleId ? to : from;
  const shares = amountOf(event.data);
  if (shares === null) return;

  // The USDC leg lives in the same transaction (buy: investor→sale, sell:
  // sale→investor for the net). It may land in a later poll of the USDC
  // stream — the upsert below re-completes the row when re-processed.
  const usdcEvents = await prisma.stellarEvent.findMany({
    where: { network, txHash: event.txHash, contractId: watched.profile.pay.sacId, kind: 'transfer' },
  });
  const leg = usdcEvents.find((e) => {
    const [, uFrom, uTo] = (e.topics as Json[]).map(asString);
    return kind === 'buy' ? uFrom === investor && uTo === saleId : uFrom === saleId && uTo === investor;
  });
  const usdc = leg ? amountOf(leg.data as Json) : null;

  await prisma.stellarTrade.upsert({
    where: { eventId: event.id },
    create: {
      eventId: event.id,
      network,
      assetSlug: slug,
      kind,
      address: investor,
      shares,
      usdc,
      txHash: event.txHash,
      ledger: event.ledger,
      at: event.ledgerClosedAt,
    },
    update: { usdc },
  });
}

/** Applies one distributor event: mirrors cycles and settles payout lines. */
async function applyDistributorEvent(watched: WatchedNetwork, event: DbEvent): Promise<void> {
  const network = watched.profile.network;
  const topics = event.topics as Json[];
  const cycleId = Number(topics[1]);
  if (!Number.isInteger(cycleId)) return;
  const data = (event.data ?? {}) as { [key: string]: Json };

  if (event.kind === 'cycle_created') {
    const tokenId = asString(topics[2]) ?? '';
    const total = asBigInt(data.total) ?? 0n;
    const root = asString(data.root) ?? '';
    const snapshotLedger = Number(data.snapshot_ledger ?? 0);
    const expiresAt = new Date(Number(data.expires_at ?? 0) * 1000);
    const assetSlug = watched.tokens.get(tokenId) ?? 'unknown';
    await prisma.distributionCycle.upsert({
      where: { network_cycleId: { network, cycleId } },
      // The console usually creates the row first (it authors the entries);
      // the event fills in the on-chain confirmation.
      update: { createdTx: event.txHash, total, root, snapshotLedger, expiresAt },
      create: {
        network,
        cycleId,
        assetSlug,
        tokenId,
        total,
        root,
        snapshotLedger,
        expiresAt,
        createdTx: event.txHash,
        createdAt: event.ledgerClosedAt,
      },
    });
    return;
  }

  if (event.kind === 'paid') {
    const holder = asString(topics[2]);
    const amount = asBigInt(data.amount);
    const pushed = data.pushed === true;
    if (!holder || amount === null) return;
    await prisma.$transaction([
      prisma.distributionEntry.upsert({
        where: { network_cycleId_address: { network, cycleId, address: holder } },
        update: { paidAt: event.ledgerClosedAt, paidTx: event.txHash, pushed },
        // An entry the console does not know (should not happen) still gets a
        // row, so accounting from chain data stays complete.
        create: {
          network,
          cycleId,
          address: holder,
          amount,
          proof: [],
          paidAt: event.ledgerClosedAt,
          paidTx: event.txHash,
          pushed,
        },
      }),
      prisma.distributionCycle.update({
        where: { network_cycleId: { network, cycleId } },
        data: { claimed: { increment: amount } },
      }),
    ]);
    return;
  }

  if (event.kind === 'swept') {
    await prisma.distributionCycle.update({
      where: { network_cycleId: { network, cycleId } },
      data: { sweptAt: event.ledgerClosedAt },
    });
  }
}

/** Re-reads the authoritative balance of every touched (asset, address). */
async function refreshBalances(watched: WatchedNetwork, touched: Map<string, Set<string>>): Promise<void> {
  for (const [slug, addresses] of touched) {
    const tokenId = [...watched.tokens.entries()].find(([, s]) => s === slug)?.[0];
    if (!tokenId) continue;
    for (const address of addresses) {
      const balance = await readTokenBalance(watched.profile, tokenId, address);
      await prisma.stellarHolder.upsert({
        where: { assetSlug_address: { assetSlug: slug, address } },
        update: { balance },
        create: { assetSlug: slug, address, balance },
      });
    }
  }
}

// ---- the pass --------------------------------------------------------------

export async function pollNetwork(watched: WatchedNetwork): Promise<PollStats> {
  const { profile } = watched;
  const server = getServer(profile.rpcUrl);
  const network = profile.network;

  const latest = await server.getLatestLedger();
  const cursor = await prisma.stellarIndexCursor.findUnique({ where: { network } });
  const envStart = Number(process.env.STELLAR_INDEXER_START_LEDGER) || 0;
  const start = cursor ? cursor.lastLedger + 1 : envStart || Math.max(1, latest.sequence - FIRST_BOOT_LOOKBACK);
  let gapLedgers = 0;

  if (start > latest.sequence) {
    return { network, fetched: 0, processed: 0, lastLedger: cursor?.lastLedger ?? 0, latestLedger: latest.sequence, gapLedgers };
  }

  // Phase 1 — fetch every stream, store raw rows. The cursor only advances to
  // the lowest ledger ALL streams are complete up to.
  const filters = buildFilters(watched);
  let completeUpTo = latest.sequence;
  let fetched = 0;
  for (const filter of filters) {
    let stream;
    try {
      stream = await fetchStream(server, filter, start);
    } catch (error) {
      if (!isOutOfRangeError(error)) throw error;
      // The cursor fell out of RPC retention: those ledgers are gone for good.
      // Resume from the recent window and say so loudly — a missed transfer
      // means an address the payout snapshot cannot see.
      const resumeFrom = Math.max(1, latest.sequence - FIRST_BOOT_LOOKBACK);
      gapLedgers = Math.max(gapLedgers, resumeFrom - start);
      console.error(
        `[indexer][${network}] PERMANENT GAP: ledgers ${start}..${resumeFrom - 1} are beyond RPC retention. ` +
          `Holder sets may be incomplete — re-seed manually (npm run indexer:seed).`,
      );
      stream = await fetchStream(server, filter, resumeFrom);
    }
    completeUpTo = Math.min(completeUpTo, stream.latestLedger);
    if (stream.events.length > 0) {
      const result = await prisma.stellarEvent.createMany({
        data: stream.events.map((e) => ({ ...e, network, topics: e.topics as object, data: e.data as object })),
        skipDuplicates: true,
      });
      fetched += result.count;
    }
  }

  // Phase 2 — apply unprocessed rows in chain order, then refresh balances.
  const pending = (await prisma.stellarEvent.findMany({
    where: { network, processed: false },
    orderBy: [{ ledger: 'asc' }, { id: 'asc' }],
  })) as unknown as (DbEvent & { network: string })[];

  const touched = new Map<string, Set<string>>();
  for (const event of pending) {
    if (watched.tokens.has(event.contractId)) {
      await applyTokenEvent(watched, event, touched);
    } else if (event.contractId === watched.distributorId && watched.distributorId) {
      await applyDistributorEvent(watched, event);
    }
    // USDC rows carry no state of their own — they are looked up by txHash
    // from applyTokenEvent (including on later re-processing of a trade).
    await prisma.stellarEvent.update({ where: { id: event.id }, data: { processed: true } });
  }
  await refreshBalances(watched, touched);

  await prisma.stellarIndexCursor.upsert({
    where: { network },
    update: { lastLedger: completeUpTo },
    create: { network, lastLedger: completeUpTo },
  });

  return {
    network,
    fetched,
    processed: pending.length,
    lastLedger: completeUpTo,
    latestLedger: latest.sequence,
    gapLedgers,
  };
}
