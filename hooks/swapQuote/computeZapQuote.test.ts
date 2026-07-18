import { describe, it, expect, vi } from 'vitest';
import { computeZapQuote } from './computeZapQuote';
import { SwapDirection } from '@/enums/Directions';
import type { RouteSummary } from '@/interfaces/RouteSummary';
import type { ZapQuoteConfig } from './types';

// Addresses present in KNOWN_DECIMALS (utils/tokenUtils) so getTokenDecimals resolves.
const USDC = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359' as const; // 6 decimals
const PAXG = '0x553d3D295e0f695B9228246232eDF400ed3560B5' as const; // 18 decimals
const ONCE = 31.1034768;

const route = (amountOut: string) => ({ amountOut }) as RouteSummary;

const goldConfig = (getRoute: ZapQuoteConfig['getRoute']): ZapQuoteConfig => ({
  getRoute,
  underlying: PAXG,
  underlyingDecimals: 18,
  underlyingToToken: (u) => u * ONCE,
  tokenToUnderlying: async (a) => a / ONCE,
});

describe('computeZapQuote', () => {
  it('buy: routes stable→underlying then applies the ratio', async () => {
    const getRoute = vi.fn().mockResolvedValue(route('1000000000000000000')); // 1 PAXG (1e18)
    const r = await computeZapQuote(
      { params: { inputToken: USDC, outputToken: PAXG, inputAmount: '100', direction: SwapDirection.StablecoinToToken }, amount: 100 },
      goldConfig(getRoute),
    );

    // 1 PAXG * 31.1034768 = 31.1034768 tokens
    expect(r.outputAmount).toBe('31.103477');
    expect(r.exchangeRate).toBe('0.311035');

    // amountIn scaled by the input token's 6 decimals; routed to the underlying.
    expect(getRoute).toHaveBeenCalledWith(
      expect.objectContaining({ tokenIn: USDC, tokenOut: PAXG, amountIn: '100000000', gasInclude: true, slippageTolerance: 200 }),
    );
  });

  it('sell: converts token→underlying then routes underlying→stable', async () => {
    const getRoute = vi.fn().mockResolvedValue(route('5000000')); // 5 USDC (1e6)
    const r = await computeZapQuote(
      { params: { inputToken: PAXG, outputToken: USDC, inputAmount: '10', direction: SwapDirection.TokenToStablecoin }, amount: 10 },
      goldConfig(getRoute),
    );

    expect(r.outputAmount).toBe('5.0000');
    expect(r.exchangeRate).toBe('0.500000');
    expect(getRoute).toHaveBeenCalledWith(expect.objectContaining({ tokenIn: PAXG, tokenOut: USDC }));
  });

  it('throws when the token decimals are unknown', async () => {
    const unknown = '0x000000000000000000000000000000000000dEaD' as const;
    await expect(
      computeZapQuote(
        { params: { inputToken: unknown, outputToken: PAXG, inputAmount: '1', direction: SwapDirection.StablecoinToToken }, amount: 1 },
        goldConfig(vi.fn()),
      ),
    ).rejects.toThrow('Missing decimal');
  });
});
