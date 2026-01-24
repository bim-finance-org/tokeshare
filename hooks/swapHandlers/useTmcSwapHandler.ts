import { useTmcSwap, TMC_CMC20_RATIO } from '@/hooks/useTmcSwap';
import { TokenSwapHandler } from '@/interfaces/TokenSwapHandler';
import { Address, parseUnits } from 'viem';
import { BASE_CONTRACTS, BASE_TRUSTED_AGGREGATORS } from '@/contracts/contracts';
import { getTokenAddress, getTokenDecimals } from '@/utils/token';
import { useMemo } from 'react';
import { useTokenPrice } from '../useTokenPrice';

export const useTmcSwapHandler = (): TokenSwapHandler => {
  const { swapMint, swapWithdraw, isPending, error, hash } = useTmcSwap();
  const { price } = useTokenPrice('TMC');

  return useMemo(
    () => ({
      swapIn: async ({ stablecoin, amount, blockchain, walletAddress }) => {
        const inputToken = getTokenAddress(stablecoin, blockchain);
        const outputToken = BASE_CONTRACTS.CMC20 as Address;
        const router = BASE_TRUSTED_AGGREGATORS.kyberSwap as Address;

        if (!inputToken) throw new Error('Input token address not found');
        if (!price) throw new Error('Token price unavailable');

        const stableDecimals = getTokenDecimals(stablecoin);

        if (stableDecimals === undefined) throw new Error('Stablecoin decimals unknown');

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount)) throw new Error('Invalid amount');

        // Calculate stablecoin amount needed: TMC amount * TMC price
        const stableAmount = parsedAmount * price;
        const parsedStableAmount = parseUnits(stableAmount.toString(), stableDecimals);
        console.log('TMC swap - stableAmount:', parsedStableAmount);

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
