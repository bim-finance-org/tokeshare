import { describe, expect, it } from 'vitest';
import { buildDistribution, leafHash, verifyProof } from './stellar-merkle';

// ---------------------------------------------------------------------------
// Cross-language parity fixture.
//
// The SAME entries live in tokeshare-stellar-contracts
// (contracts/distributor/src/test.rs), and both suites pin the SAME root. If
// either implementation drifts in encoding — prefixes, endianness, sorting,
// carry rule — its root changes and its parity test fails. Regenerate both
// pins together, never one side alone.
// ---------------------------------------------------------------------------

const CYCLE_ID = 3;

const ENTRIES = [
  { address: 'GDISGKKBAA2S5ISUTNYHSQ5VN7X7O73JKALMBUHRHZE2XFZRF64R3EVL', amount: 274_400_000n },
  { address: 'GCBHFIQNNXYC6AVKCFAC3I6EN3E2ZDNBIQ6RUSZDS2IMYVRXAWZH3OYZ', amount: 171_500_000n },
  { address: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN', amount: 137_200_000n },
  { address: 'GCYG5OOZY4O2EZOY7OPT4FYY2XWZQ3WCX6M24CVWWHTV67ATKAVK77QC', amount: 68_600_000n },
  { address: 'CC2MTI3REEQUMDJYOLQHK4D6GPGSTGPZOWH3G75SECSOTOH7L7GGLG5O', amount: 6_860_000n },
  { address: 'CAFYUWC2U7GX4DNG6JRZLPYDNXDOLJNHP5RWVAMOTOA5QO75N4B56X45', amount: 1n },
];

/** Pinned in the Rust suite as EXPECTED_ROOT — never change one side alone. */
const EXPECTED_ROOT = '320f924316b09f54f84933fe9dd86f155d3c5b0f992d8ccc2234169f3c083b64';

describe('parity with the Rust verifier', () => {
  it('produces the pinned fixture root', () => {
    expect(buildDistribution(CYCLE_ID, ENTRIES).root).toBe(EXPECTED_ROOT);
  });

  it('is insensitive to input order', () => {
    const shuffled = [...ENTRIES].reverse();
    expect(buildDistribution(CYCLE_ID, shuffled).root).toBe(EXPECTED_ROOT);
  });
});

describe('buildDistribution', () => {
  it('emits a verifying proof for every entry', () => {
    const { root, entries } = buildDistribution(CYCLE_ID, ENTRIES);
    for (const { address, amount, proof } of entries) {
      expect(verifyProof(CYCLE_ID, address, amount, proof, root)).toBe(true);
    }
  });

  it('handles odd leaf counts (carried node, shorter proof)', () => {
    const { root, entries } = buildDistribution(9, ENTRIES.slice(0, 5));
    for (const { address, amount, proof } of entries) {
      expect(verifyProof(9, address, amount, proof, root)).toBe(true);
    }
  });

  it('single entry: root is the leaf, proof is empty', () => {
    const [entry] = ENTRIES;
    const { root, entries } = buildDistribution(7, [entry]);
    expect(root).toBe(leafHash(7, entry.address, entry.amount).toString('hex'));
    expect(entries[0].proof).toEqual([]);
  });

  it('rejects duplicates, empty lists and bad inputs', () => {
    expect(() => buildDistribution(CYCLE_ID, [ENTRIES[0], ENTRIES[0]])).toThrow(/duplicate/);
    expect(() => buildDistribution(CYCLE_ID, [])).toThrow(/empty/);
    expect(() => leafHash(CYCLE_ID, 'not-a-strkey', 1n)).toThrow(/strkey/);
    expect(() => leafHash(CYCLE_ID, ENTRIES[0].address, 0n)).toThrow(/amount/);
    expect(() => leafHash(CYCLE_ID, ENTRIES[0].address, -5n)).toThrow(/amount/);
    expect(() => leafHash(-1, ENTRIES[0].address, 1n)).toThrow(/cycle/);
  });
});

describe('verifyProof', () => {
  const { root, entries } = buildDistribution(CYCLE_ID, ENTRIES);
  const mine = entries.find((e) => e.address === ENTRIES[4].address)!;

  it('rejects a tampered amount', () => {
    expect(verifyProof(CYCLE_ID, mine.address, mine.amount + 1n, mine.proof, root)).toBe(false);
  });

  it('rejects a proof replayed on another cycle', () => {
    expect(verifyProof(CYCLE_ID + 1, mine.address, mine.amount, mine.proof, root)).toBe(false);
  });

  it("rejects someone else's proof", () => {
    const other = entries.find((e) => e.address !== mine.address)!;
    expect(verifyProof(CYCLE_ID, mine.address, mine.amount, other.proof, root)).toBe(false);
  });
});
