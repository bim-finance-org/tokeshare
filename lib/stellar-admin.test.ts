import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Keypair, StrKey } from '@stellar/stellar-sdk';

// A liquidity pool holds shares without being an investor. If it stayed in the
// payout tree, a round would send it USDC that anyone could then take out of
// the pool — so every venue address must be out of the tree, like the sale
// contract and the operator.

const db = vi.hoisted(() => ({ stellarHolder: { findMany: vi.fn() } }));
const chain = vi.hoisted(() => ({
  buildClassicPaymentXdr: vi.fn(),
  getClassicBalances: vi.fn(),
  hasPaymentTrustline: vi.fn(),
  readDistributorCycleCount: vi.fn(),
  readTokenBalance: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: db }));
vi.mock('@/lib/stellar-assets', () => chain);
vi.mock('@/lib/stellar', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getServer: () => ({ getLatestLedger: async () => ({ sequence: 4242 }) }),
}));

const { computeSnapshot } = await import('./stellar-admin');
const { getStellarAsset } = await import('@/config/stellar-assets');
type StellarAsset = NonNullable<ReturnType<typeof getStellarAsset>>;

const contract = (byte: number) => StrKey.encodeContract(Buffer.alloc(32, byte));
const account = (byte: number) => StrKey.encodeEd25519PublicKey(Buffer.alloc(32, byte));

const SHARE = 10_000_000n;
const POOL = contract(1);
const CUSTODIAL_ROUTER = contract(2);
const PASS_THROUGH_ROUTER = contract(3);
const [ALICE, BOB, TREASURY] = [account(1), account(2), account(3)];
const operator = Keypair.random();

const tfw = getStellarAsset('tfw001')!;
const assetWith = (venues: StellarAsset['venues']): StellarAsset => ({ ...tfw, venues });

const WITH_VENUES = assetWith([
  {
    type: 'soroswap',
    label: 'Soroswap',
    poolAddress: POOL,
    routerAddress: PASS_THROUGH_ROUTER,
    routerHoldsTokens: false,
    feeBps: 30,
  },
  {
    type: 'aquarius',
    label: 'Aquarius',
    poolAddress: '',
    routerAddress: CUSTODIAL_ROUTER,
    routerHoldsTokens: true,
    feeBps: 30,
  },
]);

/** Indexed holder rows + their on-chain balances, in whole shares. */
const holders = (shares: Record<string, number>) => {
  db.stellarHolder.findMany.mockResolvedValue(Object.keys(shares).map((address) => ({ address })));
  chain.readTokenBalance.mockImplementation(
    async (_profile: unknown, _tokenId: string, address: string) =>
      BigInt(Math.round((shares[address] ?? 0) * 10)) * (SHARE / 10n),
  );
};

