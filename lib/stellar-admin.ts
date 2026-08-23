// Server-side operator logic for distribution cycles (dashboard console).
//
// The distributor admin key lives in STELLAR_DISTRIBUTOR_ADMIN_SECRET and
// never leaves the server: the console's "one click" signs create_cycle and
// the distribute_for batches here, with the admin account as transaction
// source (source-account auth covers the whole invocation tree, including the
// USDC deposit pulled from the admin).
//
// Never import from client components.

import { Address, Contract, Keypair, TransactionBuilder, nativeToScVal, xdr } from '@stellar/stellar-sdk';
import { getNetworkProfile } from '@/config/stellar';
import { type StellarAsset } from '@/config/stellar-assets';
import { getServer, submitSignedXdr } from '@/lib/stellar';
import { hasPaymentTrustline, readDistributorCycleCount, readTokenBalance } from '@/lib/stellar-assets';
import { buildDistribution, type ProvenEntry } from '@/lib/stellar-merkle';
import { prisma } from '@/lib/prisma';

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
  error instanceof Error && /resource|budget|exceed|limit|too large/i.test(error.message);

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

// ---- the one click ---------------------------------------------------------

export interface CycleResult {
  cycleId: number;
  root: string;
  snapshotLedger: number;
  expiresAt: string;
  createTx: string;
  pushTxs: string[];
  pushedCount: number;
  claimableCount: number;
  dust: string;
}

/**
 * Runs a full distribution cycle: snapshot → Merkle tree → persist the plan →
 * create_cycle (deposits the USDC) → distribute_for batches.
 *
 * The plan (entries + proofs) is persisted BEFORE the on-chain calls: proofs
 * exist nowhere else, and a crash after create_cycle must never leave a funded
 * cycle whose list is lost. If create_cycle itself fails, the cycle id was
 * never consumed and re-running simply overwrites the plan.
 */
export async function executeCycle(asset: StellarAsset, totalStroops: bigint, expiresDays: number): Promise<CycleResult> {
  const profile = getNetworkProfile(asset.network);
  if (!profile.distributorId) throw new Error(`no distributor deployed on ${profile.network}`);

  const snapshot = await computeSnapshot(asset, totalStroops);
  const cycleId = Number(await readDistributorCycleCount(profile, profile.distributorId));
  const { root, entries } = buildDistribution(
    cycleId,
    snapshot.lines.map(({ address, amount }) => ({ address, amount })),
  );
  const pushByAddress = new Map(snapshot.lines.map((l) => [l.address, l.push]));
  const expiresAt = new Date(Date.now() + expiresDays * 86_400_000);

  const network = profile.network;
  await prisma.$transaction([
    prisma.distributionEntry.deleteMany({ where: { network, cycleId } }),
    prisma.distributionCycle.upsert({
      where: { network_cycleId: { network, cycleId } },
      update: { total: totalStroops, root, snapshotLedger: snapshot.snapshotLedger, expiresAt },
      create: {
        network,
        cycleId,
        assetSlug: asset.slug,
        tokenId: asset.tokenId,
        total: totalStroops,
        root,
        snapshotLedger: snapshot.snapshotLedger,
        expiresAt,
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
  ]);

  const createTx = await invokeAsAdmin(asset, profile.distributorId, 'create_cycle', [
    new Address(asset.tokenId).toScVal(),
    nativeToScVal(totalStroops, { type: 'i128' }),
    nativeToScVal(snapshot.snapshotLedger, { type: 'u32' }),
    xdr.ScVal.scvBytes(Buffer.from(root, 'hex')),
    nativeToScVal(BigInt(Math.floor(expiresAt.getTime() / 1000)), { type: 'u64' }),
  ]);
  await prisma.distributionCycle.update({
    where: { network_cycleId: { network, cycleId } },
    data: { createdTx: createTx },
  });

  const pushEntries = entries.filter((e) => pushByAddress.get(e.address));
  const pushTxs = await pushInBatches(asset, profile.distributorId, cycleId, pushEntries);

  // Optimistic settlement for immediate operator feedback; the indexer
  // re-confirms the same facts from the Paid events.
  await prisma.$transaction([
    prisma.distributionEntry.updateMany({
      where: { network, cycleId, address: { in: pushEntries.map((e) => e.address) } },
      data: { paidAt: new Date(), pushed: true },
    }),
    prisma.distributionCycle.update({
      where: { network_cycleId: { network, cycleId } },
      data: { claimed: pushEntries.reduce((a, e) => a + e.amount, 0n) },
    }),
  ]);

  return {
    cycleId,
    root,
    snapshotLedger: snapshot.snapshotLedger,
    expiresAt: expiresAt.toISOString(),
    createTx,
    pushTxs,
    pushedCount: pushEntries.length,
    claimableCount: entries.length - pushEntries.length,
    dust: snapshot.dust.toString(),
  };
}
