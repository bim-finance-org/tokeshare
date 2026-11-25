import { describe, it, expect } from 'vitest';
import { ADDRESSES, AGGREGATORS } from './addresses';
import {
  CONTRACTS,
  BASE_CONTRACTS,
  BASE_GOLD_CONTRACTS,
  ETH_CONTRACTS,
  ETH_SILVER_CONTRACTS,
  getTGGContracts,
  getTSGContracts,
  TRUSTED_AGGREGATORS,
} from './contracts';
import { COLLATERALS, TOKENS } from '@/config/token';
import { Blockchain } from '@/enums/Blockchain';

const HEX_ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

describe('contract addresses (single source of truth)', () => {
  it('every registered address is a valid 40-hex address', () => {
    for (const chain of Object.values(ADDRESSES)) {
      for (const [name, addr] of Object.entries(chain)) {
        expect(addr, name).toMatch(HEX_ADDRESS);
      }
    }
    expect(AGGREGATORS.kyberSwap).toMatch(HEX_ADDRESS);
  });

  // A zero address is a "not deployed yet" placeholder. It must never ship: the
  // network selector would offer the chain and send swaps to address(0).
  it('has no placeholder (zero) address left', () => {
    for (const [chain, entries] of Object.entries(ADDRESSES)) {
      for (const [name, addr] of Object.entries(entries)) {
        expect(addr, `${chain}.${name}`).not.toBe(ZERO_ADDRESS);
      }
    }
  });

  it('pins the critical protocol/token addresses (regression guard)', () => {
    expect(CONTRACTS.TGG).toBe('0x3d4Df7BD7Ea3f305Ac3A4065019B96d382834B71');
    expect(CONTRACTS.ZAP).toBe('0xA5E2A2084426475F3E0D9cc6a261C2125bC43589');
    expect(CONTRACTS.PAXG).toBe('0x553d3D295e0f695B9228246232eDF400ed3560B5');
    expect(CONTRACTS.MARKETPLACE).toBe('0xe0F632423a6bf824d7E4463470549b73048C3f4e');
    expect(CONTRACTS.BATCH_DISTRIBUTOR).toBe('0x8c1eCBa803f7B83a2De69A99fb8D4a17776d1f2d');
    expect(BASE_CONTRACTS.TMC).toBe('0xf47C9E511d215E286d3Ca1B956e7C3DD6F6195D4');
    expect(BASE_CONTRACTS.ZAP_TMC).toBe('0x17b4CA0f1A49dB2c42596B3152c39C8aA7B7a0D9');
    expect(BASE_CONTRACTS.CMC20).toBe('0xa0A8481fc246Cd12f75227aBB96220fF5360fad3');
    expect(BASE_CONTRACTS.TSP500).toBe('0x9476d702Dc72242A7cEfBf802da8F09ddb305e51');
    expect(BASE_CONTRACTS.ZAP_TSP500).toBe('0xd7Ff11db71FBB64dC967efEB91eFa7A81287272D');
    expect(BASE_CONTRACTS.DESPXA).toBe('0x9c5C365e764829876243d0b289733B9D2b729685');
    expect(ETH_CONTRACTS.TGG).toBe('0x0764fF270AaCEdA56d0940327C50f8A199573A9b');
    expect(BASE_GOLD_CONTRACTS.TGG).toBe('0x2FFecb82DBB0D2469bA9643EB390287E01FaE4F6');
    expect(BASE_GOLD_CONTRACTS.ZAP).toBe('0xa0456E575663F77a70f924C3dCd2b80D8aEC7E76');
    expect(BASE_GOLD_CONTRACTS.PAXG).toBe('0xe904AEA5E1b110c9174728fA2efFc8aeD19E98Ef');
    expect(ETH_SILVER_CONTRACTS.TSG).toBe('0x2544a889C03111853D8af56eb4bD010EDEE5E11f');
    expect(ETH_SILVER_CONTRACTS.ZAP).toBe('0x608325b9e5a4b29f1d0d9238620cf3BbFD57AE10');
    expect(ETH_SILVER_CONTRACTS.XAGM).toBe('0x123ffe0a3C62878dcbee2742227dc8990058d9E1');
    expect(TRUSTED_AGGREGATORS.kyberSwap).toBe('0x6131B5fae19EA4f9D964eAc0408E4408b66337b5');
  });

  it('getters resolve per chain', () => {
    expect(getTGGContracts(Blockchain.Polygon).TGG).toBe(CONTRACTS.TGG);
    expect(getTGGContracts(Blockchain.Ethereum).TGG).toBe(ETH_CONTRACTS.TGG);
    // Base has its own TGG, Zap and PAXG — it must never fall back to Polygon.
    expect(getTGGContracts(Blockchain.Base)).toEqual({
      TGG: ADDRESSES[Blockchain.Base].TGG,
      ZAP: ADDRESSES[Blockchain.Base].ZAP_TGG,
      PAXG: ADDRESSES[Blockchain.Base].PAXG,
    });
    expect(getTSGContracts(Blockchain.Ethereum).XAGM).toBe(ETH_SILVER_CONTRACTS.XAGM);
  });

  it('TOKENS derive from the same registry (no drift)', () => {
    expect(TOKENS.TGG.addresses.Polygon).toBe(CONTRACTS.TGG);
    expect(TOKENS.TGG.addresses.Ethereum).toBe(ETH_CONTRACTS.TGG);
    expect(TOKENS.TGG.addresses.Base).toBe(BASE_GOLD_CONTRACTS.TGG);
    expect(TOKENS.TSG.addresses.Ethereum).toBe(ETH_SILVER_CONTRACTS.TSG);
    expect(TOKENS.TMC.addresses.Base).toBe(BASE_CONTRACTS.TMC);
    expect(TOKENS.TSP500.addresses.Base).toBe(BASE_CONTRACTS.TSP500);
  });

  it('COLLATERALS derive from the same registry (no drift)', () => {
    expect(COLLATERALS.TGG?.addresses.Polygon).toBe(CONTRACTS.PAXG);
    expect(COLLATERALS.TGG?.addresses.Ethereum).toBe(ETH_CONTRACTS.PAXG);
    expect(COLLATERALS.TGG?.addresses.Base).toBe(BASE_GOLD_CONTRACTS.PAXG);
    expect(COLLATERALS.TSG?.addresses.Ethereum).toBe(ETH_SILVER_CONTRACTS.XAGM);
    expect(COLLATERALS.TMC?.addresses.Base).toBe(BASE_CONTRACTS.CMC20);
    expect(COLLATERALS.TSP500?.addresses.Base).toBe(BASE_CONTRACTS.DESPXA);
  });

  it('keeps TFT on Base (the historical Polygon mislabel is fixed)', () => {
    expect(ADDRESSES[Blockchain.Base].TFT_001).toBe('0xB48F4d5E455a6d67f26FE364a201F51FF71aaB26');
    expect(TOKENS.TFT_001.addresses.Base).toBe(ADDRESSES[Blockchain.Base].TFT_001);
    expect(TOKENS.TFT_001.addresses.Polygon).toBeUndefined();
  });

  it('lists TLT on Base only', () => {
    expect(ADDRESSES[Blockchain.Base].TLT_001).toBe('0xE62B14EDEA1Db8219CAd1bd4e15755E50E58413d');
    expect(TOKENS.TLT_001.addresses.Base).toBe(ADDRESSES[Blockchain.Base].TLT_001);
    expect(Object.keys(TOKENS.TLT_001.addresses)).toEqual([Blockchain.Base]);
  });
});
