import { describe, it, expect } from 'vitest';
import { getTokenDecimals } from './tokenUtils';

describe('getTokenDecimals (by address)', () => {
  it('resolves known token decimals', () => {
    expect(getTokenDecimals('0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359')).toBe(6); // USDC Polygon
    expect(getTokenDecimals('0x553d3D295e0f695B9228246232eDF400ed3560B5')).toBe(18); // PAXG
    expect(getTokenDecimals('0x123ffe0a3C62878dcbee2742227dc8990058d9E1')).toBe(9); // XAGM
  });

  it('is case-insensitive on the address', () => {
    const checksum = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359';
    expect(getTokenDecimals(checksum)).toBe(getTokenDecimals(checksum.toLowerCase() as `0x${string}`));
  });

  it('returns undefined for an unknown address', () => {
    expect(getTokenDecimals('0x000000000000000000000000000000000000dEaD')).toBeUndefined();
  });
});
