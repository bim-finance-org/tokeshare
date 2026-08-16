// Merkle tree for USDC revenue distributions (Stellar tranche 2).
//
// The operator computes each cycle's payout list off-chain, publishes only the
// 32-byte root on-chain (distributor contract), and every payout — pushed via
// `distribute_for` or claimed by the holder — carries a proof the contract
// re-verifies against that root.
//
// ⚠️ This encoding is mirrored bit-for-bit by the Rust side in
// tokeshare-stellar-contracts/contracts/distributor (merkle module). The two
// implementations share a parity test pinned to the same root constant: any
// change here MUST be reflected there, and both fixtures re-generated together.
//
// Spec:
//   leaf  = sha256(0x00 ‖ cycle_id u32 BE ‖ address strkey ASCII (56 bytes)
//                       ‖ amount i128 BE (16 bytes))
//   node  = sha256(0x01 ‖ min(a, b) ‖ max(a, b))     // byte-lexicographic
//   tree  = leaves sorted ascending by hash; an unpaired trailing node is
//           carried up unchanged (never duplicated)
//
// The 0x00/0x01 domain prefixes stop a 64-byte leaf payload from being
// re-interpreted as an internal node (second-preimage hardening); sorted node
// pairs make proofs position-free; sorted leaves make the root canonical for a
// given payout set regardless of input order.

import { createHash } from 'node:crypto';

/** One payout line: `amount` is in payment-asset stroops (7 decimals). */
export interface DistributionEntry {
  /** G... or C... strkey (56 ASCII chars). */
  address: string;
  amount: bigint;
}

/** An entry enriched with the sibling hashes proving its inclusion. */
export interface ProvenEntry extends DistributionEntry {
  /** Sibling hashes from leaf to root, lowercase hex. */
  proof: string[];
}

export interface Distribution {
  /** Merkle root, lowercase hex (64 chars). */
  root: string;
  /** Entries in canonical (leaf-hash) order, each with its proof. */
  entries: ProvenEntry[];
}

const LEAF_PREFIX = 0x00;
const NODE_PREFIX = 0x01;
const STRKEY_LENGTH = 56;
const I128_MAX = (1n << 127n) - 1n;

const sha256 = (data: Buffer): Buffer => createHash('sha256').update(data).digest();

export function leafHash(cycleId: number, address: string, amount: bigint): Buffer {
  if (!Number.isInteger(cycleId) || cycleId < 0 || cycleId > 0xffffffff) {
    throw new Error(`cycle id out of u32 range: ${cycleId}`);
  }
  if (address.length !== STRKEY_LENGTH || !/^[GC][A-Z2-7]{55}$/.test(address)) {
    throw new Error(`not a G.../C... strkey: ${address}`);
  }
  if (amount <= 0n || amount > I128_MAX) {
    throw new Error(`amount out of range (must be positive i128): ${amount}`);
  }
  const buf = Buffer.alloc(1 + 4 + STRKEY_LENGTH + 16);
  buf[0] = LEAF_PREFIX;
  buf.writeUInt32BE(cycleId, 1);
  buf.write(address, 5, 'ascii');
  buf.writeBigUInt64BE(amount >> 64n, 5 + STRKEY_LENGTH);
  buf.writeBigUInt64BE(amount & 0xffffffffffffffffn, 5 + STRKEY_LENGTH + 8);
  return sha256(buf);
}

function nodeHash(a: Buffer, b: Buffer): Buffer {
  const [lo, hi] = Buffer.compare(a, b) <= 0 ? [a, b] : [b, a];
  return sha256(Buffer.concat([Buffer.from([NODE_PREFIX]), lo, hi]));
}

/**
 * Builds the canonical tree for one cycle and returns the root plus a proof
 * per entry. Rejects duplicate addresses: one payout line per holder.
 */
export function buildDistribution(cycleId: number, entries: DistributionEntry[]): Distribution {
  if (entries.length === 0) throw new Error('empty distribution');
  const seen = new Set<string>();
  for (const { address } of entries) {
    if (seen.has(address)) throw new Error(`duplicate address: ${address}`);
    seen.add(address);
  }

  const sorted = entries
    .map((entry) => ({ entry, hash: leafHash(cycleId, entry.address, entry.amount) }))
    .sort((a, b) => Buffer.compare(a.hash, b.hash));

  // Walk the levels bottom-up, recording each leaf's sibling as we go. An
  // unpaired trailing node is carried up as-is and contributes no proof step.
  const proofs: Buffer[][] = sorted.map(() => []);
  let level = sorted.map(({ hash }) => hash);
  let positions = sorted.map((_, i) => i); // leaf index → position in `level`
  while (level.length > 1) {
    const next: Buffer[] = [];
    for (let i = 0; i < level.length; i += 2) {
      next.push(i + 1 < level.length ? nodeHash(level[i], level[i + 1]) : level[i]);
    }
    positions = positions.map((pos, leaf) => {
      const sibling = pos ^ 1;
      if (sibling < level.length) proofs[leaf].push(level[sibling]);
      return pos >> 1;
    });
    level = next;
  }

  return {
    root: level[0].toString('hex'),
    entries: sorted.map(({ entry }, i) => ({ ...entry, proof: proofs[i].map((h) => h.toString('hex')) })),
  };
}

/** Recomputes the path from one entry and its proof; true iff it lands on `root`. */
export function verifyProof(
  cycleId: number,
  address: string,
  amount: bigint,
  proof: string[],
  root: string,
): boolean {
  let hash = leafHash(cycleId, address, amount);
  for (const sibling of proof) hash = nodeHash(hash, Buffer.from(sibling, 'hex'));
  return hash.toString('hex') === root.toLowerCase();
}
