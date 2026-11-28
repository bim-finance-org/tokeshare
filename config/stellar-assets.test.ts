import { afterEach, describe, expect, it, vi } from 'vitest';
import { StrKey } from '@stellar/stellar-sdk';
import {
  STELLAR_ASSETS,
  getStellarAsset,
  getVenueAddresses,
  getVenueSlots,
  isVenueAddress,
  type StellarAsset,
} from './stellar-assets';

const AQUARIUS_POOL_ENV = 'NEXT_PUBLIC_STELLAR_MAINNET_TFW001_AQUARIUS_POOL';
const SOROSWAP_PAIR = 'CB2EDQIP6FF7YDXEE46DALBCSXPQ2AWOAVW6GRQ4YR3CN7QJQ3WX7YFD';
const SOROSWAP_ROUTER = 'CAG5LRYQ5JVEUI5TEID72EYOVX44TTUJT5BQR2J6J77FH65PCCFAJDDH';
const AQUARIUS_ROUTER = 'CBQDHNBFBZYE4MKPWBSJOPIYLW4SFSXAXUTSXJN76GNKYVYPCKWC6QUK';

const contract = (byte: number) => StrKey.encodeContract(Buffer.alloc(32, byte));

const withVenues = (venues: StellarAsset['venues']): StellarAsset => ({ ...getStellarAsset('tfw001')!, venues });

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('venues registry', () => {
  it('lists the Soroswap pair and the Aquarius router for TFW_001 while the Aquarius pool does not exist', async () => {
    vi.stubEnv(AQUARIUS_POOL_ENV, '');
    vi.resetModules();
    const registry = await import('./stellar-assets');
    const tfw = registry.getStellarAsset('tfw001')!;

    expect(registry.getVenueAddresses(tfw)).toEqual([SOROSWAP_PAIR, AQUARIUS_ROUTER]);
    expect(registry.getVenueSlots(tfw)).toEqual([
      { venue: 'soroswap', role: 'pool', label: 'Soroswap pool', address: SOROSWAP_PAIR },
      { venue: 'aquarius', role: 'pool', label: 'Aquarius pool', address: '' },
      { venue: 'aquarius', role: 'router', label: 'Aquarius router', address: AQUARIUS_ROUTER },
    ]);
  });

  it('adds the Aquarius pool once its address is configured', async () => {
    const pool = contract(7);
    vi.stubEnv(AQUARIUS_POOL_ENV, ` ${pool} `);
    vi.resetModules();
    const registry = await import('./stellar-assets');
    const tfw = registry.getStellarAsset('tfw001')!;

    expect(registry.getVenueAddresses(tfw)).toEqual([SOROSWAP_PAIR, pool, AQUARIUS_ROUTER]);
    expect(registry.isVenueAddress(tfw, pool)).toBe(true);
  });

  it('never treats a router that does not hold tokens as a venue address', () => {
    const tfw = getStellarAsset('tfw001')!;
    expect(isVenueAddress(tfw, SOROSWAP_ROUTER)).toBe(false);
    expect(getVenueAddresses(tfw)).not.toContain(SOROSWAP_ROUTER);
  });

  it('recognises pools and custodial routers, and nothing else', () => {
    const tfw = getStellarAsset('tfw001')!;
    expect(isVenueAddress(tfw, SOROSWAP_PAIR)).toBe(true);
    expect(isVenueAddress(tfw, AQUARIUS_ROUTER)).toBe(true);
    expect(isVenueAddress(tfw, tfw.saleId)).toBe(false);
    expect(isVenueAddress(tfw, tfw.tokenId)).toBe(false);
    expect(isVenueAddress(tfw, contract(9))).toBe(false);
  });

  it('never matches an empty address, even when a pool is not created yet', () => {
    const asset = withVenues([
      {
        type: 'aquarius',
        label: 'Aquarius',
        poolAddress: '',
        routerAddress: contract(1),
        routerHoldsTokens: true,
        feeBps: 30,
      },
    ]);
    expect(getVenueAddresses(asset)).toEqual([contract(1)]);
    expect(isVenueAddress(asset, '')).toBe(false);
  });

  it('returns nothing for an asset without venues', () => {
    for (const asset of [withVenues(undefined), withVenues([])]) {
      expect(getVenueSlots(asset)).toEqual([]);
      expect(getVenueAddresses(asset)).toEqual([]);
      expect(isVenueAddress(asset, SOROSWAP_PAIR)).toBe(false);
    }
  });

  it('lists an address shared by two venues only once', () => {
    const shared = contract(3);
    const asset = withVenues([
      {
        type: 'aquarius',
        label: 'A',
        poolAddress: contract(1),
        routerAddress: shared,
        routerHoldsTokens: true,
        feeBps: 30,
      },
      {
        type: 'aquarius',
        label: 'B',
        poolAddress: contract(2),
        routerAddress: shared,
        routerHoldsTokens: true,
        feeBps: 10,
      },
    ]);
    expect(getVenueAddresses(asset)).toEqual([contract(1), shared, contract(2)]);
  });

  it('only holds well-formed contract addresses', () => {
    for (const asset of STELLAR_ASSETS) {
      for (const venue of asset.venues ?? []) {
        expect(StrKey.isValidContract(venue.routerAddress), `${asset.slug} ${venue.type} router`).toBe(true);
        if (venue.poolAddress) {
          expect(StrKey.isValidContract(venue.poolAddress), `${asset.slug} ${venue.type} pool`).toBe(true);
        }
      }
    }
  });
});