const balanceReads = () => chain.readTokenBalance.mock.calls.map((call) => call[2] as string);

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('STELLAR_DISTRIBUTOR_ADMIN_SECRET', operator.secret());
  vi.stubEnv('STELLAR_SNAPSHOT_EXCLUDE', '');
  chain.hasPaymentTrustline.mockResolvedValue(true);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('computeSnapshot — venue exclusion', () => {
  it('leaves a venue pool and a custodial router out of the tree: they are paid nothing', async () => {
    holders({ [ALICE]: 1, [POOL]: 1, [BOB]: 3, [CUSTODIAL_ROUTER]: 0.5 });

    const snapshot = await computeSnapshot(WITH_VENUES, 40_000_000n);

    expect(snapshot.excluded).toEqual([POOL, CUSTODIAL_ROUTER]);
    expect(snapshot.lines.map((l) => l.address)).toEqual([ALICE, BOB]);
    expect(snapshot.lines.some((l) => l.address === POOL || l.address === CUSTODIAL_ROUTER)).toBe(false);
  });

  it('splits the total over the remaining eligible shares only', async () => {
    holders({ [ALICE]: 1, [POOL]: 1, [BOB]: 3, [CUSTODIAL_ROUTER]: 0.5 });

    const snapshot = await computeSnapshot(WITH_VENUES, 40_000_000n);

    // 4 eligible shares (not 5.5): the whole total goes to the two investors.
    expect(snapshot.eligibleShares).toBe(4n * SHARE);
    expect(snapshot.lines).toEqual([
      { address: ALICE, shares: 1n * SHARE, amount: 10_000_000n, push: true },
      { address: BOB, shares: 3n * SHARE, amount: 30_000_000n, push: true },
    ]);
    expect(snapshot.dust).toBe(0n);
    expect(snapshot.snapshotLedger).toBe(4242);
  });

  it('does not exclude a router that never holds the token', async () => {
    holders({ [ALICE]: 1, [PASS_THROUGH_ROUTER]: 1 });

    const snapshot = await computeSnapshot(WITH_VENUES, 20_000_000n);

    expect(snapshot.excluded).toEqual([]);
    expect(snapshot.lines.map((l) => l.address)).toEqual([ALICE, PASS_THROUGH_ROUTER]);
  });

  it('keeps excluding the sale contract, the operator and STELLAR_SNAPSHOT_EXCLUDE alongside the venues', async () => {
    vi.stubEnv('STELLAR_SNAPSHOT_EXCLUDE', ` ${TREASURY} , `);
    holders({ [tfw.saleId]: 90, [operator.publicKey()]: 2, [TREASURY]: 5, [POOL]: 1, [ALICE]: 2 });

    const snapshot = await computeSnapshot(WITH_VENUES, 10_000_000n);

    expect(snapshot.excluded).toEqual([tfw.saleId, operator.publicKey(), TREASURY, POOL]);
    expect(snapshot.lines).toEqual([{ address: ALICE, shares: 2n * SHARE, amount: 10_000_000n, push: true }]);
    // Excluded addresses are dropped before any balance read.
    expect(balanceReads()).toEqual([ALICE]);
  });

  it('excludes the venues declared in the real registry for TFW_001', async () => {
    const [soroswap, aquarius] = tfw.venues!;
    holders({ [soroswap.poolAddress]: 1, [aquarius.routerAddress]: 1, [ALICE]: 1 });

    const snapshot = await computeSnapshot(tfw, 10_000_000n);

    expect(snapshot.excluded).toEqual([soroswap.poolAddress, aquarius.routerAddress]);
    expect(snapshot.lines.map((l) => [l.address, l.amount])).toEqual([[ALICE, 10_000_000n]]);
  });

  it('refuses to snapshot when a venue address is malformed, rather than paying a pool', async () => {
    holders({ [ALICE]: 1, [POOL]: 1 });
    const typo = assetWith([
      {
        type: 'soroswap',
        label: 'Soroswap',
        poolAddress: `${POOL.slice(0, -1)}X`,
        routerAddress: PASS_THROUGH_ROUTER,
        routerHoldsTokens: false,
        feeBps: 30,
      },
    ]);

    await expect(computeSnapshot(typo, 10_000_000n)).rejects.toThrow(/invalid venue address/);
    expect(chain.readTokenBalance).not.toHaveBeenCalled();
  });
});

describe('computeSnapshot — asset without venues', () => {
  it('behaves exactly as before: only the sale contract and the operator are excluded', async () => {
    const shares = { [tfw.saleId]: 90, [operator.publicKey()]: 2, [ALICE]: 1, [POOL]: 1, [BOB]: 2 };

    for (const asset of [assetWith(undefined), assetWith([])]) {
      vi.clearAllMocks();
      holders(shares);

      const snapshot = await computeSnapshot(asset, 40_000_000n);

      expect(snapshot.excluded).toEqual([tfw.saleId, operator.publicKey()]);
      expect(snapshot.eligibleShares).toBe(4n * SHARE);
      // No registry entry, no special treatment: this contract is a holder like any other.
      expect(snapshot.lines).toEqual([
        { address: ALICE, shares: 1n * SHARE, amount: 10_000_000n, push: true },
        { address: POOL, shares: 1n * SHARE, amount: 10_000_000n, push: true },
        { address: BOB, shares: 2n * SHARE, amount: 20_000_000n, push: true },
      ]);
    }
  });

  it('still fails when exclusions leave no eligible holder', async () => {
    holders({ [POOL]: 1, [tfw.saleId]: 99 });

    await expect(computeSnapshot(WITH_VENUES, 10_000_000n)).rejects.toThrow('no eligible holders after exclusions');
  });
});
