import { useMemo } from 'react';
import type { Address } from 'viem';
import type { Blockchain } from '@/enums/Blockchain';
import type { TokenSwapHandler } from '@/interfaces/TokenSwapHandler';
import { getTokenAddress, getTokenDecimals } from '@/utils/token';
import { TRUSTED_AGGREGATORS } from '@/contracts/contracts';

type ZapMintParams = {
  inputToken: Address;
  inputAmount: string;
  outputToken: Address;
  routerAddress: Address;
  walletAddress: Address;
  blockchain?: Blockchain;
};

type ZapWithdrawParams = {
  amount: string;
  outputToken: Address;
  routerAddress: Address;
  walletAddress: Address;
  blockchain?: Blockchain;
};

type ZapSwapHookResult = {
  swapMint: (params: ZapMintParams) => Promise<unknown>;
  swapWithdraw: (params: ZapWithdrawParams) => Promise<unknown>;
  isPending: boolean;
  error: Error | null;
  hash: `0x${string}` | undefined;
};

interface ZapSwapHandlerConfig {
  /** Unit price of the base token (TGG/TMC/TSP500) in stablecoin units. */
  price: number | null;
  /** Aggregator the Zap contract is allowed to call. Defaults to KyberSwap. */
  router?: Address;
  /** Output token of the swap (PAXG for TGG, CMC20 for TMC…). May depend on the chain. */
  resolveOutputToken: (blockchain: Blockchain) => Address;
  /** swapMint/swapWithdraw from a useZap*Swap() hook. */
  swap: ZapSwapHookResult;
}

const DEFAULT_ROUTER = TRUSTED_AGGREGATORS.kyberSwap as Address;

export function useZapSwapHandler({
  price,
  router = DEFAULT_ROUTER,
  resolveOutputToken,
  swap,
}: ZapSwapHandlerConfig): TokenSwapHandler {
  const { swapMint, swapWithdraw, isPending, error, hash } = swap;

  return useMemo<TokenSwapHandler>(
    () => ({
      swapIn: async ({ stablecoin, amount, blockchain, walletAddress }) => {
        const inputToken = getTokenAddress(stablecoin, blockchain);
        if (!inputToken) throw new Error('Input token address not found');
        if (!price) throw new Error('Token price unavailable');

        const stableDecimals = getTokenDecimals(stablecoin);
        if (stableDecimals === undefined) throw new Error('Stablecoin decimals unknown');

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount)) throw new Error('Invalid amount');

        const stableAmount = parsedAmount * price;

        await swapMint({
          inputToken,
          inputAmount: stableAmount.toString(),
          outputToken: resolveOutputToken(blockchain),
          routerAddress: router,
          walletAddress,
          blockchain,
        });
      },

      swapOut: async ({ stablecoin, amount, blockchain, walletAddress }) => {
        const outputToken = getTokenAddress(stablecoin, blockchain);
        if (!outputToken) throw new Error('Output token address not found');

        await swapWithdraw({
          amount,
          outputToken,
          routerAddress: router,
          walletAddress,
          blockchain,
        });
      },

      isPending,
      error,
      hash,
    }),
    [price, swapMint, swapWithdraw, isPending, error, hash, resolveOutputToken, router],
  );
}
