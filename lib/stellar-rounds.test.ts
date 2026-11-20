import { beforeEach, describe, expect, it, vi } from 'vitest';

// The one invariant that protects real money: within a round, a holder is paid
// by EXACTLY ONE channel. A holder paid by the SDP must never also own a leaf in
// a funded distributor cycle, or they could claim a second time with its proof.

// Read at import time by config/stellar.ts: a distributor must exist to serve claims.
vi.hoisted(() => {
  process.env.NEXT_PUBLIC_STELLAR_MAINNET_DISTRIBUTOR_ID = `C${'D'.repeat(55)}`;
  process.env.NEXT_PUBLIC_STELLAR_TESTNET_DISTRIBUTOR_ID = `C${'E'.repeat(55)}`;
});

const db = vi.hoisted(() => ({
  distributionRound: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
  distributionPayout: { aggregate: vi.fn(), updateMany: vi.fn(), findMany: vi.fn(), update: vi.fn() },
  distributionCycle: { count: vi.fn(), findMany: vi.fn() },
}));
const admin = vi.hoisted(() => ({
  computeSnapshot: vi.fn(),
  createDistributorCycle: vi.fn(),
  pushCycleEntries: vi.fn(),
  resolvePendingCycles: vi.fn(),
  topUpSdpAccount: vi.fn(),
}));
const sdp = vi.hoisted(() => ({
  getSdpConfig: vi.fn(),
  createDisbursement: vi.fn(),
  findDisbursements: vi.fn(),
  getDisbursement: vi.fn(),
  getDisbursementPayments: vi.fn(),
  resolvePayAssetId: vi.fn(),
  startDisbursement: vi.fn(),
  sdpDisbursementUrl: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: db }));
vi.mock('@/lib/stellar-admin', () => admin);
vi.mock('@/lib/sdp', async (importOriginal) => ({ ...(await importOriginal<object>()), ...sdp }));
vi.mock('@/lib/stellar-assets', () => ({ getClassicBalances: vi.fn() }));

const { advanceRound, planRound, rerouteFailed, syncRound } = await import('./stellar-rounds');
const { STELLAR_ASSETS } = await import('@/config/stellar-assets');

const asset = STELLAR_ASSETS.find((a) => a.network === 'mainnet') ?? STELLAR_ASSETS[0];
const addr = (c: string) => `G${c.repeat(55)}`;
const [WITH_TRUSTLINE_1, WITH_TRUSTLINE_2, NO_TRUSTLINE] = [addr('A'), addr('B'), addr('C')];

const payout = (address: string, channel: string, status: string, amount = 100n) => ({
  roundId: 'r1',
  address,
  shares: 1n,
  amount,
  channel,
  status,
  stellarTx: null as string | null,
  sdpPaymentId: null,
  paidAt: null,
  error: null as string | null,
  reroutedCycleId: null as number | null,
});

const sdpRound = (payouts: ReturnType<typeof payout>[], status = 'planned') => ({
  id: 'r1',
  network: asset.network,
  channel: 'sdp',
  assetSlug: asset.slug,
  tokenId: asset.tokenId,
  total: 300n,
  snapshotLedger: 1,
  snapshotRoot: 'root',
  claimExpiresAt: new Date('2027-01-01'),
  status,
  fundedAt: null,
  fundingTx: null,
  sdpDisbursementId: null,
  lastError: null,
  createdAt: new Date('2026-11-20'),
  updatedAt: new Date('2026-11-20'),
  payouts,
  cycles: [],
});

beforeEach(() => {
  vi.resetAllMocks();
  sdp.getSdpConfig.mockReturnValue({ network: asset.network, baseUrl: 'https://sdp', distributionAddress: addr('D') });
  db.distributionPayout.aggregate.mockResolvedValue({ _sum: { amount: 0n } });
  admin.topUpSdpAccount.mockResolvedValue({ hash: 'fund' });
  admin.createDistributorCycle.mockResolvedValue({ cycleId: 7 });
});

