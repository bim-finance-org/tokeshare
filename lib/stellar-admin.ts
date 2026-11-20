// Server-side operator primitives for revenue distributions: the snapshot,
// distributor cycles (create_cycle + distribute_for) and the funding of the
// SDP distribution account. The round state machine that sequences them lives
// in lib/stellar-rounds.ts.
//
// The distributor admin key lives in STELLAR_DISTRIBUTOR_ADMIN_SECRET and
// never leaves the server: it signs create_cycle, the distribute_for batches
// and the SDP top-ups, with the admin account as transaction source
// (source-account auth covers the whole invocation tree, including the USDC
// deposit pulled from the admin).
//
// Never import from client components.

import { Address, Contract, Keypair, TransactionBuilder, nativeToScVal, xdr } from '@stellar/stellar-sdk';
import { getNetworkProfile, type StellarNetwork } from '@/config/stellar';
import { type StellarAsset } from '@/config/stellar-assets';
import { getServer, stroopsToUnits, submitSignedXdr, unitsToStroops } from '@/lib/stellar';
import {
  buildClassicPaymentXdr,
  getClassicBalances,
  hasPaymentTrustline,
  readDistributorCycleCount,
  readTokenBalance,
} from '@/lib/stellar-assets';
import { buildDistribution, type ProvenEntry } from '@/lib/stellar-merkle';
import { prisma } from '@/lib/prisma';
import { syncCycleClaimed } from '@/lib/stellar-cycle-accounting';
import { errorMessage } from '@/lib/error-message';

const INCLUSION_FEE = '100000';
/** Initial distribute_for batch size; batches split themselves on resource limits. */
const INITIAL_BATCH_SIZE = Number(process.env.STELLAR_DISTRIBUTE_BATCH_SIZE) || 10;

function adminKeypair(): Keypair {
  const secret = process.env.STELLAR_DISTRIBUTOR_ADMIN_SECRET;
  if (!secret) throw new Error('STELLAR_DISTRIBUTOR_ADMIN_SECRET is not set');
  return Keypair.fromSecret(secret);
}

// ---- snapshot --------------------------------------------------------------

export interface SnapshotLine {
  address: string;
  /** Token base units held at the snapshot. */
  shares: bigint;
  /** Payout in USDC stroops. */
  amount: bigint;
  /** In the operator push batch — false = no USDC trustline, left for claim. */
  push: boolean;
}

export interface Snapshot {
  snapshotLedger: number;
  lines: SnapshotLine[];
  eligibleShares: bigint;
  /** Sub-stroop remainder of the pro-rata split; stays for the sweep. */
  dust: bigint;
  /** Addresses left out of the tree entirely (inventory, operator, config). */
  excluded: string[];
}

/**
 * Computes one cycle's payout list. The address SET comes from the indexer;
 * every balance is re-read from the token contract now (authoritative).
 *
 * Two different exclusions, deliberately kept apart:
 * - inventory/operator addresses are OUT OF THE TREE — paying the sale
 *   contract or ourselves would be Tokeshare distributing to itself;
 * - holders without a USDC trustline STAY IN THE TREE but out of the push
 *   batch (one failing transfer would abort a whole batch) — their line is
 *   what the claim path serves once they open a trustline.
 */
export async function computeSnapshot(asset: StellarAsset, totalStroops: bigint): Promise<Snapshot> {
  if (totalStroops <= 0n) throw new Error('total must be positive');
  const profile = getNetworkProfile(asset.network);

  const holders = await prisma.stellarHolder.findMany({ where: { assetSlug: asset.slug } });
  if (holders.length === 0) {
    throw new Error(`no indexed holders for ${asset.slug} — start the indexer or run npm run indexer:seed`);
  }

  const configured = (process.env.STELLAR_SNAPSHOT_EXCLUDE ?? '')
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean);
  const excludeSet = new Set([asset.saleId, adminKeypair().publicKey(), ...configured].filter(Boolean));

  const latest = await getServer(profile.rpcUrl).getLatestLedger();

  const balances: { address: string; shares: bigint }[] = [];
  const excluded: string[] = [];
  for (const holder of holders) {
    if (excludeSet.has(holder.address)) {
      excluded.push(holder.address);
      continue;
    }
    const shares = await readTokenBalance(profile, asset.tokenId, holder.address);
    if (shares > 0n) balances.push({ address: holder.address, shares });
  }
  if (balances.length === 0) throw new Error('no eligible holders after exclusions');

  const eligibleShares = balances.reduce((a, b) => a + b.shares, 0n);
  const lines: SnapshotLine[] = [];
  for (const { address, shares } of balances) {
    const amount = (totalStroops * shares) / eligibleShares; // floor — dust stays for the sweep
    if (amount === 0n) continue;
    // Contract addresses hold SAC balances without trustlines; only classic
    // G-accounts need one to receive USDC.
    const push = address.startsWith('C') ? true : await hasPaymentTrustline(profile, address);
    lines.push({ address, shares, amount, push });
  }

  const dust = totalStroops - lines.reduce((a, l) => a + l.amount, 0n);
  return { snapshotLedger: latest.sequence, lines, eligibleShares, dust, excluded };
}

