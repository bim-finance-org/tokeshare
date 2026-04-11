import { useTsp500Swap } from '@/hooks/useTsp500Swap';
import { TokenSwapHandler } from '@/interfaces/TokenSwapHandler';
import { Address, parseUnits } from 'viem';
import { BASE_CONTRACTS, BASE_TRUSTED_AGGREGATORS } from '@/contracts/contracts';
import { getTokenAddress, getTokenDecimals } from '@/utils/token';
import { useMemo } from 'react';
import { useTokenPrice } from '../useTokenPrice';

export const useTsp500SwapHandler = (): TokenSwapHandler => {
  const { swapMint, swapWithdraw, isPending, error, hash } = useTsp500Swap();
  const { price } = useTokenPrice('TSP500');

  return useMemo(
    () => ({
      swapIn: async ({ stablecoin, amount, blockchain, walletAddress }) => {
        const inputToken = getTokenAddress(stablecoin, blockchain);
        const outputToken = BASE_CONTRACTS.DESPXA as Address;
        const router = BASE_TRUSTED_AGGREGATORS.kyberSwap as Address;

        if (!inputToken) throw new Error('Input token address not found');
        if (!price) throw new Error('Token price unavailable');

        const stableDecimals = getTokenDecimals(stablecoin);

        if (stableDecimals === undefined) throw new Error('Stablecoin decimals unknown');

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount)) throw new Error('Invalid amount');

        // Calculate stablecoin amount needed: TSP500 amount * TSP500 price
        const stableAmount = parsedAmount * price;
        const parsedStableAmount = parseUnits(stableAmount.toString(), stableDecimals);
        console.log('TSP500 swap - stableAmount:', parsedStableAmount);

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
        const router = BASE_TRUSTED_AGGREGATORS.kyberSwap as Address;

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
