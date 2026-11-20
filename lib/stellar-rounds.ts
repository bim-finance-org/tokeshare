// Revenue distribution rounds — the operator console's state machine.
//
// A round is one payout of one asset ("October for TFW_001"). Its snapshot is
// split into DISJOINT channels (docs/stellar/tranche-2-sdp-plan.md, D1):
//
//   sdp round (an SDP instance serves the network)
//     holders with a USDC trustline → one SDP disbursement (one tx per holder,
//                                      a failure only fails its own line)
//     holders without               → a distributor cycle over THEM ONLY
//                                      (claim path)
//   contract round (no SDP on the network) — tranche 2 step 1 behaviour
//     everyone                      → one distributor cycle, push lines sent
//                                      with distribute_for, the rest claim
//
// Disjoint matters: a holder paid by the SDP who also had a leaf in a funded
// cycle could claim a second time.
//
// Execution is a resumable state machine. Every step persists what it did
// before the next one starts, so a crash or an error is fixed by re-running
// advanceRound — never by redoing a step that already took effect:
//
//   planned ── top-up SDP account ── claim cycle ── SDP create + start ──> submitted
//   submitted ──(syncRound: SDP payments + distributor entries)──> settled | attention
//   attention ──(rerouteFailed: failed SDP lines → new claim cycle)──> settled
//
// Never import from client components.

import { getNetworkProfile, type StellarNetwork } from '@/config/stellar';
import { getStellarAsset, type StellarAsset } from '@/config/stellar-assets';
import { prisma } from '@/lib/prisma';
import {
  createDisbursement,
  findDisbursements,
  getDisbursement,
  getDisbursementPayments,
  getSdpConfig,
  resolvePayAssetId,
  SdpInsufficientBalanceError,
  sdpDisbursementUrl,
  startDisbursement,
} from '@/lib/sdp';
import { buildSdpCsv } from '@/lib/sdp-csv';
import { unitsToStroops } from '@/lib/stellar';
import { getClassicBalances } from '@/lib/stellar-assets';
import {
  computeSnapshot,
  createDistributorCycle,
  pushCycleEntries,
  resolvePendingCycles,
  topUpSdpAccount,
} from '@/lib/stellar-admin';
import { buildDistribution } from '@/lib/stellar-merkle';
import {
  computeRoundStatus,
  countRound,
  fromSdpStatus,
  isDoublePaid,
  lineState,
  type LineState,
  type RoundStatus,
} from '@/lib/stellar-round-state';
import { errorMessage } from '@/lib/error-message';

export type RoundChannel = 'sdp' | 'contract';
export type PayoutChannel = 'sdp' | 'push' | 'claim';

/** SDP payout statuses that still hold funds on the SDP distribution account. */
const SDP_IN_FLIGHT = ['draft', 'ready', 'pending', 'paused'];
/** A re-routed line gets at least this long to be claimed. */
const MIN_REROUTE_WINDOW_MS = 30 * 86_400_000;
/** Settled rounds with re-routed lines keep being watched this long (double-payment guard). */
const REROUTE_WATCH_MS = 30 * 86_400_000;

const sum = (values: bigint[]) => values.reduce((a, b) => a + b, 0n);

const roundChannelFor = (network: StellarNetwork): RoundChannel => (getSdpConfig(network) ? 'sdp' : 'contract');

const payoutChannel = (round: RoundChannel, push: boolean): PayoutChannel =>
  push ? (round === 'sdp' ? 'sdp' : 'push') : 'claim';

/**
 * USDC already committed on the SDP distribution account by other rounds
 * (submitted, not yet settled). The SDP refuses to start a disbursement the
 * balance cannot cover on top of those.
 */
async function sdpInFlight(network: StellarNetwork, exceptRoundId: string | null): Promise<bigint> {
  const agg = await prisma.distributionPayout.aggregate({
    _sum: { amount: true },
    where: {
      channel: 'sdp',
      status: { in: SDP_IN_FLIGHT },
      roundId: exceptRoundId ? { not: exceptRoundId } : undefined,
      round: { network, sdpDisbursementId: { not: null } },
    },
  });
  return agg._sum.amount ?? 0n;
}

function assertClaimServable(asset: StellarAsset, claimCount: number): void {
  if (claimCount > 0 && !getNetworkProfile(asset.network).distributorId) {
    throw new Error(
      `${claimCount} holder(s) have no USDC trustline and no distributor is deployed on ${asset.network} to serve their claim`,
    );
  }
}

