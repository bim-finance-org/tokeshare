import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Address } from 'viem';
import { useSwap } from './useSwap';
import { TMC_CMC20_RATIO } from './useTmcSwap';
import { TSP500_DESPXA_RATIO } from './useTsp500Swap';
import { BASE_CONTRACTS, getTGGContracts } from '@/contracts/contracts';
import { getTokenDecimals } from '@/utils/tokenUtils';
import { SwapDirection } from '@/enums/Directions';
import { Blockchain } from '@/enums/Blockchain';
import {
  DECIMALS_18,
  NUMBER_TO_FIXE_4,
  NUMBER_TO_FIXE_6,
  ONCE_DIVISION,
  SLIPPAGE_TOLERANCE,
} from '@/constants/constants';
import { RouteParams } from '@/interfaces/RouteParams';
import { RouteSummary } from '@/interfaces/RouteSummary';

interface SwapQuoteParams {
  inputToken: Address;
  outputToken: Address;
  inputAmount: string;
  direction: SwapDirection;
}

interface SwapQuoteResult {
  outputAmount: string | null;
  isLoading: boolean;
  error: string | null;
  exchangeRate: string | null;
}

type QuoteResult = { outputAmount: string; exchangeRate: string };

const DEBOUNCE_DELAY_MS = 500;
const MINIMUM_AMOUNT_TO_GET_QUOTE = 0.01;
const TFT_PRICE_USD = 31.25;
const TFT_SELL_FEE = 0.05;

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

// Plain async fetcher for non-TGG (Base-only) tokens — no wagmi hooks needed.
async function getBaseSwapRoute(params: RouteParams): Promise<RouteSummary> {
  const queryParams = new URLSearchParams({
    tokenIn: params.tokenIn,
    tokenOut: params.tokenOut,
    amountIn: params.amountIn,
    ...(params.gasInclude && { gasInclude: params.gasInclude.toString() }),
    ...(params.slippageTolerance && { slippageTolerance: params.slippageTolerance.toString() }),
    excludedSources:
      'kyberswap-limit-order-v2,kyberswap-limit-order,kyberswap-pmm,kyber-pmm,hashflow-v3,bebop,clipper,native-v1,native-v2',
  });

  const url = `https://aggregator-api.kyberswap.com/base/api/v1/routes?${queryParams}`;
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'X-Client-Id': 'tokeshare-dapp' },
  });

  if (!response.ok) throw new Error(`HTTP Error ${response.status}: ${await response.text()}`);

  const data = await response.json();
  if (data.code !== 0 || !data.data?.routeSummary) throw new Error(`API Error: ${data.message}`);

  return data.data.routeSummary;
}

function computeTftQuote(params: SwapQuoteParams): QuoteResult {
  if (params.direction === SwapDirection.StablecoinToToken) {
    return {
      outputAmount: (parseFloat(params.inputAmount) / TFT_PRICE_USD).toFixed(6),
      exchangeRate: (1 / TFT_PRICE_USD).toFixed(4),
    };
  }
  const gross = parseFloat(params.inputAmount) * TFT_PRICE_USD;
  const net = gross * (1 - TFT_SELL_FEE);
  return {
    outputAmount: net.toFixed(2),
    exchangeRate: (TFT_PRICE_USD * (1 - TFT_SELL_FEE)).toFixed(4),
  };
}

