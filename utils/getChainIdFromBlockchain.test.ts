import { describe, it, expect } from 'vitest';
import { getChainIdFromBlockchain } from './getChainIdFromBlockchain';
import { Blockchain } from '@/enums/Blockchain';

describe('getChainIdFromBlockchain', () => {
  it('maps each supported chain to its id', () => {
    expect(getChainIdFromBlockchain(Blockchain.Polygon)).toBe(137);
    expect(getChainIdFromBlockchain(Blockchain.Base)).toBe(8453);
    expect(getChainIdFromBlockchain(Blockchain.Ethereum)).toBe(1);
  });

  it('throws for an unsupported chain', () => {
    expect(() => getChainIdFromBlockchain('Solana' as Blockchain)).toThrow('Unsupported blockchain');
  });
});