// ---- on-chain invocation ---------------------------------------------------

async function invokeAsAdmin(
  asset: StellarAsset,
  contractId: string,
  method: string,
  args: xdr.ScVal[],
): Promise<string> {
  const profile = getNetworkProfile(asset.network);
  const server = getServer(profile.rpcUrl);
  const keypair = adminKeypair();
  const account = await server.getAccount(keypair.publicKey());
  const tx = new TransactionBuilder(account, { fee: INCLUSION_FEE, networkPassphrase: profile.networkPassphrase })
    .addOperation(new Contract(contractId).call(method, ...args))
    .setTimeout(180)
    .build();
  const prepared = await server.prepareTransaction(tx);
  prepared.sign(keypair);
  return submitSignedXdr(profile, prepared.toXDR());
}

/** Soroban Entry struct → ScMap. Keys MUST be alphabetical (XDR map order). */
const entryScVal = (entry: ProvenEntry): xdr.ScVal =>
  xdr.ScVal.scvMap([
    new xdr.ScMapEntry({
      key: xdr.ScVal.scvSymbol('amount'),
      val: nativeToScVal(entry.amount, { type: 'i128' }),
    }),
    new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol('holder'), val: new Address(entry.address).toScVal() }),
    new xdr.ScMapEntry({
      key: xdr.ScVal.scvSymbol('proof'),
      val: xdr.ScVal.scvVec(entry.proof.map((h) => xdr.ScVal.scvBytes(Buffer.from(h, 'hex')))),
    }),
  ]);

const isResourceError = (error: unknown): boolean =>
  /resource|budget|exceed|limit|too large/i.test(errorMessage(error, ''));

/**
 * Pushes the payout lines in batches, splitting any batch the network's
 * per-transaction resource limits reject. distribute_for skips already-paid
 * lines on-chain, so a retried or overlapping batch never double-pays.
 */
async function pushInBatches(
  asset: StellarAsset,
  distributorId: string,
  cycleId: number,
  entries: ProvenEntry[],
): Promise<string[]> {
  const queue: ProvenEntry[][] = [];
  for (let i = 0; i < entries.length; i += INITIAL_BATCH_SIZE) queue.push(entries.slice(i, i + INITIAL_BATCH_SIZE));

  const hashes: string[] = [];
  while (queue.length > 0) {
    const batch = queue.shift()!;
    try {
      const hash = await invokeAsAdmin(asset, distributorId, 'distribute_for', [
        nativeToScVal(cycleId, { type: 'u32' }),
        xdr.ScVal.scvVec(batch.map(entryScVal)),
      ]);
      hashes.push(hash);
    } catch (error) {
      if (batch.length > 1 && isResourceError(error)) {
        const mid = Math.ceil(batch.length / 2);
        queue.unshift(batch.slice(0, mid), batch.slice(mid));
        continue;
      }
      throw error;
    }
  }
  return hashes;
}

// ---- distributor cycles ----------------------------------------------------

export interface CycleLine {
  address: string;
  amount: bigint;
  /** In the distribute_for push — false = left for the claim path. */
  push: boolean;
}

export interface CreatedCycle {
  cycleId: number;
  createTx: string;
  entries: ProvenEntry[];
}

/**
 * Settles cycle plans a crash left behind (row persisted, createdTx unknown)
 * on one network, before any new cycle id is read:
 * - the on-chain count moved past the plan → create_cycle landed; the row is
 *   kept and the indexer fills createdTx from the cycle_created event;
 * - it did not → the id was never consumed; the plan is dropped (and any SDP
 *   line re-routed to it goes back to `failed`) so the id can be reused.
 */
export async function resolvePendingCycles(network: StellarNetwork): Promise<void> {
  const profile = getNetworkProfile(network);
  if (!profile.distributorId) return;
  const pending = await prisma.distributionCycle.findMany({ where: { network, createdTx: null } });
  if (pending.length === 0) return;
  const count = Number(await readDistributorCycleCount(profile, profile.distributorId));
  for (const cycle of pending) {
    if (count > cycle.cycleId) continue;
    await prisma.$transaction([
      prisma.distributionPayout.updateMany({
        where: { roundId: cycle.roundId ?? '', reroutedCycleId: cycle.cycleId, status: 'rerouted' },
        data: { status: 'failed', reroutedCycleId: null },
      }),
      prisma.distributionEntry.deleteMany({ where: { network, cycleId: cycle.cycleId } }),
      prisma.distributionCycle.delete({ where: { network_cycleId: { network, cycleId: cycle.cycleId } } }),
    ]);
  }
}

/**
 * Creates one distributor cycle over `lines` for a round: Merkle tree →
 * persist the plan (entries + proofs exist nowhere else) → create_cycle,
 * which pulls `deposit` USDC from the admin account.
 *
 * `beforeCreate` runs inside the plan's DB transaction — callers use it to
 * tie their own rows to the cycle id atomically (e.g. marking SDP lines as
 * re-routed), so a crash can never leave the two out of step.
 * Callers MUST run resolvePendingCycles(network) first.
 */
