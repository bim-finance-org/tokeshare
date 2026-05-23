import { useMemo } from 'react';
import { usePaxgPrice } from '@/hooks/usePaxgPrice';
import { useCmc20Price } from '@/hooks/useCmc20Price';
import { useDeSPXAPrice } from '@/hooks/useDeSPXAPrice';
import { calculateTGGPrice, calculateTMCPrice, calculateTSP500Price } from '@/utils/priceUtils';
import { useMarketplaceContract } from './useMarketplaceContracts';

export type TokenPriceResult = {
  price: number | null;
  isLoading: boolean;
};

export function useTGGPrice(): TokenPriceResult {
  const { data: paxgPrice, isLoading } = usePaxgPrice();
  return {
    price: paxgPrice !== undefined ? calculateTGGPrice(paxgPrice) : null,
    isLoading,
  };
}

export function useTMCPrice(): TokenPriceResult {
  const { data: cmc20Price, isLoading } = useCmc20Price();
  return {
    price: cmc20Price !== undefined ? calculateTMCPrice(cmc20Price) : null,
    isLoading,
  };
}

export function useTSP500Price(): TokenPriceResult {
  const { data: despxaPrice, isLoading } = useDeSPXAPrice();
  return {
    price: despxaPrice !== undefined ? calculateTSP500Price(despxaPrice) : null,
    isLoading,
  };
}

export function useTFTPrice(): TokenPriceResult {
  const { tftTokenInfo, tftTokenInfoLoading } = useMarketplaceContract();
  const [pricePerToken] = (tftTokenInfo ?? []) as [bigint];
  const price = Number(pricePerToken) / 10 ** 18;
  return { price: price || null, isLoading: tftTokenInfoLoading };
}

/**
 * Generic dispatcher kept for components that don't know the symbol at compile time
 * (e.g. the shared commodities Swap component that handles TGG/TMC/TSP500 via a prop).
 * For known symbols, prefer the dedicated hooks — they only fire the underlying
 * price query that is actually needed.
 */
export function useTokenPrice(symbol: string): TokenPriceResult {
  const tgg = useTGGPrice();
  const tmc = useTMCPrice();
  const tsp500 = useTSP500Price();
  const tft = useTFTPrice();

  return useMemo(() => {
    switch (symbol) {
      case 'TGG':
        return tgg;
      case 'TMC':
        return tmc;
      case 'TSP500':
        return tsp500;
      case 'TFT_001':
        return tft;
      default:
        return { price: null, isLoading: false };
    }
  }, [symbol, tgg, tmc, tsp500, tft]);
}
