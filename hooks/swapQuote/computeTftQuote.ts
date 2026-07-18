import { SwapDirection } from '@/enums/Directions';
import { NUMBER_TO_FIXE_2, NUMBER_TO_FIXE_4, NUMBER_TO_FIXE_6 } from '@/constants/constants';
import type { QuoteInput, QuoteResult } from './types';

// TFT is the only token quoted off a fixed price rather than a KyberSwap route.
const TFT_PRICE_USD = 31.25;
const TFT_SELL_FEE = 0.05;

export function computeTftQuote({ params }: QuoteInput): Promise<QuoteResult> {
  if (params.direction === SwapDirection.StablecoinToToken) {
    return Promise.resolve({
      outputAmount: (parseFloat(params.inputAmount) / TFT_PRICE_USD).toFixed(NUMBER_TO_FIXE_6),
      exchangeRate: (1 / TFT_PRICE_USD).toFixed(NUMBER_TO_FIXE_4),
    });
  }
  const gross = parseFloat(params.inputAmount) * TFT_PRICE_USD;
  const net = gross * (1 - TFT_SELL_FEE);
  return Promise.resolve({
    outputAmount: net.toFixed(NUMBER_TO_FIXE_2),
    exchangeRate: (TFT_PRICE_USD * (1 - TFT_SELL_FEE)).toFixed(NUMBER_TO_FIXE_4),
  });
}
