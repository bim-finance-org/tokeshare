import { useState, useEffect, useRef } from "react";
import { Address } from "viem";
import { useSwap } from "./useSwap";
import { CONTRACTS } from "@/contracts/contracts";
import { getTokenDecimals } from "@/utils/tokenUtils";
import { SwapDirection } from "@/enums/Directions";
import {
  DECIMALS_18,
  NUMBER_TO_FIXE_4,
  NUMBER_TO_FIXE_6,
  ONCE_DIVISION,
  SLIPPAGE_TOLERANCE,
} from "@/constants/constants";
import { calculateTGGPrice } from "@/utils/priceUtils";
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
export const useSwapQuote = (
  params: SwapQuoteParams | null,
  tokenSymbol: string
): SwapQuoteResult => {
  const DEBOUNCE_DELAY = 500;
  const MINIMUM_AMOUNT_TO_GET_QUOTE = 0.01;

  const [outputAmount, setOutputAmount] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState<string | null>(null);
  const [lastParamsKey, setLastParamsKey] = useState<string | null>(null);

  const { getSwapRoute, getConversion } = useSwap();

  const inputAmount = params?.inputAmount || "";
  const { debouncedValue: debouncedAmount, isTyping } = useSmartDebounce(
    inputAmount,
    DEBOUNCE_DELAY
  );

  const fetchQuoteTGG = async (params: SwapQuoteParams) => {
    try {
      const amount = parseFloat(debouncedAmount);

      const paramsKey = [
        params.inputToken,
        params.outputToken,
        amount.toFixed(NUMBER_TO_FIXE_6),
        params.direction,
      ].join("-");

      if (paramsKey === lastParamsKey) return;

      setIsLoading(true);
      setError(null);
      if (params.direction === SwapDirection.StablecoinToToken) {
        const inputDecimals = getTokenDecimals(params.inputToken);
        if (inputDecimals == null) throw new Error("Missing decimal");
        const amountInBase = BigInt(
          Math.floor(amount * 10 ** inputDecimals)
        ).toString();

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
        const paxgAmountBase = BigInt(
          Math.floor(paxgAmount * DECIMALS_18)
        ).toString();

        const route = await getSwapRoute({
          tokenIn: CONTRACTS.PAXG as Address,
          tokenOut: params.outputToken,
          amountIn: paxgAmountBase,
          gasInclude: true,
          slippageTolerance: SLIPPAGE_TOLERANCE,
        });

        const outputDecimals = getTokenDecimals(params.outputToken);
        if (outputDecimals == null) throw new Error("Missing decimal");
        const stablecoinAmount =
          parseFloat(route.amountOut) / 10 ** outputDecimals;
        setOutputAmount(stablecoinAmount.toFixed(NUMBER_TO_FIXE_4));
        setExchangeRate(
          `${(stablecoinAmount / amount).toFixed(NUMBER_TO_FIXE_6)}`
        );
      }
      setLastParamsKey(paramsKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknow error");
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

    if (tokenSymbol == "TGG") {
      fetchQuoteTGG(params);
    } else if (tokenSymbol == "TFT_001") {
      if (params.direction === SwapDirection.StablecoinToToken) {
        setOutputAmount((parseFloat(params.inputAmount) / 31.25).toFixed(6));
        setExchangeRate((1 / 31.25).toFixed(4));
      } else {
        setOutputAmount((parseFloat(params.inputAmount) * 31.25).toFixed(2));
        setExchangeRate((31.25).toFixed(4));
      }
      setIsLoading(false);
    }
  }, [params, debouncedAmount]);

  return {
    outputAmount,
    isLoading: isLoading || isTyping,
    error,
    exchangeRate,
  };
};