// ---- preview ----------------------------------------------------------------

export interface RoundPreview {
  network: StellarNetwork;
  channel: RoundChannel;
  snapshotLedger: number;
  eligibleShares: string;
  dust: string;
  excluded: string[];
  lines: { address: string; shares: string; amount: string; channel: PayoutChannel }[];
  /** Stroops per payout channel. */
  totals: Record<PayoutChannel, string>;
  /** sdp rounds: USDC the operator account will send to the SDP account. */
  sdpTopUp: string | null;
}

/** Dry run: fresh balances + trustlines, the exact split. Nothing is written. */
export async function previewRound(asset: StellarAsset, totalStroops: bigint): Promise<RoundPreview> {
  const snapshot = await computeSnapshot(asset, totalStroops);
  const channel = roundChannelFor(asset.network);
  const lines = snapshot.lines.map((l) => ({ ...l, channel: payoutChannel(channel, l.push) }));
  assertClaimServable(asset, lines.filter((l) => l.channel === 'claim').length);

  const totalOf = (c: PayoutChannel) => sum(lines.filter((l) => l.channel === c).map((l) => l.amount));
  let sdpTopUp: string | null = null;
  const sdp = getSdpConfig(asset.network);
  if (channel === 'sdp' && sdp) {
    const balance = unitsToStroops(
      (await getClassicBalances(getNetworkProfile(asset.network), sdp.distributionAddress)).usdc,
    );
    const missing = totalOf('sdp') + (await sdpInFlight(asset.network, null)) - balance;
    sdpTopUp = (missing > 0n ? missing : 0n).toString();
  }

  return {
    network: asset.network,
    channel,
    snapshotLedger: snapshot.snapshotLedger,
    eligibleShares: snapshot.eligibleShares.toString(),
    dust: snapshot.dust.toString(),
    excluded: snapshot.excluded,
    lines: lines.map((l) => ({
      address: l.address,
      shares: l.shares.toString(),
      amount: l.amount.toString(),
      channel: l.channel,
    })),
    totals: { sdp: totalOf('sdp').toString(), push: totalOf('push').toString(), claim: totalOf('claim').toString() },
    sdpTopUp,
  };
}

// ---- plan + execute ---------------------------------------------------------

/** Re-snapshots and persists the round with every payout line. Returns its id. */
export async function planRound(asset: StellarAsset, totalStroops: bigint, expiresDays: number): Promise<string> {
  const snapshot = await computeSnapshot(asset, totalStroops);
  const channel = roundChannelFor(asset.network);
  const lines = snapshot.lines.map((l) => ({ ...l, channel: payoutChannel(channel, l.push) }));
  assertClaimServable(asset, lines.filter((l) => l.channel === 'claim').length);

  const { root } = buildDistribution(
    0,
    lines.map(({ address, amount }) => ({ address, amount })),
  );
  const round = await prisma.distributionRound.create({
    data: {
      network: asset.network,
      channel,
      assetSlug: asset.slug,
      tokenId: asset.tokenId,
      total: totalStroops,
      snapshotLedger: snapshot.snapshotLedger,
      snapshotRoot: root,
      claimExpiresAt: new Date(Date.now() + expiresDays * 86_400_000),
      payouts: {
        createMany: {
          data: lines.map((l) => ({
            address: l.address,
            shares: l.shares,
            amount: l.amount,
            channel: l.channel,
            status: l.channel === 'sdp' ? 'draft' : 'onchain',
          })),
        },
      },
    },
  });
  return round.id;
}

type LoadedRound = NonNullable<Awaited<ReturnType<typeof loadRound>>>;

const loadRound = (roundId: string) =>
  prisma.distributionRound.findUnique({
    where: { id: roundId },
    include: { payouts: true, cycles: { include: { entries: true } } },
  });

/**
 * Moves a `planned` round as far as it can go (to `submitted`). Idempotent and
 * resumable: each step checks what is already done. On error, the message is
 * stored on the round and rethrown; calling again resumes.
 */
export async function advanceRound(roundId: string): Promise<void> {
  const round = await loadRound(roundId);
  if (!round) throw new Error('round not found');
  if (round.status !== 'planned') return;
  const asset = getStellarAsset(round.assetSlug);
  if (!asset) throw new Error(`unknown asset ${round.assetSlug}`);

  try {
    await resolvePendingCycles(asset.network);
    if (round.channel === 'contract') await advanceContractRound(round, asset);
    else await advanceSdpRound(round, asset);
    await prisma.distributionRound.update({ where: { id: roundId }, data: { status: 'submitted', lastError: null } });
  } catch (error) {
    await prisma.distributionRound.update({ where: { id: roundId }, data: { lastError: errorMessage(error) } });
    throw error;
  }
  await syncRound(roundId);
}

