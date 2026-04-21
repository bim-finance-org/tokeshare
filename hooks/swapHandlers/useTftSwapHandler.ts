import { useMarketplaceContract } from '@/hooks/useMarketplaceContracts';
import { useMemo } from 'react';
import { TokenSwapHandler } from '@/interfaces/TokenSwapHandler';

export const useTftSwapHandler = (): TokenSwapHandler => {
  const {
    buyTokenOnMarketplace,
    sellTokenOnMarketplace,
    isPending: isPendingTFT,
    error: errorTFT,
    hash: hashTFT,
  } = useMarketplaceContract();

  return useMemo(
    () => ({
      swapIn: async ({ tokenSymbol, amount, stablecoin }) => {
        await buyTokenOnMarketplace(tokenSymbol, amount, stablecoin);
      },
      swapOut: async ({ tokenSymbol, amount, stablecoin }) => {
        await sellTokenOnMarketplace(tokenSymbol, amount, stablecoin);
      },
      isPending: isPendingTFT,
      error: errorTFT,
      hash: hashTFT,
    }),
    [buyTokenOnMarketplace, sellTokenOnMarketplace, isPendingTFT, errorTFT, hashTFT],
  );
};
