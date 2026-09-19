import { SwapDirection } from '@/enums/Directions';
import { NUMBER_TO_FIXE_2, NUMBER_TO_FIXE_4, NUMBER_TO_FIXE_6, TFT_001_PRICE_USD, TLT_001_PRICE_USD } from '@/constants/constants';
import type { MarketplaceTokenSymbol } from '@/config/token';
import type { QuoteInput, QuoteResult, QuoteStrategy } from './types';

// Mirrors `Marketplace.sellFeeBps` (500 bps) — the contract keeps this cut on sells.
const MARKETPLACE_SELL_FEE = 0.05;

/**
 * Fixed USD price of each token listed on the Base Marketplace. Kept in sync
 * with the on-chain listing (`Marketplace.getTokenInfo`), which is the source
 * the Swap UI and `/api/tokens` actually read; this map only serves the
 * synchronous quote.
 */
export const MARKETPLACE_PRICES_USD: Record<MarketplaceTokenSymbol, number> = {
  TFT_001: TFT_001_PRICE_USD,
  TLT_001: TLT_001_PRICE_USD,
};

/**
 * Quote strategy for a token sold at a fixed price on the Marketplace — the
 * only tokens quoted without a KyberSwap route.
 */
export function makeMarketplaceQuote(priceUsd: number): QuoteStrategy {
  return ({ params }: QuoteInput): Promise<QuoteResult> => {
    if (params.direction === SwapDirection.StablecoinToToken) {
      return Promise.resolve({
        outputAmount: (parseFloat(params.inputAmount) / priceUsd).toFixed(NUMBER_TO_FIXE_6),
        exchangeRate: (1 / priceUsd).toFixed(NUMBER_TO_FIXE_4),
      });
    }
    const gross = parseFloat(params.inputAmount) * priceUsd;
    const net = gross * (1 - MARKETPLACE_SELL_FEE);
    return Promise.resolve({
      outputAmount: net.toFixed(NUMBER_TO_FIXE_2),
      exchangeRate: (priceUsd * (1 - MARKETPLACE_SELL_FEE)).toFixed(NUMBER_TO_FIXE_4),
    });
  };
}

export const computeTftQuote = makeMarketplaceQuote(MARKETPLACE_PRICES_USD.TFT_001);
export const computeTltQuote = makeMarketplaceQuote(MARKETPLACE_PRICES_USD.TLT_001);