async function advanceContractRound(round: LoadedRound, asset: StellarAsset): Promise<void> {
  const existing = await prisma.distributionCycle.findMany({ where: { roundId: round.id } });
  let cycleIds = existing.map((c) => c.cycleId);
  if (cycleIds.length === 0) {
    // As in tranche 2 step 1: the cycle holds the whole total (dust included,
    // it goes to the sweep) and covers every holder.
    const created = await createDistributorCycle(asset, {
      roundId: round.id,
      lines: round.payouts.map((p) => ({ address: p.address, amount: p.amount, push: p.channel === 'push' })),
      deposit: round.total,
      snapshotLedger: round.snapshotLedger,
      expiresAt: round.claimExpiresAt,
    });
    cycleIds = [created.cycleId];
  }
  await pushCycleEntries(asset, cycleIds);
}

async function advanceSdpRound(round: LoadedRound, asset: StellarAsset): Promise<void> {
  const network = asset.network;
  const sdp = getSdpConfig(network);
  if (!sdp) throw new Error(`this round was planned for the SDP, but no SDP is configured on ${network} anymore`);
  const sdpLines = round.payouts.filter((p) => p.channel === 'sdp');
  const claimLines = round.payouts.filter((p) => p.channel === 'claim');

  // 1 — Top up the SDP distribution account (exact shortfall, round id as memo).
  if (sdpLines.length > 0 && !round.fundedAt) {
    const required = sum(sdpLines.map((p) => p.amount)) + (await sdpInFlight(network, round.id));
    const { hash } = await topUpSdpAccount(network, sdp.distributionAddress, required, round.id);
    await prisma.distributionRound.update({
      where: { id: round.id },
      data: { fundedAt: new Date(), fundingTx: hash ?? round.fundingTx },
    });
  }

  // 2 — Claim cycle over the holders the SDP cannot pay (no trustline).
  if (claimLines.length > 0) {
    const existing = await prisma.distributionCycle.count({ where: { roundId: round.id } });
    if (existing === 0) {
      await createDistributorCycle(asset, {
        roundId: round.id,
        lines: claimLines.map((p) => ({ address: p.address, amount: p.amount, push: false })),
        deposit: sum(claimLines.map((p) => p.amount)),
        snapshotLedger: round.snapshotLedger,
        expiresAt: round.claimExpiresAt,
      });
    }
  }

  // 3 — SDP disbursement: create (or find the one a crash left behind), start.
  if (sdpLines.length === 0) return;
  let disbursementId = round.sdpDisbursementId;
  if (!disbursementId) {
    // No idempotency key on the SDP side: the round id in the name is how a
    // retry finds a disbursement whose id we never got to store.
    const found = (await findDisbursements(sdp, round.id)).find((d) => d.name.includes(round.id));
    disbursementId =
      found?.id ??
      (
        await createDisbursement(sdp, {
          name: `${asset.symbol} · ${round.createdAt.toISOString().slice(0, 10)} · ${round.id}`,
          assetId: await resolvePayAssetId(sdp),
          csv: buildSdpCsv(
            round.id,
            sdpLines.map((p) => ({ address: p.address, amount: p.amount })),
          ),
        })
      ).id;
    await prisma.distributionRound.update({ where: { id: round.id }, data: { sdpDisbursementId: disbursementId } });
  }

  const disbursement = await getDisbursement(sdp, disbursementId);
  if (disbursement.status === 'DRAFT') {
    throw new Error(
      `SDP disbursement ${disbursementId} is still DRAFT (instructions missing) — check it in the SDP dashboard`,
    );
  }
  if (disbursement.status === 'CANCELED') {
    throw new Error(`SDP disbursement ${disbursementId} was canceled in the SDP dashboard`);
  }
  if (disbursement.status === 'READY') {
    try {
      await startDisbursement(sdp, disbursementId);
    } catch (error) {
      // Another round consumed the balance in between: top up again on resume.
      if (error instanceof SdpInsufficientBalanceError) {
        await prisma.distributionRound.update({ where: { id: round.id }, data: { fundedAt: null } });
      }
      throw error;
    }
  }
  await prisma.distributionPayout.updateMany({
    where: { roundId: round.id, channel: 'sdp', status: 'draft' },
    data: { status: 'ready' },
  });
}

