import { describe, it, expect } from 'vitest';
import {
  getTokenAddress,
  getTokenBlockchains,
  getBlockchainTokens,
  getTokenDecimals,
  getTokensByTypeAndByBlockchain,
  getTokenIcon,
} from './token';
import { Blockchain } from '@/enums/Blockchain';
import { TokenType } from '@/enums/TokenType';

describe('token helpers', () => {
  it('getTokenAddress resolves per chain and returns undefined when absent', () => {
    expect(getTokenAddress('TGG', Blockchain.Polygon)).toBe('0x3d4Df7BD7Ea3f305Ac3A4065019B96d382834B71');
    expect(getTokenAddress('TSG', Blockchain.Polygon)).toBeUndefined(); // TSG is Ethereum-only
    expect(getTokenAddress('NOPE', Blockchain.Polygon)).toBeUndefined();
  });

  it('getTokenBlockchains lists the chains a token is on', () => {
    expect(getTokenBlockchains('TGG').sort()).toEqual([Blockchain.Ethereum, Blockchain.Polygon].sort());
    expect(getTokenBlockchains('TMC')).toEqual([Blockchain.Base]);
    expect(getTokenBlockchains('NOPE')).toEqual([]);
  });

  it('getBlockchainTokens returns only tokens present on that chain', () => {
    const base = getBlockchainTokens(Blockchain.Base).map((t) => t.symbol);
    expect(base).toContain('TMC');
    expect(base).toContain('TSP500');
    expect(base).not.toContain('TGG'); // TGG is not on Base
  });

  it('getTokenDecimals reads the token decimals by symbol', () => {
    expect(getTokenDecimals('USDC')).toBe(6);
    expect(getTokenDecimals('TGG')).toBe(18);
    expect(getTokenDecimals('EURS')).toBe(2);
    expect(getTokenDecimals('NOPE')).toBeUndefined();
  });

  it('getTokensByTypeAndByBlockchain filters by type and chain', () => {
    const cryptoOnBase = getTokensByTypeAndByBlockchain(Blockchain.Base, TokenType.Crypto).map((t) => t.symbol);
    expect(cryptoOnBase).toEqual(expect.arrayContaining(['TMC', 'TSP500', 'TFT_001']));
    expect(cryptoOnBase).not.toContain('USDC'); // USDC is a stablecoin
  });

  it('getTokenIcon returns a component for known tokens only', () => {
    expect(getTokenIcon('TGG')).toBeDefined();
    expect(getTokenIcon('NOPE')).toBeUndefined();
  });
});
