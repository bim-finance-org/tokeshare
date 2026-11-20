// Read-side data access for the Stellar tranche 2 API: portfolio, holders,
// trades and distribution history, all served from the indexer-maintained
// tables (never from live RPC calls — the API stays fast and rate-limit-free).
//
// Amounts are stroops (7 decimals) serialized as decimal strings: BigInt does
// not survive JSON, and strings keep full precision for the client.

import { getStellarAsset, isAssetConfigured, STELLAR_ASSETS } from '@/config/stellar-assets';
import { prisma } from '@/lib/prisma';
import { countRound } from '@/lib/stellar-round-state';

const str = (value: bigint | null | undefined): string | null =>
  value === null || value === undefined ? null : value.toString();

export const isStrkey = (address: string): boolean => /^[GC][A-Z2-7]{55}$/.test(address);

/**
 * Payout-line status, derived — never stored, so it cannot drift:
 * `paid` (settled on-chain), `claimable` (excluded from the push batch — the
 * claim path serves these), `pending` (in a push batch not yet settled).
 */
const entryStatus = (entry: { paidAt: Date | null; excluded: boolean }): 'paid' | 'claimable' | 'pending' =>
  entry.paidAt ? 'paid' : entry.excluded ? 'claimable' : 'pending';

/** SDP payout lines a holder sees (a re-routed line shows through its claim entry instead). */
const visibleSdpPayouts = { channel: 'sdp', status: { not: 'rerouted' } } as const;

const serializeCycle = (cycle: {
  network: string;
  cycleId: number;
  assetSlug: string;
  total: bigint;
  claimed: bigint;
  root: string;
  snapshotLedger: number;
  expiresAt: Date;
  sweptAt: Date | null;
  createdTx: string | null;
  createdAt: Date;
}) => ({
  network: cycle.network,
  cycleId: cycle.cycleId,
  assetSlug: cycle.assetSlug,
  total: str(cycle.total),
  claimed: str(cycle.claimed),
  root: cycle.root,
  snapshotLedger: cycle.snapshotLedger,
  expiresAt: cycle.expiresAt.toISOString(),
  sweptAt: cycle.sweptAt?.toISOString() ?? null,
  createdTx: cycle.createdTx,
  createdAt: cycle.createdAt.toISOString(),
});

// ---- per-asset views -------------------------------------------------------

/**
 * Distribution history of one asset: every round (one payout), newest first,
 * with its delivery state across channels (SDP payments + distributor
 * entries). Operator-only fields (errors, SDP ids) stay out of this public view.
 */
export async function getAssetDistributions(slug: string) {
  const rounds = await prisma.distributionRound.findMany({
    where: { assetSlug: slug, status: { not: 'planned' } },
    orderBy: { createdAt: 'desc' },
    include: { payouts: true, cycles: { include: { entries: true } } },
  });
  return rounds.map((round) => {
    const counts = countRound(
      round.payouts,
      round.cycles.flatMap((c) => c.entries),
    );
    return {
      id: round.id,
      network: round.network,
      channel: round.channel,
      status: round.status,
      total: str(round.payouts.reduce((a, p) => a + p.amount, 0n)),
      paid: str(counts.paidAmount),
      holders: counts.holders,
      paidCount: counts.paid,
      claimableCount: counts.claimable,
      snapshotLedger: round.snapshotLedger,
      snapshotRoot: round.snapshotRoot,
      claimExpiresAt: round.claimExpiresAt.toISOString(),
      createdAt: round.createdAt.toISOString(),
      cycles: round.cycles.map((c) => serializeCycle(c)),
    };
  });
}

/** Cap table of one asset, from the indexer's holder set. */
export async function getAssetHolders(slug: string) {
  const asset = getStellarAsset(slug);
  const holders = await prisma.stellarHolder.findMany({
    where: { assetSlug: slug, balance: { gt: 0n } },
    orderBy: { balance: 'desc' },
  });
  return holders.map((h) => ({
    address: h.address,
    balance: str(h.balance),
    // The sale contract's balance is unsold inventory, not an investor —
    // flagged so UIs and the snapshot console can set it apart.
    isSaleInventory: h.address === asset?.saleId,
    updatedAt: h.updatedAt.toISOString(),
  }));
}

/** Recent buys/sells of one asset (USDC leg included when indexed). */
export async function getAssetActivity(slug: string, limit: number) {
  const trades = await prisma.stellarTrade.findMany({
    where: { assetSlug: slug },
    orderBy: { at: 'desc' },
    take: limit,
  });
  return trades.map((t) => ({
    kind: t.kind,
    address: t.address,
    shares: str(t.shares),
    usdc: str(t.usdc),
    txHash: t.txHash,
    ledger: t.ledger,
    at: t.at.toISOString(),
  }));
}

// ---- per-investor views ----------------------------------------------------