// ---- settlement --------------------------------------------------------------

/**
 * Pulls the SDP payment states into the payout lines and recomputes the round
 * status from them and from the distributor entries (the indexer keeps those
 * current from Paid events).
 */
export async function syncRound(roundId: string): Promise<void> {
  const round = await loadRound(roundId);
  if (!round || round.status === 'planned') return;

  const sdp = round.channel === 'sdp' ? getSdpConfig(round.network as StellarNetwork) : null;
  if (sdp && round.sdpDisbursementId) {
    const payments = new Map((await getDisbursementPayments(sdp, round.sdpDisbursementId)).map((p) => [p.address, p]));
    for (const payout of round.payouts.filter((p) => p.channel === 'sdp')) {
      const payment = payments.get(payout.address);
      if (!payment) continue;
      if (payout.status === 'rerouted') {
        // Re-routed to the claim path, yet paid by the SDP afterwards (a retry
        // from the SDP dashboard): flag the double payment, never hide it.
        if (payment.status === 'SUCCESS' && !payout.stellarTx) {
          await prisma.distributionPayout.update({
            where: { roundId_address: { roundId, address: payout.address } },
            data: {
              stellarTx: payment.txHash,
              error: `DOUBLE PAYMENT — paid by the SDP after being re-routed to claim cycle #${payout.reroutedCycleId}`,
            },
          });
        }
        continue;
      }
      const status = fromSdpStatus(payment.status);
      const paidAt = payment.status === 'SUCCESS' ? new Date(payment.updatedAt) : null;
      const error = payment.status === 'FAILED' ? payment.message : null;
      if (
        status !== payout.status ||
        payment.txHash !== payout.stellarTx ||
        payment.paymentId !== payout.sdpPaymentId ||
        error !== payout.error
      ) {
        await prisma.distributionPayout.update({
          where: { roundId_address: { roundId, address: payout.address } },
          data: { status, stellarTx: payment.txHash, sdpPaymentId: payment.paymentId, paidAt, error },
        });
      }
    }
  }

  const fresh = (await loadRound(roundId))!;
  const status = computeRoundStatus(
    fresh.payouts,
    fresh.cycles.flatMap((c) => c.entries),
  );
  if (status !== fresh.status) {
    await prisma.distributionRound.update({ where: { id: roundId }, data: { status } });
  }
}

/** Rounds the worker keeps in sync: in flight, needing attention, or recently re-routed. */
export async function syncActiveRounds(
  filter: { assetSlug?: string } = {},
): Promise<{ synced: number; errors: string[] }> {
  const rounds = await prisma.distributionRound.findMany({
    where: {
      ...filter,
      OR: [
        { status: { in: ['submitted', 'attention'] } },
        {
          status: 'settled',
          updatedAt: { gt: new Date(Date.now() - REROUTE_WATCH_MS) },
          payouts: { some: { status: 'rerouted' } },
        },
      ],
    },
    select: { id: true },
  });
  const errors: string[] = [];
  for (const { id } of rounds) {
    try {
      await syncRound(id);
    } catch (error) {
      errors.push(`${id}: ${errorMessage(error)}`);
    }
  }
  return { synced: rounds.length - errors.length, errors };
}

/**
 * Moves the failed SDP lines of a round to the claim path: one new distributor
 * cycle over exactly those lines, funded by the operator. Their USDC stays on
 * the SDP account and is deducted from the next top-up.
 *
 * The SDP has no FAILED → CANCELED transition, so a re-routed payment can
 * still be retried from the SDP dashboard — never do it: syncRound flags it
 * as a double payment.
 */
