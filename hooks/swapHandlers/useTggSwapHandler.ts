import { useSwap } from '@/hooks/useSwap';
import { TokenSwapHandler } from '@/interfaces/TokenSwapHandler';
import { Address } from 'viem';
import { CONTRACTS, TRUSTED_AGGREGATORS } from '@/contracts/contracts';
import { getTokenAddress } from '@/utils/token';
import { useMemo } from 'react';

export const useTggSwapHandler = (): TokenSwapHandler => {
  const { swapMint, swapWithdraw, isPending, error, hash } = useSwap();

  return useMemo(
    () => ({
      swapIn: async ({ stablecoin, amount, blockchain, walletAddress }) => {
        const inputToken = getTokenAddress(stablecoin, blockchain);
        const outputToken = CONTRACTS.PAXG as Address;
        const router = TRUSTED_AGGREGATORS.kyberSwap as Address;

        if (!inputToken) throw new Error('Input token address not found');

        await swapMint({
          inputToken,
          inputAmount: amount,
          outputToken,
          routerAddress: router,
          walletAddress,
        });
      },

      swapOut: async ({ stablecoin, amount, blockchain, walletAddress }) => {
        const outputToken = getTokenAddress(stablecoin, blockchain);
        const router = TRUSTED_AGGREGATORS.kyberSwap as Address;

        if (!outputToken) throw new Error('Output token address not found');

        await swapWithdraw({
          amount,
          outputToken,
          routerAddress: router,
          walletAddress,
        });
      },

      isPending,
      error,
      hash,
    }),
    [swapMint, swapWithdraw, isPending, error, hash],
  );
};
