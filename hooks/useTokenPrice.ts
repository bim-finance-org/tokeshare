import { useMemo } from 'react';
import { usePaxgPrice } from '@/hooks/usePaxgPrice';
import { useXagmPrice } from '@/hooks/useXagmPrice';
import { useCmc20Price } from '@/hooks/useCmc20Price';
import { useDeSPXAPrice } from '@/hooks/useDeSPXAPrice';
import { calculateTGGPrice, calculateTSGPrice, calculateTMCPrice, calculateTSP500Price } from '@/utils/priceUtils';
import { useMarketplaceContract } from './useMarketplaceContracts';
import type { MarketplaceTokenSymbol } from '@/config/token';

export type TokenPriceResult = {
  price: number | null;
  isLoading: boolean;
  isError: boolean;
  /** Re-run the underlying price query (used by the UI's retry action). */
  refetch: () => void;
};

export function useTGGPrice(enabled = true): TokenPriceResult {
  const { data: paxgPrice, isLoading, isError, refetch } = usePaxgPrice({ enabled });
  return {
    price: paxgPrice !== undefined ? calculateTGGPrice(paxgPrice) : null,
    isLoading,
    isError,
    refetch,
  };
}

export function useTSGPrice(enabled = true): TokenPriceResult {
  const { data: xagmPrice, isLoading, isError, refetch } = useXagmPrice({ enabled });
  return {
    price: xagmPrice !== undefined ? calculateTSGPrice(xagmPrice) : null,
    isLoading,
    isError,
    refetch,
  };
}

export function useTMCPrice(enabled = true): TokenPriceResult {
  const { data: cmc20Price, isLoading, isError, refetch } = useCmc20Price({ enabled });
  return {
    price: cmc20Price !== undefined ? calculateTMCPrice(cmc20Price) : null,
    isLoading,
    isError,
    refetch,
  };
}

export function useTSP500Price(enabled = true): TokenPriceResult {
  const { data: despxaPrice, isLoading, isError, refetch } = useDeSPXAPrice({ enabled });
  return {
    price: despxaPrice !== undefined ? calculateTSP500Price(despxaPrice) : null,
    isLoading,
    isError,
    refetch,
  };
}

/** Price of a fixed-price RWA, read off the Base Marketplace listing (`getTokenInfo`). */
export function useMarketplacePrice(symbol: MarketplaceTokenSymbol): TokenPriceResult {
  const { tokenInfo, tokenInfoLoading, tokenInfoError, tokenInfoRefetch } = useMarketplaceContract(symbol);
  const [pricePerToken] = (tokenInfo ?? []) as [bigint];
  const price = Number(pricePerToken) / 10 ** 18;
  return {
    price: price || null,
    isLoading: tokenInfoLoading,
    isError: tokenInfoError,
    refetch: () => {
      tokenInfoRefetch();
    },
  };
}

export const useTFTPrice = (): TokenPriceResult => useMarketplacePrice('TFT_001');
export const useTLTPrice = (): TokenPriceResult => useMarketplacePrice('TLT_001');

/**
 * Generic dispatcher kept for components that don't know the symbol at compile time
 * (e.g. the shared commodities Swap component that handles TGG/TMC/TSP500 via a prop).
 * For known symbols, prefer the dedicated hooks — they only fire the underlying
 * price query that is actually needed.
 */
export function useTokenPrice(symbol: string): TokenPriceResult {
  // Rules-of-hooks forces every price hook to run, but gating their underlying
  // query with `enabled` means only the active symbol's feed hits the network.
  const tgg = useTGGPrice(symbol === 'TGG');
  const tsg = useTSGPrice(symbol === 'TSG');
  const tmc = useTMCPrice(symbol === 'TMC');
  const tsp500 = useTSP500Price(symbol === 'TSP500');
  const tft = useTFTPrice();
  const tlt = useTLTPrice();

  return useMemo(() => {
    switch (symbol) {
      case 'TGG':
        return tgg;
      case 'TSG':
        return tsg;
      case 'TMC':
        return tmc;
      case 'TSP500':
        return tsp500;
      case 'TFT_001':
        return tft;
      case 'TLT_001':
        return tlt;
      default:
        return { price: null, isLoading: false, isError: false, refetch: () => {} };
    }
  }, [symbol, tgg, tsg, tmc, tsp500, tft, tlt]);
}