describe('planRound', () => {
  it('gives every holder exactly one channel: trustline → SDP, none → claim', async () => {
    admin.computeSnapshot.mockResolvedValue({
      snapshotLedger: 1,
      lines: [
        { address: WITH_TRUSTLINE_1, shares: 1n, amount: 100n, push: true },
        { address: WITH_TRUSTLINE_2, shares: 1n, amount: 100n, push: true },
        { address: NO_TRUSTLINE, shares: 1n, amount: 100n, push: false },
      ],
    });
    db.distributionRound.create.mockResolvedValue({ id: 'r1' });

    await planRound(asset, 300n, 30);

    const lines = db.distributionRound.create.mock.calls[0][0].data.payouts.createMany.data;
    expect(lines.map((l: { address: string; channel: string }) => [l.address, l.channel])).toEqual([
      [WITH_TRUSTLINE_1, 'sdp'],
      [WITH_TRUSTLINE_2, 'sdp'],
      [NO_TRUSTLINE, 'claim'],
    ]);
  });
});

describe('advanceRound (SDP round)', () => {
  it('puts SDP holders only in the SDP disbursement and claim holders only in the distributor cycle', async () => {
    db.distributionRound.findUnique.mockResolvedValue(
      sdpRound([
        payout(WITH_TRUSTLINE_1, 'sdp', 'draft'),
        payout(WITH_TRUSTLINE_2, 'sdp', 'draft'),
        payout(NO_TRUSTLINE, 'claim', 'onchain'),
      ]),
    );
    db.distributionCycle.count.mockResolvedValue(0);
    sdp.findDisbursements.mockResolvedValue([]);
    sdp.resolvePayAssetId.mockResolvedValue('usdc');
    sdp.createDisbursement.mockResolvedValue({ id: 'disb-1' });
    sdp.getDisbursement.mockResolvedValue({ id: 'disb-1', status: 'STARTED' });

    await advanceRound('r1');

    const cycleAddresses = admin.createDistributorCycle.mock.calls[0][1].lines.map(
      (l: { address: string }) => l.address,
    );
    expect(cycleAddresses).toEqual([NO_TRUSTLINE]);
    expect(admin.createDistributorCycle.mock.calls[0][1].deposit).toBe(100n);

    const csv: string = sdp.createDisbursement.mock.calls[0][1].csv;
    expect(csv).toContain(WITH_TRUSTLINE_1);
    expect(csv).toContain(WITH_TRUSTLINE_2);
    expect(csv).not.toContain(NO_TRUSTLINE);

    // The distributor never pushes in an SDP round: its cycle is claim-only.
    expect(admin.pushCycleEntries).not.toHaveBeenCalled();
  });
});

describe('rerouteFailed', () => {
  it('moves only the failed SDP lines to a new claim cycle, and marks them re-routed in the same step', async () => {
    db.distributionRound.findUnique.mockResolvedValue(sdpRound([], 'attention'));
    db.distributionPayout.findMany.mockResolvedValue([
      payout(WITH_TRUSTLINE_1, 'sdp', 'success'),
      payout(WITH_TRUSTLINE_2, 'sdp', 'failed'),
    ]);

    await rerouteFailed('r1');

    const input = admin.createDistributorCycle.mock.calls[0][1];
    expect(input.lines.map((l: { address: string }) => l.address)).toEqual([WITH_TRUSTLINE_2]);
    expect(input.beforeCreate).toBeTypeOf('function');
  });

  it('refuses when no SDP line failed', async () => {
    db.distributionRound.findUnique.mockResolvedValue(sdpRound([], 'submitted'));
    db.distributionPayout.findMany.mockResolvedValue([payout(WITH_TRUSTLINE_1, 'sdp', 'success')]);
    await expect(rerouteFailed('r1')).rejects.toThrow('no failed SDP line');
    expect(admin.createDistributorCycle).not.toHaveBeenCalled();
  });
});

describe('syncRound', () => {
  it('flags a re-routed line the SDP paid anyway (retry from the SDP dashboard) as a double payment', async () => {
    const rerouted = { ...payout(WITH_TRUSTLINE_2, 'sdp', 'rerouted'), reroutedCycleId: 7 };
    db.distributionRound.findUnique.mockResolvedValue({
      ...sdpRound([rerouted], 'settled'),
      sdpDisbursementId: 'disb-1',
    });
    sdp.getDisbursementPayments.mockResolvedValue([
      { address: WITH_TRUSTLINE_2, status: 'SUCCESS', txHash: 'tx-2', paymentId: 'p2', updatedAt: '2026-11-20' },
    ]);

    await syncRound('r1');

    expect(db.distributionPayout.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ stellarTx: 'tx-2', error: expect.stringContaining('DOUBLE PAYMENT') }),
      }),
    );
  });
});
