import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Address, Keypair, StrKey } from '@stellar/stellar-sdk';

// allow_user is an operator-signed mainnet write. These tests pin down when a
// transaction may be built at all: never for a malformed address, never for an
// address that is already allowed.

const admin = vi.hoisted(() => ({ adminKeypair: vi.fn(), invokeAsAdmin: vi.fn() }));
const chain = vi.hoisted(() => ({ readIsAllowed: vi.fn() }));

vi.mock('@/lib/stellar-admin', () => admin);
vi.mock('@/lib/stellar-assets', () => chain);

const { allowAddress, getVenueAllowlist, isAllowed, isAllowlistableAddress } = await import('./stellar-allowlist');
const { getStellarAsset } = await import('@/config/stellar-assets');
type StellarAsset = NonNullable<ReturnType<typeof getStellarAsset>>;

const contract = (byte: number) => StrKey.encodeContract(Buffer.alloc(32, byte));
const account = (byte: number) => StrKey.encodeEd25519PublicKey(Buffer.alloc(32, byte));

const tfw = getStellarAsset('tfw001')!;
const operator = Keypair.random();
const INVESTOR = account(1);
const POOL = contract(1);
const ROUTER = contract(2);

const toStrkeys = (args: unknown[]) => args.map((arg) => Address.fromScVal(arg as never).toString());

beforeEach(() => {
  vi.resetAllMocks();
  admin.adminKeypair.mockReturnValue(operator);
  admin.invokeAsAdmin.mockResolvedValue('txhash');
});

describe('isAllowlistableAddress', () => {
  it('accepts accounts and contracts only', () => {
    expect(isAllowlistableAddress(INVESTOR)).toBe(true);
    expect(isAllowlistableAddress(POOL)).toBe(true);
    expect(isAllowlistableAddress('')).toBe(false);
    expect(isAllowlistableAddress(undefined)).toBe(false);
    expect(isAllowlistableAddress('GABC')).toBe(false);
    expect(isAllowlistableAddress(`${INVESTOR.slice(0, -1)}7`)).toBe(false); // bad checksum
    expect(isAllowlistableAddress(operator.secret())).toBe(false);
    // Muxed account (M…): not a holder identity on the token.
    expect(isAllowlistableAddress(StrKey.encodeMed25519PublicKey(Buffer.alloc(40, 1)))).toBe(false);
  });
});

describe('isAllowed', () => {
  it('reads the allowlist of the asset token', async () => {
    chain.readIsAllowed.mockResolvedValue(true);

    await expect(isAllowed(tfw, INVESTOR)).resolves.toBe(true);

    const [profile, tokenId, address] = chain.readIsAllowed.mock.calls[0];
    expect(profile.network).toBe('mainnet');
    expect(tokenId).toBe(tfw.tokenId);
    expect(address).toBe(INVESTOR);
  });

  it('rejects a malformed address without touching the network', async () => {
    await expect(isAllowed(tfw, 'not-an-address')).rejects.toThrow(/Invalid address/);
    expect(chain.readIsAllowed).not.toHaveBeenCalled();
  });
});

describe('allowAddress', () => {
  it('signs allow_user(address, operator) on the token and returns the hash', async () => {
    chain.readIsAllowed.mockResolvedValue(false);

    await expect(allowAddress(tfw, POOL)).resolves.toBe('txhash');

    expect(admin.invokeAsAdmin).toHaveBeenCalledTimes(1);
    const [asset, contractId, method, args] = admin.invokeAsAdmin.mock.calls[0];
    expect(asset).toBe(tfw);
    expect(contractId).toBe(tfw.tokenId);
    expect(method).toBe('allow_user');
    expect(toStrkeys(args)).toEqual([POOL, operator.publicKey()]);
  });

  it('submits nothing when the address is already allowed', async () => {
    chain.readIsAllowed.mockResolvedValue(true);

    await expect(allowAddress(tfw, INVESTOR)).resolves.toBeNull();

    expect(admin.invokeAsAdmin).not.toHaveBeenCalled();
    expect(admin.adminKeypair).not.toHaveBeenCalled();
  });

  it('submits nothing for a malformed address', async () => {
    for (const bad of ['', 'GABC', `${POOL.slice(0, -1)}X`, operator.secret()]) {
      await expect(allowAddress(tfw, bad)).rejects.toThrow(/Invalid address/);
    }
    expect(chain.readIsAllowed).not.toHaveBeenCalled();
    expect(admin.invokeAsAdmin).not.toHaveBeenCalled();
  });

  it('submits nothing when the allowlist cannot be read', async () => {
    chain.readIsAllowed.mockRejectedValue({ code: -32603, message: 'rpc down' });

    await expect(allowAddress(tfw, INVESTOR)).rejects.toMatchObject({ message: 'rpc down' });
    expect(admin.invokeAsAdmin).not.toHaveBeenCalled();
  });

  it('refuses an asset without a token contract', async () => {
    await expect(allowAddress({ ...tfw, tokenId: '' }, INVESTOR)).rejects.toThrow(/no token contract/);
    expect(admin.invokeAsAdmin).not.toHaveBeenCalled();
  });
});

describe('getVenueAllowlist', () => {
  const withVenues = (venues: StellarAsset['venues']): StellarAsset => ({ ...tfw, venues });

  it('reports each venue address with its status, and a missing pool as unknown', async () => {
    chain.readIsAllowed.mockImplementation(
      async (_profile: unknown, _token: string, address: string) => address === POOL,
    );
    const asset = withVenues([
      {
        type: 'soroswap',
        label: 'Soroswap',
        poolAddress: POOL,
        routerAddress: contract(9),
        routerHoldsTokens: false,
        feeBps: 30,
      },
      {
        type: 'aquarius',
        label: 'Aquarius',
        poolAddress: '',
        routerAddress: ROUTER,
        routerHoldsTokens: true,
        feeBps: 30,
      },
    ]);

    await expect(getVenueAllowlist(asset)).resolves.toEqual([
      { venue: 'soroswap', role: 'pool', label: 'Soroswap pool', address: POOL, allowed: true },
      { venue: 'aquarius', role: 'pool', label: 'Aquarius pool', address: '', allowed: null },
      { venue: 'aquarius', role: 'router', label: 'Aquarius router', address: ROUTER, allowed: false },
    ]);
    expect(chain.readIsAllowed).toHaveBeenCalledTimes(2);
  });

  it('returns an empty list for an asset without venues', async () => {
    await expect(getVenueAllowlist(withVenues(undefined))).resolves.toEqual([]);
    expect(chain.readIsAllowed).not.toHaveBeenCalled();
  });

  it('points at the registry when a venue address is malformed', async () => {
    const asset = withVenues([
      {
        type: 'aquarius',
        label: 'Aquarius',
        poolAddress: 'CNOTAPOOL',
        routerAddress: ROUTER,
        routerHoldsTokens: true,
        feeBps: 30,
      },
    ]);

    await expect(getVenueAllowlist(asset)).rejects.toThrow(/Aquarius pool.*venues registry/);
    expect(chain.readIsAllowed).not.toHaveBeenCalled();
  });
});
