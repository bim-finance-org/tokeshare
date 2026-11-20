import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({ prisma: {} }));

const { indexedNetworks, isOutOfRangeError } = await import('./ingest');

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

describe('isOutOfRangeError', () => {
  it('recognises the raw JSON-RPC error object the SDK throws for a cursor past retention', () => {
    // Exact shape returned by soroban-testnet on 2026-11-20 — not an Error instance.
    expect(
      isOutOfRangeError({ code: -32600, message: 'startLedger must be within the ledger range: 5715257 - 5836216' }),
    ).toBe(true);
    expect(isOutOfRangeError(new Error('startLedger must be within the ledger range'))).toBe(true);
  });

  it('does not treat other RPC failures as a gap', () => {
    expect(isOutOfRangeError({ code: -32001, message: '[-32001] request exceeded processing limit threshold' })).toBe(
      false,
    );
    expect(isOutOfRangeError(undefined)).toBe(false);
  });
});
