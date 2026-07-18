import { SwapDirection } from '@/enums/Directions';
import { getTokenDecimals } from '@/utils/tokenUtils';
import { NUMBER_TO_FIXE_4, NUMBER_TO_FIXE_6, SLIPPAGE_TOLERANCE } from '@/constants/constants';
import type { QuoteInput, QuoteResult, ZapQuoteConfig } from './types';

/**
 * Shared buy/sell quote algorithm for every zap-routed token. The 4 near-identical
 * branches of the old useSwapQuote collapse here — each token just supplies a
 * ZapQuoteConfig (underlying, decimals, ratio, route fetcher, sell conversion).
 *
 * - Buy  (stable → token): stable → underlying via KyberSwap, then × ratio.
 * - Sell (token → stable): token → underlying (config), then underlying → stable via KyberSwap.
 */
export async function computeZapQuote({ params, amount }: QuoteInput, config: ZapQuoteConfig): Promise<QuoteResult> {
  const { getRoute, underlying, underlyingDecimals, underlyingToToken, tokenToUnderlying } = config;

  if (params.direction === SwapDirection.StablecoinToToken) {
    const inputDecimals = getTokenDecimals(params.inputToken);
    if (inputDecimals == null) throw new Error('Missing decimal');
    const amountInBase = BigInt(Math.floor(amount * 10 ** inputDecimals)).toString();

    const route = await getRoute({
      tokenIn: params.inputToken,
      tokenOut: underlying,
      amountIn: amountInBase,
      gasInclude: true,
      slippageTolerance: SLIPPAGE_TOLERANCE,
    });

    const underlyingAmount = parseFloat(route.amountOut) / 10 ** underlyingDecimals;
    const tokenAmount = underlyingToToken(underlyingAmount);
    return {
      outputAmount: tokenAmount.toFixed(NUMBER_TO_FIXE_6),
      exchangeRate: (tokenAmount / amount).toFixed(NUMBER_TO_FIXE_6),
    };
  }

  const underlyingAmount = await tokenToUnderlying(amount);
  const underlyingBase = BigInt(Math.floor(underlyingAmount * 10 ** underlyingDecimals)).toString();

  const route = await getRoute({
    tokenIn: underlying,
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
