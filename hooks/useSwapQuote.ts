import { useState, useEffect, useRef } from 'react';
import { Address } from 'viem';
import { useSwap } from './useSwap';
import { CONTRACTS } from '@/contracts/contracts';
import { getTokenDecimals } from '@/utils/tokenUtils';

interface SwapQuoteParams {
  inputToken: Address;
  outputToken: Address;
  inputAmount: string;
  direction: 'stablecoin-to-tgg' | 'tgg-to-stablecoin';
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

  useEffect(() => {
    setIsTyping(true);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
      setIsTyping(false);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
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
export const useSwapQuote = (params: SwapQuoteParams | null): SwapQuoteResult => {
  const [outputAmount, setOutputAmount] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState<string | null>(null);
  const [lastParamsKey, setLastParamsKey] = useState<string | null>(null);

  const { getSwapRoute, getConversion } = useSwap();

  const inputAmount = params?.inputAmount || '';
  const { debouncedValue: debouncedAmount, isTyping } = useSmartDebounce(inputAmount, 1200);

  useEffect(() => {
    if (!params || !debouncedAmount || isNaN(Number(debouncedAmount)) || parseFloat(debouncedAmount) < 0.1) {
      setOutputAmount(null);
      setExchangeRate(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const amount = parseFloat(debouncedAmount);

    const paramsKey = [
      params.inputToken,
      params.outputToken,
      amount.toFixed(6),
      params.direction
    ].join('-');

    if (paramsKey === lastParamsKey) return;

    setIsLoading(true);
    setError(null);

    const fetchQuote = async () => {
      try {
        if (params.direction === 'stablecoin-to-tgg') {
          const inputDecimals = getTokenDecimals(params.inputToken);
          if (inputDecimals == null) throw new Error('Décimales manquantes');
          const amountInBase = (amount * 10 ** inputDecimals).toString();

          const route = await getSwapRoute({
            tokenIn: params.inputToken,
            tokenOut: CONTRACTS.PAXG as Address,
            amountIn: amountInBase,
            gasInclude: true,
            slippageTolerance: 200
          });

          const paxgAmount = parseFloat(route.amountOut) / 1e18;
          const tggAmount = paxgAmount * 31.1034768;
          setOutputAmount(tggAmount.toFixed(6));
          setExchangeRate(`1 ${getTokenSymbol(params.inputToken)} ≈ ${(tggAmount/amount).toFixed(6)} TGG`);

        } else {
          // 1. TGG -> PAXG
          const paxgAmount = await getConversion({ tggAmount: amount.toString() });
          const paxgAmountBase = (paxgAmount * 1e18).toString();

          // 2. PAXG -> Stablecoin
          const route = await getSwapRoute({
            tokenIn: CONTRACTS.PAXG as Address,
            tokenOut: params.outputToken,
            amountIn: paxgAmountBase,
            gasInclude: true,
            slippageTolerance: 200
          });

          const outputDecimals = getTokenDecimals(params.outputToken);
          if (outputDecimals == null) throw new Error('Décimales manquantes');
          const stablecoinAmount = parseFloat(route.amountOut) / (10 ** outputDecimals);
          setOutputAmount(stablecoinAmount.toFixed(4));
          setExchangeRate(`1 TGG ≈ ${(stablecoinAmount/amount).toFixed(4)} ${getTokenSymbol(params.outputToken)}`);
        }
        setLastParamsKey(paramsKey);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        setOutputAmount(null);
        setExchangeRate(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuote();

  }, [params, debouncedAmount]);

  return {
    outputAmount,
    isLoading: isLoading || isTyping,
    error,
    exchangeRate,
  };
};


const getTokenSymbol = (tokenAddress: Address): string => {
  const tokenSymbols: Record<string, string> = {
    [CONTRACTS.TGG as string]: 'TGG',
    [CONTRACTS.PAXG as string]: 'PAXG',
    // Polygon addresses
    '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': 'USDT',
    '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359': 'USDC',
    '0x8f3cf7ad23cd3cadbD9735aff958023239c6a063': 'DAI',
    '0xe111178a87a3bff0c8d18decba5798827539ae99': 'EURS',
    '0x2791bca1f2de4661ed88a30c99a7a9449aa84174': 'USDCE',
    // Base addresses
    '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': 'USDC',
    '0x50c5725949a6f0c72e6c4a641f24049a917db0cb': 'DAI',
    '0x60a3e35cc302bfa44cb288bc5a4f316fdb1adb42': 'EURC',
  };
  
  return tokenSymbols[tokenAddress.toLowerCase()] || 'TOKEN';
}; 