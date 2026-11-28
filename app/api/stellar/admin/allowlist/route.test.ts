import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StrKey } from '@stellar/stellar-sdk';

// The POST route signs a mainnet transaction with the operator key: it must be
// unreachable without a dashboard session and must never sign for bad input.

const auth = vi.hoisted(() => ({ requireAuth: vi.fn() }));
const allowlist = vi.hoisted(() => ({ allowAddress: vi.fn(), getVenueAllowlist: vi.fn(), isAllowed: vi.fn() }));
const logger = vi.hoisted(() => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }));

vi.mock('@/lib/api-utils', () => auth);
vi.mock('@/lib/logger', () => ({ getLogger: () => logger }));
vi.mock('@/lib/stellar-admin', () => ({}));
vi.mock('@/lib/stellar-assets', () => ({}));
vi.mock('@/lib/stellar-allowlist', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  ...allowlist,
}));

const { GET, POST } = await import('./route');

const INVESTOR = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 1));
const SOROSWAP_PAIR = 'CB2EDQIP6FF7YDXEE46DALBCSXPQ2AWOAVW6GRQ4YR3CN7QJQ3WX7YFD';
const URL_BASE = 'http://localhost/api/stellar/admin/allowlist';

const get = (query: string) => GET(new Request(`${URL_BASE}${query}`));
const post = (body: unknown) =>
  POST(new Request(URL_BASE, { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) }));

beforeEach(() => {
  vi.resetAllMocks();
  auth.requireAuth.mockResolvedValue({ user: { name: 'operator' } });
});

describe('without a dashboard session', () => {
  beforeEach(() => auth.requireAuth.mockResolvedValue(null));

  it('rejects every call and touches nothing', async () => {
    expect((await get('?slug=tfw001')).status).toBe(401);
    expect((await get(`?slug=tfw001&address=${INVESTOR}`)).status).toBe(401);
    expect((await post({ slug: 'tfw001', address: INVESTOR })).status).toBe(401);

    expect(allowlist.getVenueAllowlist).not.toHaveBeenCalled();
    expect(allowlist.isAllowed).not.toHaveBeenCalled();
    expect(allowlist.allowAddress).not.toHaveBeenCalled();
  });
});

describe('GET', () => {
  it('returns the venue addresses with their status when no address is given', async () => {
    const venues = [
      { venue: 'soroswap', role: 'pool', label: 'Soroswap pool', address: SOROSWAP_PAIR, allowed: false },
    ];
    allowlist.getVenueAllowlist.mockResolvedValue(venues);

    const res = await get('?slug=tfw001');

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ network: 'mainnet', venues });
  });

  it('returns { allowed } for one address', async () => {
    allowlist.isAllowed.mockResolvedValue(true);

    const res = await get(`?slug=tfw001&address=${INVESTOR}`);

    expect(await res.json()).toEqual({ allowed: true });
    expect(allowlist.isAllowed.mock.calls[0][1]).toBe(INVESTOR);
  });

  it('rejects an unknown asset and a malformed address', async () => {
    expect((await get('?slug=nope')).status).toBe(404);
    expect((await get('?slug=tfw001&address=GABC')).status).toBe(400);
    expect((await get('?slug=tfw001&address=')).status).toBe(400);
    expect(allowlist.isAllowed).not.toHaveBeenCalled();
  });

  it('surfaces a raw RPC error object as a readable message', async () => {
    allowlist.isAllowed.mockRejectedValue({ code: -32603, message: 'rpc down' });

    const res = await get(`?slug=tfw001&address=${INVESTOR}`);

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: '[-32603] rpc down' });
  });
});

describe('POST', () => {
  it('allowlists the address and logs the transaction', async () => {
    allowlist.allowAddress.mockResolvedValue('abc123');

    const res = await post({ slug: 'tfw001', address: ` ${SOROSWAP_PAIR} ` });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ allowed: true, txHash: 'abc123' });
    expect(allowlist.allowAddress.mock.calls[0][1]).toBe(SOROSWAP_PAIR);
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn.mock.calls[0][0]).toContain(SOROSWAP_PAIR);
    expect(logger.warn.mock.calls[0][0]).toContain('abc123');
    expect(logger.warn.mock.calls[0][0]).toContain('venue address');
  });

  it('reports an already allowed address without a transaction or a log line', async () => {
    allowlist.allowAddress.mockResolvedValue(null);

    const res = await post({ slug: 'tfw001', address: INVESTOR });

    expect(await res.json()).toEqual({ allowed: true, txHash: null });
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('never signs for an unknown asset, a malformed address or an unreadable body', async () => {
    expect((await post({ slug: 'nope', address: INVESTOR })).status).toBe(404);
    expect((await post({ slug: 'tfw001', address: 'GABC' })).status).toBe(400);
    expect((await post({ slug: 'tfw001' })).status).toBe(400);
    expect((await post({ slug: 'tfw001', address: 42 })).status).toBe(400);
    expect((await post('not json')).status).toBe(404);
    expect(allowlist.allowAddress).not.toHaveBeenCalled();
  });

  it('translates a missing operator role into a readable error', async () => {
    allowlist.allowAddress.mockRejectedValue(new Error('HostError: Error(Contract, #2000)\n\nEvent log…'));

    const res = await post({ slug: 'tfw001', address: INVESTOR });

    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/required role/);
    expect(logger.warn).not.toHaveBeenCalled();
  });
});
