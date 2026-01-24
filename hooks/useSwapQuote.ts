import { useState, useEffect, useRef } from 'react';
import { Address } from 'viem';
import { useSwap } from './useSwap';
import { TMC_CMC20_RATIO } from './useTmcSwap';
import { CONTRACTS, BASE_CONTRACTS } from '@/contracts/contracts';
import { getTokenDecimals } from '@/utils/tokenUtils';
import { SwapDirection } from '@/enums/Directions';
import {
  DECIMALS_18,
  NUMBER_TO_FIXE_4,
  NUMBER_TO_FIXE_6,
  ONCE_DIVISION,
  SLIPPAGE_TOLERANCE,
} from '@/constants/constants';
import { calculateTGGPrice } from '@/utils/priceUtils';
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

/**
 * Attends que l'utilisateur ait fini de taper avant de mettre à jour la valeur.
 * Retourne un indicateur d'activité de saisie.
 *
 * @param value La valeur à surveiller qui est l'input amount.
 * @param delay Le délai d'attente (en millisecondes) avant de considérer la saisie comme "terminée".
 * @returns Un objet contenant :
 *   - debouncedValue : la version retardée de value (change seulement après un délai sans modification)
 *   - isTyping : booléen indiquant si l'utilisateur est en train d'écrire
 */
const useSmartDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const [isTyping, setIsTyping] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clear = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  useEffect(() => {
    setIsTyping(true);
    clear();
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue((prev) => {
        if (prev !== value) return value;
        return prev;
      });
      setIsTyping(false);
    }, delay);

    return () => {
      clear();
    };
  }, [value, delay]);

  return { debouncedValue, isTyping };
};

/**
 * Vas récupérer la valeur de l'ouput amount en fonction de l'input amount, uniquement si l'utilisateur a arrêté d'écrire et si la valeur de 'paramsKey' a changé.
 * @param params Objet contenant les paramètres du swap (tokens, montant, direction).
 * @returns Un objet avec :
 *   - outputAmount : le montant obtenu après le swap
 *   - isLoading : booléen, true si le fetch est en cours ou si l'utilisateur tape
 *   - error : message d'erreur
 *   - exchangeRate : taux de change calculé
 */
