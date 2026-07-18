import type { Address } from 'viem';
import type { SwapDirection } from '@/enums/Directions';
import type { RouteParams } from '@/interfaces/RouteParams';
import type { RouteSummary } from '@/interfaces/RouteSummary';

export type SwapQuoteParams = {
  inputToken: Address;
  outputToken: Address;
  inputAmount: string;
  direction: SwapDirection;
};

/** Normalized output every quote strategy returns. */
export type QuoteResult = { outputAmount: string; exchangeRate: string };

/** Normalized input every quote strategy receives. */
export type QuoteInput = { params: SwapQuoteParams; amount: number };

/**
 * A quote strategy: same input, same output, one per token. Dispatched by
 * symbol in `useQuoteStrategies`.
 */
export type QuoteStrategy = (input: QuoteInput) => Promise<QuoteResult>;

/**
 * Everything that distinguishes one zap-routed token (TGG/TSG/TMC/TSP500) from
 * another. The buy/sell algorithm itself lives once in `computeZapQuote`.
 */
export type ZapQuoteConfig = {
  /** KyberSwap route fetcher with the target chain already bound. */
  getRoute: (params: RouteParams) => Promise<RouteSummary>;
  /** Token the zap routes through (PAXG for TGG, XAGM for TSG, CMC20 for TMC…). */
  underlying: Address;
  /** Decimals of the underlying token (18 for PAXG/CMC20/DESPXA, 9 for XAGM). */
  underlyingDecimals: number;
  /** underlying amount → base-token amount (buy direction). */
  underlyingToToken: (underlyingAmount: number) => number;
  /** base-token amount → underlying amount (sell); may read the withdraw fee on-chain. */
  tokenToUnderlying: (amount: number) => Promise<number>;
};
