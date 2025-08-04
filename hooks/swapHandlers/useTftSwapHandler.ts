import { useMarketplaceContract } from '@/hooks/useMarketplaceContracts';
import { useMemo } from 'react';
import { TokenSwapHandler } from '@/interfaces/TokenSwapHandler';

export const useTftSwapHandler = (): TokenSwapHandler => {
  const { buyTokenOnMarketplace, isPending: isPendingTFT, error: errorTFT, hash: hashTFT } = useMarketplaceContract();

  return useMemo(
    () => ({
      swapIn: async ({ tokenSymbol, amount, stablecoin }) => {
        await buyTokenOnMarketplace(tokenSymbol, amount, stablecoin);
      },
      swapOut: async () => {
        // Not supported for TFT_001
      },
      isPending: isPendingTFT,
      error: errorTFT,
      hash: hashTFT,
    }),
    [buyTokenOnMarketplace, isPendingTFT, errorTFT, hashTFT],
  );
};