export async function rerouteFailed(roundId: string): Promise<{ cycleId: number; count: number }> {
  const round = await loadRound(roundId);
  if (!round) throw new Error('round not found');
  const asset = getStellarAsset(round.assetSlug);
  if (!asset) throw new Error(`unknown asset ${round.assetSlug}`);

  await resolvePendingCycles(asset.network);
  const failed = (await prisma.distributionPayout.findMany({ where: { roundId, channel: 'sdp' } })).filter(
    (p) => p.status === 'failed' || p.status === 'canceled',
  );
  if (failed.length === 0) throw new Error('no failed SDP line to re-route');
  assertClaimServable(asset, failed.length);

  const minExpiry = Date.now() + MIN_REROUTE_WINDOW_MS;
  const addresses = failed.map((p) => p.address);
  const created = await createDistributorCycle(asset, {
    roundId,
    lines: failed.map((p) => ({ address: p.address, amount: p.amount, push: false })),
    deposit: sum(failed.map((p) => p.amount)),
    snapshotLedger: round.snapshotLedger,
    expiresAt: new Date(Math.max(round.claimExpiresAt.getTime(), minExpiry)),
    // Same DB transaction as the cycle plan: lines and cycle never disagree.
    beforeCreate: (cycleId) => [
      prisma.distributionPayout.updateMany({
        where: { roundId, address: { in: addresses } },
        data: { status: 'rerouted', reroutedCycleId: cycleId, stellarTx: null },
      }),
    ],
  });
  await syncRound(roundId);
  return { cycleId: created.cycleId, count: failed.length };
}

// ---- views -------------------------------------------------------------------

export interface RoundLineView {
  address: string;
  shares: string;
  amount: string;
  channel: PayoutChannel;
  state: LineState;
  /** Raw SDP payment status (sdp lines). */
  sdpStatus: string | null;
  tx: string | null;
  error: string | null;
  doublePaid: boolean;
}

export interface RoundView {
  id: string;
  network: StellarNetwork;
  channel: RoundChannel;
  assetSlug: string;
  status: RoundStatus;
  total: string;
  dust: string;
  snapshotLedger: number;
  snapshotRoot: string;
  claimExpiresAt: string;
  createdAt: string;
  fundingTx: string | null;
  sdpDisbursementId: string | null;
  sdpUrl: string | null;
  lastError: string | null;
  cycles: { cycleId: number; createdTx: string | null }[];
  counts: { holders: number; paid: number; pending: number; claimable: number; failed: number; paidAmount: string };
  lines: RoundLineView[];
}

function toView(round: LoadedRound): RoundView {
  const entries = round.cycles.flatMap((c) => c.entries);
  const entryByAddress = new Map(entries.map((e) => [e.address, e]));
  const counts = countRound(round.payouts, entries);
  const sdp = round.channel === 'sdp' ? getSdpConfig(round.network as StellarNetwork) : null;
  return {
    id: round.id,
    network: round.network as StellarNetwork,
    channel: round.channel as RoundChannel,
    assetSlug: round.assetSlug,
    status: round.status as RoundStatus,
    total: round.total.toString(),
    dust: (round.total - sum(round.payouts.map((p) => p.amount))).toString(),
    snapshotLedger: round.snapshotLedger,
    snapshotRoot: round.snapshotRoot,
    claimExpiresAt: round.claimExpiresAt.toISOString(),
    createdAt: round.createdAt.toISOString(),
    fundingTx: round.fundingTx,
    sdpDisbursementId: round.sdpDisbursementId,
    sdpUrl: sdp && round.sdpDisbursementId ? sdpDisbursementUrl(sdp, round.sdpDisbursementId) : null,
    lastError: round.lastError,
    cycles: round.cycles
      .map((c) => ({ cycleId: c.cycleId, createdTx: c.createdTx }))
      .sort((a, b) => a.cycleId - b.cycleId),
    counts: { ...counts, paidAmount: counts.paidAmount.toString() },
    lines: round.payouts
      .map((p) => {
        const entry = entryByAddress.get(p.address);
        return {
          address: p.address,
          shares: p.shares.toString(),
          amount: p.amount.toString(),
          channel: p.channel as PayoutChannel,
          state: lineState(p, entry),
          sdpStatus: p.channel === 'sdp' ? p.status : null,
          tx: p.channel === 'sdp' && p.status !== 'rerouted' ? p.stellarTx : null,
          error: p.error,
          doublePaid: isDoublePaid(p),
        };
      })
      .sort((a, b) => (BigInt(b.amount) > BigInt(a.amount) ? 1 : -1)),
  };
}

export async function getRound(roundId: string): Promise<RoundView | null> {
  const round = await loadRound(roundId);
  return round ? toView(round) : null;
}

/** Every round of one asset, newest first, with lines (operator console). */
export async function listRounds(assetSlug: string): Promise<RoundView[]> {
  const rounds = await prisma.distributionRound.findMany({
    where: { assetSlug },
    orderBy: { createdAt: 'desc' },
    include: { payouts: true, cycles: { include: { entries: true } } },
  });
  return rounds.map(toView);
}
