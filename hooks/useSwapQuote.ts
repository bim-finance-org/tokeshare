import { useEffect, useRef, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Blockchain } from '@/enums/Blockchain';
import { useQuoteStrategies } from './swapQuote/useQuoteStrategies';
import type { QuoteResult, SwapQuoteParams } from './swapQuote/types';

export type { SwapQuoteParams } from './swapQuote/types';

interface SwapQuoteResult {
  outputAmount: string | null;
  isLoading: boolean;
  error: string | null;
  exchangeRate: string | null;
}

const DEBOUNCE_DELAY_MS = 500;
export const MINIMUM_AMOUNT_TO_GET_QUOTE = 0.01;

/**
 * Debounces a string value. `isTyping` is derived during render as
 * "the current value hasn't settled into the debounced value yet",
 * avoiding a setState-in-effect cascade.
 */
const useSmartDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value, delay]);

  return { debouncedValue, isTyping: value !== debouncedValue };
};

export const useSwapQuote = (
  params: SwapQuoteParams | null,
  tokenSymbol: string,
  blockchain: Blockchain = Blockchain.Polygon,
): SwapQuoteResult => {
  const strategies = useQuoteStrategies(blockchain);

  const inputAmount = params?.inputAmount || '';
  const { debouncedValue: debouncedAmount, isTyping } = useSmartDebounce(inputAmount, DEBOUNCE_DELAY_MS);

  const enabled =
    !!params &&
    !!debouncedAmount &&
    !isNaN(Number(debouncedAmount)) &&
    parseFloat(debouncedAmount) >= MINIMUM_AMOUNT_TO_GET_QUOTE &&
    // Only query once the amount has settled. The query key mixes instant params
    // (tokens/direction) with the debounced amount, so flipping direction — which
    // changes both at once — would otherwise fire a first quote with the new
    // direction but the stale debounced amount, then a second once the debounce
    // catches up (the "you receive" recalculating twice). Waiting for !isTyping
    // keeps direction and amount consistent so a single quote runs.
    !isTyping;

  const { data, isFetching, error } = useQuery<QuoteResult>({
    queryKey: [
      'swap-quote',
      tokenSymbol,
      blockchain,
      params?.inputToken,
      params?.outputToken,
      params?.direction,
      debouncedAmount,
    ],
    enabled,
    // Keep the last quote visible during the debounce window instead of
    // flashing the output back to "0" between a flip and the settled fetch.
    placeholderData: keepPreviousData,
    queryFn: async () => {
      if (!params) throw new Error('Missing swap params');
      const strategy = strategies[tokenSymbol];
      if (!strategy) throw new Error(`Unsupported token symbol: ${tokenSymbol}`);
      return strategy({ params, amount: parseFloat(debouncedAmount) });
    },
  });

  return {
    outputAmount: data?.outputAmount ?? null,
    exchangeRate: data?.exchangeRate ?? null,
    isLoading: isFetching || isTyping,
    error: error ? (error as Error).message : null,
  };
};
