import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getNetworkProfile } from '@/config/stellar';
import {
  createDisbursement,
  getDisbursementPayments,
  getSdpConfig,
  resolvePayAssetId,
  SdpError,
  SdpInsufficientBalanceError,
  startDisbursement,
  type SdpConfig,
} from './sdp';

const CONFIG: SdpConfig = {
  network: 'testnet',
  baseUrl: 'https://sdp.example',
  apiKey: 'SDP_key.secret',
  distributionAddress: 'GDISGKKBAA2S5ISUTNYHSQ5VN7X7O73JKALMBUHRHZE2XFZRF64R3EVL',
  dashboardUrl: '',
  assetId: '',
};

const fetchMock = vi.fn();
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('getSdpConfig', () => {
  it('is null when the network has no SDP', () => {
    vi.stubEnv('SDP_MAINNET_BASE_URL', '');
    expect(getSdpConfig('mainnet')).toBeNull();
  });

  it('refuses a half-configured network', () => {
    vi.stubEnv('SDP_MAINNET_BASE_URL', 'https://sdp.example/');
    vi.stubEnv('SDP_MAINNET_API_KEY', '');
    expect(() => getSdpConfig('mainnet')).toThrow(/API_KEY/);
  });
});

describe('transport', () => {
  it('sends the API key as a bearer token', async () => {
    fetchMock.mockResolvedValueOnce(json(200, {}));
    await startDisbursement(CONFIG, 'd1');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://sdp.example/disbursements/d1/status');
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer SDP_key.secret');
    expect(JSON.parse(init.body)).toEqual({ status: 'STARTED' });
  });

  it('maps a 409 balance error to SdpInsufficientBalanceError', async () => {
    fetchMock.mockResolvedValueOnce(json(409, { error: 'the disbursement cannot be started: insufficient balance' }));
    await expect(startDisbursement(CONFIG, 'd1')).rejects.toBeInstanceOf(SdpInsufficientBalanceError);
  });

  it('surfaces other errors with their status', async () => {
    fetchMock.mockResolvedValueOnce(json(400, { error: 'invalid', extras: { file: 'bad' } }));
    const error = await startDisbursement(CONFIG, 'd1').catch((e) => e);
    expect(error).toBeInstanceOf(SdpError);
    expect(error.status).toBe(400);
    expect(error.message).toMatch(/invalid.*bad/);
  });
});

describe('createDisbursement', () => {
  it('creates and uploads in one multipart call, in known-wallet mode', async () => {
    fetchMock.mockResolvedValueOnce(json(201, { id: 'd1', name: 'n', status: 'READY' }));
    await createDisbursement(CONFIG, { name: 'n', assetId: 'a1', csv: 'id\n' });
    const body = fetchMock.mock.calls[0][1].body as FormData;
    expect(JSON.parse(body.get('data') as string)).toEqual({
      name: 'n',
      asset_id: 'a1',
      registration_contact_type: 'EMAIL_AND_WALLET_ADDRESS',
    });
    expect((body.get('file') as File).name).toBe('instructions.csv');
  });
});

describe('resolvePayAssetId', () => {
  it('prefers the configured asset id (no read:all scope needed)', async () => {
    expect(await resolvePayAssetId({ ...CONFIG, assetId: 'configured' })).toBe('configured');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('matches the network payment asset by code and issuer', async () => {
    fetchMock.mockResolvedValueOnce(
      json(200, [
        { id: 'xlm', code: 'XLM', issuer: '' },
        // A same-code asset from another issuer must not match.
        { id: 'other-usdc', code: 'USDC', issuer: 'GCYG5OOZY4O2EZOY7OPT4FYY2XWZQ3WCX6M24CVWWHTV67ATKAVK77QC' },
        { id: 'usdc', code: 'USDC', issuer: getNetworkProfile(CONFIG.network).pay.issuer },
      ]),
    );
    expect(await resolvePayAssetId(CONFIG)).toBe('usdc');
  });
});

describe('getDisbursementPayments', () => {
  it('follows pagination and keeps the last status message', async () => {
    fetchMock
      .mockResolvedValueOnce(
        json(200, {
          pagination: { next: '/disbursements/d1/receivers?page=2', pages: 2, total: 2 },
          data: [
            {
              receiver_wallet: { stellar_address: CONFIG.distributionAddress },
              payment: {
                id: 'p1',
                amount: '1.5',
                status: 'SUCCESS',
                stellar_transaction_id: 'tx1',
                updated_at: '2026-10-05T00:00:00Z',
              },
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        json(200, {
          pagination: { pages: 2, total: 2 },
          data: [
            {
              external_id: 'GCBHFIQNNXYC6AVKCFAC3I6EN3E2ZDNBIQ6RUSZDS2IMYVRXAWZH3OYZ',
              payment: {
                id: 'p2',
                amount: '2',
                status: 'FAILED',
                status_history: [
                  { status: 'PENDING', status_message: '' },
                  { status: 'FAILED', status_message: 'op_no_trust' },
                ],
                updated_at: '2026-10-05T00:00:00Z',
              },
            },
          ],
        }),
      );
    const payments = await getDisbursementPayments(CONFIG, 'd1');
    expect(payments).toHaveLength(2);
    expect(payments[0]).toMatchObject({ paymentId: 'p1', status: 'SUCCESS', txHash: 'tx1' });
    expect(payments[1]).toMatchObject({
      address: 'GCBHFIQNNXYC6AVKCFAC3I6EN3E2ZDNBIQ6RUSZDS2IMYVRXAWZH3OYZ',
      status: 'FAILED',
      txHash: null,
      message: 'op_no_trust',
    });
    expect(fetchMock.mock.calls[1][0]).toContain('page=2');
  });
});
