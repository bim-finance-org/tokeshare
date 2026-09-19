import { describe, it, expect } from 'vitest';
import { computeTftQuote, computeTltQuote, makeMarketplaceQuote } from './computeMarketplaceQuote';
import { SwapDirection } from '@/enums/Directions';
import type { SwapQuoteParams } from './types';

const dummy = '0x0000000000000000000000000000000000000001' as const;

const params = (direction: SwapDirection, inputAmount: string): SwapQuoteParams => ({
  inputToken: dummy,
  outputToken: dummy,
  inputAmount,
  direction,
});

describe('computeTftQuote', () => {
  it('buys TFT at the fixed 31.25 USD price', async () => {
    const r = await computeTftQuote({ params: params(SwapDirection.StablecoinToToken, '31.25'), amount: 31.25 });
    expect(r.outputAmount).toBe('1.000000');
    expect(r.exchangeRate).toBe('0.0320');
  });

  it('sells TFT at 31.25 minus the 5% fee', async () => {
    const r = await computeTftQuote({ params: params(SwapDirection.TokenToStablecoin, '1'), amount: 1 });
    // 1 * 31.25 * 0.95 = 29.6875 -> toFixed(2)
    expect(r.outputAmount).toBe('29.69');
    expect(r.exchangeRate).toBe('29.6875');
  });

  it('scales the buy output with the input', async () => {
    const r = await computeTftQuote({ params: params(SwapDirection.StablecoinToToken, '62.5'), amount: 62.5 });
    expect(r.outputAmount).toBe('2.000000');
  });
});

describe('computeTltQuote', () => {
  it('buys TLT at the fixed 25 USD price', async () => {
    const r = await computeTltQuote({ params: params(SwapDirection.StablecoinToToken, '50'), amount: 50 });
    expect(r.outputAmount).toBe('2.000000');
    expect(r.exchangeRate).toBe('0.0400');
  });

  it('sells TLT at 25 minus the 5% fee', async () => {
    const r = await computeTltQuote({ params: params(SwapDirection.TokenToStablecoin, '2'), amount: 2 });
    // 2 * 25 * 0.95 = 47.5
    expect(r.outputAmount).toBe('47.50');
    expect(r.exchangeRate).toBe('23.7500');
  });
});

describe('makeMarketplaceQuote', () => {
  it('builds a strategy for any fixed price', async () => {
    const quote = makeMarketplaceQuote(10);
    const r = await quote({ params: params(SwapDirection.StablecoinToToken, '5'), amount: 5 });
    expect(r.outputAmount).toBe('0.500000');
  });
});