/** Holdings + trade and distribution totals for one address, per asset. */
export async function getPortfolio(address: string) {
  const [holdings, trades, entries, sdpPayouts] = await Promise.all([
    prisma.stellarHolder.findMany({ where: { address } }),
    prisma.stellarTrade.findMany({ where: { address } }),
    prisma.distributionEntry.findMany({ where: { address }, include: { cycle: { select: { assetSlug: true } } } }),
    prisma.distributionPayout.findMany({
      where: { address, ...visibleSdpPayouts, status: 'success' },
      include: { round: { select: { assetSlug: true } } },
    }),
  ]);

  const slugs = new Set([...holdings.map((h) => h.assetSlug), ...trades.map((t) => t.assetSlug)]);
  const assets = [...slugs]
    .map((slug) => {
      const asset = getStellarAsset(slug);
      const mine = trades.filter((t) => t.assetSlug === slug);
      const myEntries = entries.filter((e) => e.cycle.assetSlug === slug);
      const sum = (values: bigint[]) => values.reduce((a, b) => a + b, 0n);
      return {
        slug,
        symbol: asset?.symbol ?? slug,
        name: asset?.name ?? slug,
        network: asset?.network ?? 'mainnet',
        balance: str(holdings.find((h) => h.assetSlug === slug)?.balance ?? 0n),
        bought: str(sum(mine.filter((t) => t.kind === 'buy').map((t) => t.shares))),
        sold: str(sum(mine.filter((t) => t.kind === 'sell').map((t) => t.shares))),
        invested: str(sum(mine.filter((t) => t.kind === 'buy' && t.usdc).map((t) => t.usdc!))),
        divested: str(sum(mine.filter((t) => t.kind === 'sell' && t.usdc).map((t) => t.usdc!))),
        distributionsReceived: str(
          sum([
            ...myEntries.filter((e) => e.paidAt).map((e) => e.amount),
            ...sdpPayouts.filter((p) => p.round.assetSlug === slug).map((p) => p.amount),
          ]),
        ),
        distributionsClaimable: str(sum(myEntries.filter((e) => entryStatus(e) === 'claimable').map((e) => e.amount))),
      };
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));
  return { address, assets };
}

/**
 * Every payout line of one address, newest first: distributor entries
 * (claimables carry their proof) and SDP payments. `cycleId` is set only on
 * distributor lines — it is what the claim flow needs.
 */
export async function getPortfolioDistributions(address: string) {
  const [entries, payouts] = await Promise.all([
    prisma.distributionEntry.findMany({ where: { address }, include: { cycle: true } }),
    prisma.distributionPayout.findMany({ where: { address, ...visibleSdpPayouts }, include: { round: true } }),
  ]);

  const fromEntries = entries.map((entry) => {
    const status = entryStatus(entry);
    return {
      network: entry.network,
      channel: 'distributor' as const,
      roundId: entry.cycle.roundId,
      cycleId: entry.cycleId as number | null,
      assetSlug: entry.cycle.assetSlug,
      amount: str(entry.amount),
      status: status as 'paid' | 'claimable' | 'pending' | 'failed',
      pushed: entry.pushed,
      paidAt: entry.paidAt?.toISOString() ?? null,
      paidTx: entry.paidTx,
      expiresAt: entry.cycle.expiresAt.toISOString() as string | null,
      expired: entry.cycle.expiresAt.getTime() <= Date.now() || entry.cycle.sweptAt !== null,
      at: entry.cycle.createdAt,
      // The proof is only actionable on a claimable line; omitting it
      // elsewhere keeps payloads small.
      proof: status === 'claimable' ? (entry.proof as string[]) : undefined,
    };
  });

  const fromSdp = payouts.map((payout) => ({
    network: payout.round.network,
    channel: 'sdp' as const,
    roundId: payout.roundId as string | null,
    cycleId: null as number | null,
    assetSlug: payout.round.assetSlug,
    amount: str(payout.amount),
    status: (payout.status === 'success'
      ? 'paid'
      : payout.status === 'failed' || payout.status === 'canceled'
        ? 'failed'
        : 'pending') as 'paid' | 'claimable' | 'pending' | 'failed',
    pushed: true as boolean | null,
    paidAt: payout.paidAt?.toISOString() ?? null,
    paidTx: payout.stellarTx,
    expiresAt: null as string | null,
    expired: false,
    at: payout.round.createdAt,
    proof: undefined as string[] | undefined,
  }));

  const lines = [...fromEntries, ...fromSdp].sort((a, b) => b.at.getTime() - a.at.getTime());
  for (const line of lines) delete (line as { at?: Date }).at;
  return lines;
}

/** True when the slug names a configured (deployed) registry asset. */
export const isKnownAsset = (slug: string): boolean => {
  const asset = getStellarAsset(slug);
  return !!asset && isAssetConfigured(asset);
};

export { STELLAR_ASSETS };
