import { describe, it, expect } from 'vitest';
import { COLLATERALS, SELLABLE_TOKEN_SYMBOLS, TOKENS, type SellableTokenSymbol } from './token';
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

describe('COLLATERALS config invariants', () => {
  const entries = Object.entries(COLLATERALS) as [SellableTokenSymbol, (typeof COLLATERALS)[SellableTokenSymbol]][];

  it('only covers sellable tokens', () => {
    for (const [symbol] of entries) {
      expect(SELLABLE_TOKEN_SYMBOLS, symbol).toContain(symbol);
    }
  });

  it('each collateral has positive decimals and valid addresses', () => {
    for (const [symbol, collateral] of entries) {
      expect(collateral!.decimals, symbol).toBeGreaterThan(0);
      const addresses = Object.values(collateral!.addresses);
      expect(addresses.length, symbol).toBeGreaterThan(0);
      for (const addr of addresses) {
        expect(addr, symbol).toMatch(HEX_ADDRESS);
      }
    }
  });

  // A collateral address only makes sense on a chain where the token itself
  // lives — a mismatch would hand API consumers an address on the wrong network.
  it('covers exactly the chains the token is deployed on', () => {
    for (const [symbol, collateral] of entries) {
      const tokenChains = Object.keys(TOKENS[symbol].addresses).sort();
      expect(Object.keys(collateral!.addresses).sort(), symbol).toEqual(tokenChains);
    }
  });

  it('pins the underlying of each backed token (regression guard)', () => {
    expect(COLLATERALS.TGG?.symbol).toBe('PAXG');
    expect(COLLATERALS.TSG?.symbol).toBe('XAGM');
    expect(COLLATERALS.TMC?.symbol).toBe('CMC20');
    expect(COLLATERALS.TSP500?.symbol).toBe('DESPXA');
    // Real-world backed: no on-chain collateral.
    expect(COLLATERALS.TFT_001).toBeUndefined();
  });
});
