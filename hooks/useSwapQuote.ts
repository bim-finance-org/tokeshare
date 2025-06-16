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

// Hook de debounce personnalisé avec logique plus intelligente
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

export const useSwapQuote = (params: SwapQuoteParams | null): SwapQuoteResult => {
  const [outputAmount, setOutputAmount] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState<string | null>(null);
  const [lastSuccessfulParams, setLastSuccessfulParams] = useState<string | null>(null);

  const { getSwapRoute, getConversion } = useSwap();

  // Debounce intelligent avec délai adaptatif
  const inputAmount = params?.inputAmount || '';
  const { debouncedValue: debouncedAmount, isTyping } = useSmartDebounce(inputAmount, 1500);

  useEffect(() => {
    if (!params || !debouncedAmount || parseFloat(debouncedAmount) <= 0) {
      setOutputAmount(null);
      setExchangeRate(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const amount = parseFloat(debouncedAmount);
    
    // Seuil minimum plus élevé pour éviter les micro-transactions
    if (amount < 0.1) {
      setOutputAmount(null);
      setExchangeRate(null);
      return;
    }

    // Arrondir à 1 décimale pour grouper les appels similaires
    const roundedAmount = Math.round(amount * 10) / 10;
    
    // Créer une clé unique pour ces paramètres
    const paramsKey = `${params.inputToken}-${params.outputToken}-${roundedAmount}-${params.direction}`;
    
    // Ne faire l'appel que si les paramètres ont vraiment changé
    if (paramsKey === lastSuccessfulParams) {
      return;
    }

    // Eviter les appels pour des changements de moins de 5% du montant précédent
    if (lastSuccessfulParams) {
      const lastAmount = parseFloat(lastSuccessfulParams.split('-')[2]);
      const changePercentage = Math.abs(roundedAmount - lastAmount) / lastAmount;
      if (changePercentage < 0.05) {
        return;
      }
    }

    const fetchQuote = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (params.direction === 'stablecoin-to-tgg') {
          // Direction: Stablecoin → TGG
          // 1. Obtenir le montant de PAXG via KyberSwap
          const inputDecimals = getTokenDecimals(params.inputToken);
          if (inputDecimals === undefined) {
            throw new Error(`Impossible de déterminer les décimales pour le token ${params.inputToken}`);
          }

          const amountInBaseUnits = (roundedAmount * Math.pow(10, inputDecimals)).toString();
          
          const routeSummary = await getSwapRoute({
            tokenIn: params.inputToken,
            tokenOut: CONTRACTS.PAXG as Address,
            amountIn: amountInBaseUnits,
            gasInclude: true,
            slippageTolerance: 200
          });

          // 2. Convertir le montant PAXG en TGG
          const paxgAmountReceived = parseFloat(routeSummary.amountOut) / Math.pow(10, 18); // PAXG a 18 décimales
          const tggAmount = paxgAmountReceived * 31.1034768; // 1 once troy = 31.1034768 grammes
          
          setOutputAmount(tggAmount.toFixed(6));
          
          // Calculer le taux de change
          const rate = tggAmount / roundedAmount;
          setExchangeRate(`1 ${getTokenSymbol(params.inputToken)} = ${rate.toFixed(6)} TGG`);

        } else {
          // Direction: TGG → Stablecoin
          // 1. Convertir TGG en PAXG
          const paxgAmount = await getConversion({ tggAmount: roundedAmount.toString() });
          const paxgAmountInBaseUnits = (paxgAmount * Math.pow(10, 18)).toString();

          // 2. Obtenir le montant de stablecoin via KyberSwap
          const routeSummary = await getSwapRoute({
            tokenIn: CONTRACTS.PAXG as Address,
            tokenOut: params.outputToken,
            amountIn: paxgAmountInBaseUnits,
            gasInclude: true,
            slippageTolerance: 200
          });

          const outputDecimals = getTokenDecimals(params.outputToken);
          if (outputDecimals === undefined) {
            throw new Error(`Impossible de déterminer les décimales pour le token ${params.outputToken}`);
          }

          const stablecoinAmount = parseFloat(routeSummary.amountOut) / Math.pow(10, outputDecimals);
          
          setOutputAmount(stablecoinAmount.toFixed(4));
          
          // Calculer le taux de change
          const rate = stablecoinAmount / roundedAmount;
          setExchangeRate(`1 TGG = ${rate.toFixed(4)} ${getTokenSymbol(params.outputToken)}`);
        }

        // Marquer ces paramètres comme ayant été traités avec succès
        setLastSuccessfulParams(paramsKey);

      } catch (err) {
        console.error('Erreur lors de la récupération du quote:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        setOutputAmount(null);
        setExchangeRate(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuote();

  }, [params?.inputToken, params?.outputToken, debouncedAmount, params?.direction, getSwapRoute, getConversion]);

  return {
    outputAmount,
    isLoading: isLoading || isTyping, // Afficher loading pendant la frappe aussi
    error,
    exchangeRate
  };
};

// Fonction helper pour obtenir le symbole du token
const getTokenSymbol = (tokenAddress: Address): string => {
  // Map des adresses vers les symboles
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