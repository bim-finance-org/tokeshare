import { useMemo } from 'react';
import type { Address } from 'viem';
import { useSwap } from '../useSwap';
import { useTsgSwap } from '../useTsgSwap';
import { TMC_CMC20_RATIO } from '../useTmcSwap';
import { TSP500_DESPXA_RATIO } from '../useTsp500Swap';
import { BASE_CONTRACTS, getTGGContracts, getTSGContracts } from '@/contracts/contracts';
import { getTokenDecimals } from '@/utils/tokenUtils';
import { Blockchain } from '@/enums/Blockchain';
import { ONCE_DIVISION } from '@/constants/constants';
import { computeZapQuote } from './computeZapQuote';
import { computeTftQuote } from './computeTftQuote';
import { getBaseSwapRoute } from './getBaseSwapRoute';
import type { QuoteStrategy } from './types';

const PAYMENT_DECIMALS_18 = 18;
const XAGM_DECIMALS = 9;

/**
 * Builds the per-token quote registry. The two zap hooks must both run
 * unconditionally (Rules of Hooks) even though a given quote uses only one —
 * they return memoized callbacks, so mounting both fires no network by itself.
 * Each token's route/conversion callbacks are injected into the shared
 * `computeZapQuote` algorithm; TFT is the one fixed-price exception.
 */
export function useQuoteStrategies(blockchain: Blockchain): Record<string, QuoteStrategy> {
  const { getSwapRoute, getConversion } = useSwap();
  const { getSwapRoute: getSilverRoute, getConversion: getSilverConversion } = useTsgSwap();

  return useMemo<Record<string, QuoteStrategy>>(() => {
    const tggContracts = getTGGContracts(blockchain);
    const tsgContracts = getTSGContracts(blockchain);

    return {
      TGG: (input) =>
        computeZapQuote(input, {
          getRoute: (rp) => getSwapRoute(rp, blockchain),
          underlying: tggContracts.PAXG as Address,
          underlyingDecimals: PAYMENT_DECIMALS_18,
          underlyingToToken: (u) => u * ONCE_DIVISION,
          tokenToUnderlying: (amount) => getConversion({ amount: amount.toString(), blockchain }),
        }),
      TSG: (input) =>
        computeZapQuote(input, {
          getRoute: (rp) => getSilverRoute(rp, blockchain),
          underlying: tsgContracts.XAGM as Address,
          underlyingDecimals: getTokenDecimals(tsgContracts.XAGM as Address) ?? XAGM_DECIMALS,
          underlyingToToken: (u) => u * ONCE_DIVISION,
          tokenToUnderlying: (amount) => getSilverConversion({ amount: amount.toString(), blockchain }),
        }),
      TMC: (input) =>
        computeZapQuote(input, {
          getRoute: getBaseSwapRoute,
          underlying: BASE_CONTRACTS.CMC20 as Address,
          underlyingDecimals: PAYMENT_DECIMALS_18,
          underlyingToToken: (u) => u * TMC_CMC20_RATIO,
          tokenToUnderlying: async (amount) => amount / TMC_CMC20_RATIO,
        }),
      TSP500: (input) =>
        computeZapQuote(input, {
          getRoute: getBaseSwapRoute,
          underlying: BASE_CONTRACTS.DESPXA as Address,
          underlyingDecimals: PAYMENT_DECIMALS_18,
          underlyingToToken: (u) => u * TSP500_DESPXA_RATIO,
          tokenToUnderlying: async (amount) => amount / TSP500_DESPXA_RATIO,
        }),
      TFT_001: computeTftQuote,
    };
  }, [blockchain, getSwapRoute, getConversion, getSilverRoute, getSilverConversion]);
}