export const useSwapQuote = (
  params: SwapQuoteParams | null,
  tokenSymbol: string,
  blockchain: Blockchain = Blockchain.Polygon,
): SwapQuoteResult => {
  const { getSwapRoute, getConversion } = useSwap();

  const inputAmount = params?.inputAmount || '';
  const { debouncedValue: debouncedAmount, isTyping } = useSmartDebounce(inputAmount, DEBOUNCE_DELAY_MS);

  const enabled =
    !!params &&
    !!debouncedAmount &&
    !isNaN(Number(debouncedAmount)) &&
    parseFloat(debouncedAmount) >= MINIMUM_AMOUNT_TO_GET_QUOTE;

  const { data, isFetching, error } = useQuery<QuoteResult>({
    queryKey: ['swap-quote', tokenSymbol, blockchain, params?.inputToken, params?.outputToken, params?.direction, debouncedAmount],
    enabled,
    queryFn: async () => {
      if (!params) throw new Error('Missing swap params');
      const amount = parseFloat(debouncedAmount);

      if (tokenSymbol === 'TGG') {
        const contracts = getTGGContracts(blockchain);
        if (params.direction === SwapDirection.StablecoinToToken) {
          const inputDecimals = getTokenDecimals(params.inputToken);
          if (inputDecimals == null) throw new Error('Missing decimal');
          const amountInBase = BigInt(Math.floor(amount * 10 ** inputDecimals)).toString();

          const route = await getSwapRoute(
            {
              tokenIn: params.inputToken,
              tokenOut: contracts.PAXG as Address,
              amountIn: amountInBase,
              gasInclude: true,
              slippageTolerance: SLIPPAGE_TOLERANCE,
            },
            blockchain,
          );

          const paxgAmount = parseFloat(route.amountOut) / DECIMALS_18;
          const tggAmount = paxgAmount * ONCE_DIVISION;
          return {
            outputAmount: tggAmount.toFixed(NUMBER_TO_FIXE_6),
            exchangeRate: (tggAmount / amount).toFixed(NUMBER_TO_FIXE_6),
          };
        }

        const paxgAmount = await getConversion({ amount: amount.toString(), blockchain });
        const paxgAmountBase = BigInt(Math.floor(paxgAmount * DECIMALS_18)).toString();

        const route = await getSwapRoute(
          {
            tokenIn: contracts.PAXG as Address,
            tokenOut: params.outputToken,
            amountIn: paxgAmountBase,
            gasInclude: true,
            slippageTolerance: SLIPPAGE_TOLERANCE,
          },
          blockchain,
        );

        const outputDecimals = getTokenDecimals(params.outputToken);
        if (outputDecimals == null) throw new Error('Missing decimal');
        const stablecoinAmount = parseFloat(route.amountOut) / 10 ** outputDecimals;
        return {
          outputAmount: stablecoinAmount.toFixed(NUMBER_TO_FIXE_4),
          exchangeRate: (stablecoinAmount / amount).toFixed(NUMBER_TO_FIXE_6),
        };
      }

      if (tokenSymbol === 'TFT_001') {
        return computeTftQuote(params);
      }

      if (tokenSymbol === 'TMC' || tokenSymbol === 'TSP500') {
        const ratio = tokenSymbol === 'TMC' ? TMC_CMC20_RATIO : TSP500_DESPXA_RATIO;
        const underlying = tokenSymbol === 'TMC' ? BASE_CONTRACTS.CMC20 : BASE_CONTRACTS.DESPXA;

        if (params.direction === SwapDirection.StablecoinToToken) {
          const inputDecimals = getTokenDecimals(params.inputToken);
          if (inputDecimals == null) throw new Error('Missing decimal');
          const amountInBase = BigInt(Math.floor(amount * 10 ** inputDecimals)).toString();

          const route = await getBaseSwapRoute({
            tokenIn: params.inputToken,
            tokenOut: underlying as Address,
            amountIn: amountInBase,
            gasInclude: true,
            slippageTolerance: SLIPPAGE_TOLERANCE,
          });

          const underlyingAmount = parseFloat(route.amountOut) / DECIMALS_18;
          const tokenAmount = underlyingAmount * ratio;
          return {
            outputAmount: tokenAmount.toFixed(NUMBER_TO_FIXE_6),
            exchangeRate: (tokenAmount / amount).toFixed(NUMBER_TO_FIXE_6),
          };
        }

        const underlyingAmount = amount / ratio;
        const underlyingBase = BigInt(Math.floor(underlyingAmount * DECIMALS_18)).toString();

        const route = await getBaseSwapRoute({
          tokenIn: underlying as Address,
          tokenOut: params.outputToken,
          amountIn: underlyingBase,
          gasInclude: true,
          slippageTolerance: SLIPPAGE_TOLERANCE,
        });

        const outputDecimals = getTokenDecimals(params.outputToken);
        if (outputDecimals == null) throw new Error('Missing decimal');
        const stablecoinAmount = parseFloat(route.amountOut) / 10 ** outputDecimals;
        return {
          outputAmount: stablecoinAmount.toFixed(NUMBER_TO_FIXE_4),
          exchangeRate: (stablecoinAmount / amount).toFixed(NUMBER_TO_FIXE_6),
        };
      }

      throw new Error(`Unsupported token symbol: ${tokenSymbol}`);
    },
  });

  return {
    outputAmount: data?.outputAmount ?? null,
    exchangeRate: data?.exchangeRate ?? null,
    isLoading: isFetching || isTyping,
    error: error ? (error as Error).message : null,
  };
};
