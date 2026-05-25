import type { Address } from 'viem';
import { useTsp500Swap } from '@/hooks/useTsp500Swap';
import { useTSP500Price } from '@/hooks/useTokenPrice';
import { BASE_CONTRACTS } from '@/contracts/contracts';
import { useZapSwapHandler } from './useZapSwapHandler';

const resolveTsp500OutputToken = (): Address => BASE_CONTRACTS.DESPXA as Address;

export const useTsp500SwapHandler = () => {
  const { price } = useTSP500Price();
  return useZapSwapHandler({
    price,
    resolveOutputToken: resolveTsp500OutputToken,
    swap: useTsp500Swap(),
  });
};
