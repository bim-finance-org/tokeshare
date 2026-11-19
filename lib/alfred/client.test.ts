import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AlfredError,
  createCustomer,
  createFiatPayout,
  getCustomer,
  idempotencyKey,
  readAlfredError,
  simulateDeposit,
} from './client';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

// Alfred refuses any Idempotency-Key that is not a UUID, and the business
// guarantees (one customer per wallet, one payout per quote) rest on the same
// intent always producing the same key.
describe('idempotencyKey', () => {
  it('is a well-formed UUID', () => {
    expect(idempotencyKey('payout:quo_1')).toMatch(UUID);
  });

  it('is stable for the same intent and distinct across intents', () => {
    expect(idempotencyKey('payout:quo_1')).toBe(idempotencyKey('payout:quo_1'));
    expect(idempotencyKey('payout:quo_1')).not.toBe(idempotencyKey('payout:quo_2'));
  });
});

describe('readAlfredError', () => {
  it('reads the v1 error envelope', () => {
    const error = readAlfredError(422, {
      error: { type: 'invalid_request', code: 'insufficient_balance', message: 'Not enough', request_id: 'r' },
    });
    expect(error).toBeInstanceOf(AlfredError);
    expect(error.status).toBe(422);
    expect(error.code).toBe('insufficient_balance');
    expect(error.message).toBe('Not enough');
  });

  it('names the offending field when Alfred gives one', () => {
    const error = readAlfredError(422, { error: { code: 'validation_error', message: 'Invalid', param: 'rail' } });
    expect(error.message).toBe('Invalid (rail)');
  });

  it('falls back to the status when the body is not an envelope', () => {
    const error = readAlfredError(502, { raw: '<html>' });
    expect(error.message).toBe('Alfred request failed (502)');
    expect(error.code).toBeUndefined();
  });
});

describe('transport', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    process.env.ALFRED_API_ENV = 'sandbox';
    process.env.ALFRED_API_KEY = 'key_test';
    process.env.ALFRED_API_SECRET = 'secret_test';
    delete process.env.ALFRED_API_BASE_URL;
    fetchMock.mockReset();
    fetchMock.mockImplementation(async () => new Response(JSON.stringify({ id: 'x', status: 'NOT_STARTED' })));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const lastCall = () => {
    const [url, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit & { headers: Record<string, string> }];
    return { url, init, body: init.body ? JSON.parse(init.body as string) : undefined };
  };

  it('targets the sandbox host with the key/secret pair', async () => {
    await getCustomer('cus_1');
    const { url, init } = lastCall();
    expect(url).toBe('https://api.sandbox.alfredpay.io/v1/customers/cus_1');
    expect(init.headers['api-key']).toBe('key_test');
    expect(init.headers['api-secret']).toBe('secret_test');
    expect(init.headers.Authorization).toBeUndefined();
  });

  it('falls back to a bearer token when no secret is set', async () => {
    delete process.env.ALFRED_API_SECRET;
    await getCustomer('cus_1');
    expect(lastCall().init.headers.Authorization).toBe('Bearer key_test');
  });

  it('sends no Idempotency-Key on reads', async () => {
    await getCustomer('cus_1');
    expect(lastCall().init.headers['Idempotency-Key']).toBeUndefined();
  });

  it('keys customer creation on the wallet, so a retry replays instead of duplicating', async () => {
    await createCustomer({ email: 'a@b.co' }, 'testnet:GABC:MX_SPEI');
    const first = lastCall();
    await createCustomer({ email: 'a@b.co' }, 'testnet:GABC:MX_SPEI');
    expect(lastCall().init.headers['Idempotency-Key']).toBe(first.init.headers['Idempotency-Key']);
    expect(first.body).toEqual({ type: 'INDIVIDUAL', email: 'a@b.co' });
  });

  it('keys a payout on its quote, so one quote can never pay twice', async () => {
    const request = { linkedAccountId: 'la_1', quoteId: 'quo_1', amount: { value: '170.00', currency: 'MXN' } };
    await createFiatPayout('cus_1', request);
    const { url, init } = lastCall();
    expect(url).toBe('https://api.sandbox.alfredpay.io/v1/customers/cus_1/payouts/fiat');
    expect(init.headers['Idempotency-Key']).toBe(idempotencyKey('payout:quo_1'));
  });

  it('gives every other POST a fresh UUID key', async () => {
    await simulateDeposit('cus_1', { depositAddressId: 'da_1', amount: '10' });
    const first = lastCall().init.headers['Idempotency-Key'];
    await simulateDeposit('cus_1', { depositAddressId: 'da_1', amount: '10' });
    const second = lastCall().init.headers['Idempotency-Key'];
    expect(first).toMatch(/^[0-9a-f-]{36}$/);
    expect(first).not.toBe(second);
  });

  it('escapes path segments', async () => {
    await getCustomer('../admin');
    expect(lastCall().url).toBe('https://api.sandbox.alfredpay.io/v1/customers/..%2Fadmin');
  });

  it('turns a non-2xx into an AlfredError carrying Alfred’s code', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { code: 'quote_expired', message: 'Quote expired' } }), { status: 409 }),
    );
    await expect(getCustomer('cus_1')).rejects.toMatchObject({ status: 409, code: 'quote_expired' });
  });

  it('refuses production without an explicit host', async () => {
    process.env.ALFRED_API_ENV = 'production';
    await expect(getCustomer('cus_1')).rejects.toThrow(/ALFRED_API_BASE_URL/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