export async function createDistributorCycle(
  asset: StellarAsset,
  input: {
    roundId: string;
    lines: CycleLine[];
    deposit: bigint;
    snapshotLedger: number;
    expiresAt: Date;
    beforeCreate?: (cycleId: number) => ReturnType<typeof prisma.distributionPayout.updateMany>[];
  },
): Promise<CreatedCycle> {
  const profile = getNetworkProfile(asset.network);
  if (!profile.distributorId) throw new Error(`no distributor deployed on ${profile.network}`);
  if (input.lines.length === 0) throw new Error('empty cycle');
  const lineSum = input.lines.reduce((a, l) => a + l.amount, 0n);
  if (input.deposit < lineSum) throw new Error('cycle deposit below the sum of its lines');

  const cycleId = Number(await readDistributorCycleCount(profile, profile.distributorId));
  const { root, entries } = buildDistribution(
    cycleId,
    input.lines.map(({ address, amount }) => ({ address, amount })),
  );
  const pushByAddress = new Map(input.lines.map((l) => [l.address, l.push]));
  const network = profile.network;

  await prisma.$transaction([
    prisma.distributionCycle.create({
      data: {
        network,
        cycleId,
        roundId: input.roundId,
        assetSlug: asset.slug,
        tokenId: asset.tokenId,
        total: input.deposit,
        root,
        snapshotLedger: input.snapshotLedger,
        expiresAt: input.expiresAt,
      },
    }),
    prisma.distributionEntry.createMany({
      data: entries.map((entry) => ({
        network,
        cycleId,
        address: entry.address,
        amount: entry.amount,
        proof: entry.proof,
        excluded: !pushByAddress.get(entry.address),
      })),
    }),
    ...(input.beforeCreate?.(cycleId) ?? []),
  ]);

  const createTx = await invokeAsAdmin(asset, profile.distributorId, 'create_cycle', [
    new Address(asset.tokenId).toScVal(),
    nativeToScVal(input.deposit, { type: 'i128' }),
    nativeToScVal(input.snapshotLedger, { type: 'u32' }),
    xdr.ScVal.scvBytes(Buffer.from(root, 'hex')),
    nativeToScVal(BigInt(Math.floor(input.expiresAt.getTime() / 1000)), { type: 'u64' }),
  ]);
  await prisma.distributionCycle.update({
    where: { network_cycleId: { network, cycleId } },
    data: { createdTx: createTx },
  });
  return { cycleId, createTx, entries };
}

/**
 * Pushes every unpaid, non-excluded entry of the given cycles. Safe to re-run:
 * distribute_for skips already-paid lines on-chain. Settlement is recorded
 * optimistically for immediate operator feedback; the indexer re-confirms the
 * same facts from the Paid events.
 */
export async function pushCycleEntries(asset: StellarAsset, cycleIds: number[]): Promise<string[]> {
  const profile = getNetworkProfile(asset.network);
  if (!profile.distributorId) throw new Error(`no distributor deployed on ${profile.network}`);
  const network = profile.network;
  const hashes: string[] = [];
  for (const cycleId of cycleIds) {
    const rows = await prisma.distributionEntry.findMany({
      where: { network, cycleId, excluded: false, paidAt: null },
    });
    if (rows.length === 0) continue;
    const entries: ProvenEntry[] = rows.map((r) => ({
      address: r.address,
      amount: r.amount,
      proof: r.proof as string[],
    }));
    hashes.push(...(await pushInBatches(asset, profile.distributorId, cycleId, entries)));
    await prisma.distributionEntry.updateMany({
      where: { network, cycleId, address: { in: entries.map((e) => e.address) } },
      data: { paidAt: new Date(), pushed: true },
    });
    await syncCycleClaimed(network, cycleId);
  }
  return hashes;
}

// ---- SDP distribution account top-up ----------------------------------------

/**
 * Tops up the SDP distribution account so it covers `required` stroops of
 * USDC on top of what it already holds. Returns the payment hash, or null
 * when the balance already suffices. The memo carries the round id, so every
 * top-up is traceable on Stellar Expert.
 */
export async function topUpSdpAccount(
  network: StellarNetwork,
  sdpAddress: string,
  required: bigint,
  memo: string,
): Promise<{ hash: string | null; sent: bigint }> {
  const profile = getNetworkProfile(network);
  const balance = unitsToStroops((await getClassicBalances(profile, sdpAddress)).usdc);
  const missing = required - balance;
  if (missing <= 0n) return { hash: null, sent: 0n };

  const keypair = adminKeypair();
  const unsigned = await buildClassicPaymentXdr(profile, {
    from: keypair.publicKey(),
    to: sdpAddress,
    code: profile.pay.code,
    issuer: profile.pay.issuer,
    amount: stroopsToUnits(missing),
    memo: { type: 'text', value: memo.slice(0, 28) },
  });
  const tx = TransactionBuilder.fromXDR(unsigned, profile.networkPassphrase);
  tx.sign(keypair);
  return { hash: await submitSignedXdr(profile, tx.toXDR()), sent: missing };
}
