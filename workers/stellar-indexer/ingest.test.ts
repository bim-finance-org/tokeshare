import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({ prisma: {} }));

const { indexedNetworks } = await import('./ingest');

describe('indexedNetworks', () => {
  it('indexes every network when unset or empty', () => {
    expect(indexedNetworks(undefined)).toBeNull();
    expect(indexedNetworks('')).toBeNull();
    expect(indexedNetworks(' , ')).toBeNull();
  });

  it('restricts to the listed networks', () => {
    expect(indexedNetworks('mainnet')).toEqual(new Set(['mainnet']));
    expect(indexedNetworks(' mainnet , testnet ')).toEqual(new Set(['mainnet', 'testnet']));
  });

  it('refuses an unknown network instead of silently indexing nothing', () => {
    expect(() => indexedNetworks('mainnet,pubnet')).toThrow('pubnet');
  });
});
