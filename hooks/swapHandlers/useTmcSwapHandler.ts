import type { Address } from 'viem';
import { useTmcSwap } from '@/hooks/useTmcSwap';
import { useTMCPrice } from '@/hooks/useTokenPrice';
import { BASE_CONTRACTS } from '@/contracts/contracts';
import { useZapSwapHandler } from './useZapSwapHandler';

const resolveTmcOutputToken = (): Address => BASE_CONTRACTS.CMC20 as Address;

export const useTmcSwapHandler = () => {
  const { price } = useTMCPrice();
  return useZapSwapHandler({
    price,
    resolveOutputToken: resolveTmcOutputToken,
    swap: useTmcSwap(),
  });
};