export const useSwapQuote = (params: SwapQuoteParams | null, tokenSymbol: string): SwapQuoteResult => {
  const DEBOUNCE_DELAY = 500;
  const MINIMUM_AMOUNT_TO_GET_QUOTE = 0.01;

  const [outputAmount, setOutputAmount] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState<string | null>(null);
  const [lastParamsKey, setLastParamsKey] = useState<string | null>(null);

  const { getSwapRoute, getConversion } = useSwap();

  // Standalone function for TMC quote on Base (no wagmi hooks needed)
  const getTmcSwapRoute = async (params: RouteParams): Promise<RouteSummary> => {
    const queryParams = new URLSearchParams({
      tokenIn: params.tokenIn,
      tokenOut: params.tokenOut,
      amountIn: params.amountIn,
      ...(params.gasInclude && { gasInclude: params.gasInclude.toString() }),
      ...(params.slippageTolerance && { slippageTolerance: params.slippageTolerance.toString() }),
      excludedSources: 'kyberswap-limit-order-v2,kyberswap-limit-order',
    });

    const url = `https://aggregator-api.kyberswap.com/base/api/v1/routes?${queryParams}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Client-Id': 'tokeshare-dapp',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (data.code !== 0 || !data.data?.routeSummary) {
      throw new Error(`API Error: ${data.message}`);
    }

    return data.data.routeSummary;
  };

  const inputAmount = params?.inputAmount || '';
  const { debouncedValue: debouncedAmount, isTyping } = useSmartDebounce(inputAmount, DEBOUNCE_DELAY);

  const fetchQuoteTGG = async (params: SwapQuoteParams) => {
    try {
      const amount = parseFloat(debouncedAmount);

      const paramsKey = [
        params.inputToken,
        params.outputToken,
        amount.toFixed(NUMBER_TO_FIXE_6),
        params.direction,
      ].join('-');

      if (paramsKey === lastParamsKey) return;

      setIsLoading(true);
      setError(null);
      if (params.direction === SwapDirection.StablecoinToToken) {
        const inputDecimals = getTokenDecimals(params.inputToken);
        if (inputDecimals == null) throw new Error('Missing decimal');
        const amountInBase = BigInt(Math.floor(amount * 10 ** inputDecimals)).toString();

        const route = await getSwapRoute({
          tokenIn: params.inputToken,
          tokenOut: CONTRACTS.PAXG as Address,
          amountIn: amountInBase,
          gasInclude: true,
          slippageTolerance: SLIPPAGE_TOLERANCE,
        });

        const paxgAmount = parseFloat(route.amountOut) / DECIMALS_18;
        const tggAmount = paxgAmount * ONCE_DIVISION;
        setOutputAmount(tggAmount.toFixed(NUMBER_TO_FIXE_6));
        setExchangeRate(`${(tggAmount / amount).toFixed(NUMBER_TO_FIXE_6)}`);
      } else {
        const paxgAmount = await getConversion({
          tggAmount: amount.toString(),
        });
        const paxgAmountBase = BigInt(Math.floor(paxgAmount * DECIMALS_18)).toString();

        const route = await getSwapRoute({
          tokenIn: CONTRACTS.PAXG as Address,
          tokenOut: params.outputToken,
          amountIn: paxgAmountBase,
          gasInclude: true,
          slippageTolerance: SLIPPAGE_TOLERANCE,
        });

        const outputDecimals = getTokenDecimals(params.outputToken);
        if (outputDecimals == null) throw new Error('Missing decimal');
        const stablecoinAmount = parseFloat(route.amountOut) / 10 ** outputDecimals;
        setOutputAmount(stablecoinAmount.toFixed(NUMBER_TO_FIXE_4));
        setExchangeRate(`${(stablecoinAmount / amount).toFixed(NUMBER_TO_FIXE_6)}`);
      }
      setLastParamsKey(paramsKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknow error');
      setOutputAmount(null);
      setExchangeRate(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQuoteTMC = async (params: SwapQuoteParams) => {
    try {
      const amount = parseFloat(debouncedAmount);

      const paramsKey = [params.inputToken, params.outputToken, amount.toFixed(NUMBER_TO_FIXE_6), params.direction].join(
        '-',
      );

      if (paramsKey === lastParamsKey) return;

      setIsLoading(true);
      setError(null);

      if (params.direction === SwapDirection.StablecoinToToken) {
        const inputDecimals = getTokenDecimals(params.inputToken);
        if (inputDecimals == null) throw new Error('Missing decimal');
        const amountInBase = BigInt(Math.floor(amount * 10 ** inputDecimals)).toString();

        const route = await getTmcSwapRoute({
          tokenIn: params.inputToken,
          tokenOut: BASE_CONTRACTS.CMC20 as Address,
          amountIn: amountInBase,
          gasInclude: true,
          slippageTolerance: SLIPPAGE_TOLERANCE,
        });

        // CMC20 amount to TMC: multiply by ratio (10)
        const cmc20Amount = parseFloat(route.amountOut) / DECIMALS_18;
        const tmcAmount = cmc20Amount * TMC_CMC20_RATIO;
        setOutputAmount(tmcAmount.toFixed(NUMBER_TO_FIXE_6));
        setExchangeRate(`${(tmcAmount / amount).toFixed(NUMBER_TO_FIXE_6)}`);
      } else {
        // TMC to stablecoin: convert TMC to CMC20 using ratio (1 TMC = 1/10 CMC20)
        const cmc20Amount = amount / TMC_CMC20_RATIO;
        const cmc20AmountBase = BigInt(Math.floor(cmc20Amount * DECIMALS_18)).toString();

        const route = await getTmcSwapRoute({
          tokenIn: BASE_CONTRACTS.CMC20 as Address,
          tokenOut: params.outputToken,
          amountIn: cmc20AmountBase,
          gasInclude: true,
          slippageTolerance: SLIPPAGE_TOLERANCE,
        });

        const outputDecimals = getTokenDecimals(params.outputToken);
        if (outputDecimals == null) throw new Error('Missing decimal');
        const stablecoinAmount = parseFloat(route.amountOut) / 10 ** outputDecimals;
        setOutputAmount(stablecoinAmount.toFixed(NUMBER_TO_FIXE_4));
        setExchangeRate(`${(stablecoinAmount / amount).toFixed(NUMBER_TO_FIXE_6)}`);
      }
      setLastParamsKey(paramsKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setOutputAmount(null);
      setExchangeRate(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (
      !params ||
      !debouncedAmount ||
      isNaN(Number(debouncedAmount)) ||
      parseFloat(debouncedAmount) < MINIMUM_AMOUNT_TO_GET_QUOTE
    ) {
      setOutputAmount(null);
      setExchangeRate(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    if (tokenSymbol == 'TGG') {
      fetchQuoteTGG(params);
    } else if (tokenSymbol == 'TFT_001') {
      setIsLoading(true);
      if (params.direction === SwapDirection.StablecoinToToken) {
        setOutputAmount((parseFloat(params.inputAmount) / 31.25).toFixed(6));
        setExchangeRate((1 / 31.25).toFixed(4));
      } else {
        setOutputAmount((parseFloat(params.inputAmount) * 31.25).toFixed(2));
        setExchangeRate((31.25).toFixed(4));
      }
      setIsLoading(false);
    } else if (tokenSymbol == 'TMC') {
      fetchQuoteTMC(params);
    }
  }, [params, debouncedAmount]);

  return {
    outputAmount,
    isLoading: isLoading || isTyping,
    error,
    exchangeRate,
  };
};
