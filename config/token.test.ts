import { describe, it, expect } from 'vitest';
import { TOKENS } from './token';
import { TokenType } from '@/enums/TokenType';

const HEX_ADDRESS = /^0x[0-9a-fA-F]{40}$/;

describe('TOKENS config invariants', () => {
  it('each entry key matches its symbol', () => {
    for (const [key, token] of Object.entries(TOKENS)) {
      expect(token.symbol).toBe(key);
    }
  });

  it('each token has positive decimals and at least one valid address', () => {
    for (const [symbol, token] of Object.entries(TOKENS)) {
      expect(token.decimals, symbol).toBeGreaterThan(0);
      const addresses = Object.values(token.addresses);
      expect(addresses.length, symbol).toBeGreaterThan(0);
      for (const addr of addresses) {
        expect(addr, symbol).toMatch(HEX_ADDRESS);
      }
    }
  });

  it('crypto tokens expose an internalUrl to their page', () => {
    for (const token of Object.values(TOKENS)) {
      if (token.type === TokenType.Crypto) {
        expect(token.internalUrl, token.symbol).toBeTruthy();
      }
    }
  });

  it('cmcId, when present, is a positive integer', () => {
    for (const token of Object.values(TOKENS)) {
      if (token.cmcId !== undefined) {
        expect(Number.isInteger(token.cmcId)).toBe(true);
        expect(token.cmcId).toBeGreaterThan(0);
      }
    }
  });
});
