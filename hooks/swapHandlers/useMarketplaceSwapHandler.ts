import { useMemo } from 'react';
import { useMarketplaceContract } from '@/hooks/useMarketplaceContracts';
import { TokenSwapHandler } from '@/interfaces/TokenSwapHandler';
import type { MarketplaceTokenSymbol } from '@/config/token';

/** Swap handler for a token sold at a fixed price on the Base Marketplace. */
export const useMarketplaceSwapHandler = (symbol: MarketplaceTokenSymbol): TokenSwapHandler => {
  const { buyTokenOnMarketplace, sellTokenOnMarketplace, isPending, error, hash } = useMarketplaceContract(symbol);

  return useMemo(
    () => ({
      swapIn: async ({ tokenSymbol, amount, stablecoin }) => {
        await buyTokenOnMarketplace(tokenSymbol, amount, stablecoin);
      },
      swapOut: async ({ tokenSymbol, amount, stablecoin }) => {
        await sellTokenOnMarketplace(tokenSymbol, amount, stablecoin);
      },
      isPending,
      error,
      hash,
    }),
    [buyTokenOnMarketplace, sellTokenOnMarketplace, isPending, error, hash],
  );
};
