import { useSwap } from '@/hooks/useSwap';
import { TokenSwapHandler } from '@/interfaces/TokenSwapHandler';
import { Address, parseUnits } from 'viem';
import { CONTRACTS, TRUSTED_AGGREGATORS } from '@/contracts/contracts';
import { getTokenAddress, getTokenDecimals } from '@/utils/token';
import { useMemo } from 'react';
import { useTokenPrice } from '../useTokenPrice';

export const useTggSwapHandler = (): TokenSwapHandler => {
  const { swapMint, swapWithdraw, isPending, error, hash } = useSwap();
  const { price } = useTokenPrice('TGG');
  return useMemo(
    () => ({
      swapIn: async ({ stablecoin, amount, blockchain, walletAddress }) => {
        const inputToken = getTokenAddress(stablecoin, blockchain);
        const outputToken = CONTRACTS.PAXG as Address;
        const router = TRUSTED_AGGREGATORS.kyberSwap as Address;

        if (!inputToken) throw new Error('Input token address not found');
        if (!price) throw new Error('Token price unavailable');

        const stableDecimals = getTokenDecimals(stablecoin);

        if (stableDecimals === undefined) throw new Error('Stablecoin decimals unknown');

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount)) throw new Error('Invalid amount');

        const stableAmount = parsedAmount * price;
        const parsedStableAmount = parseUnits(stableAmount.toString(), stableDecimals);
        console.log(parsedStableAmount);

        await swapMint({
          inputToken,
          inputAmount: stableAmount.toString(),
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
