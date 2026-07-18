import type { Address } from 'viem';
import type { Blockchain } from '@/enums/Blockchain';
import { useTsgSwap } from '@/hooks/useTsgSwap';
import { useTSGPrice } from '@/hooks/useTokenPrice';
import { getTSGContracts } from '@/contracts/contracts';
import { useZapSwapHandler } from './useZapSwapHandler';

const resolveTsgOutputToken = (blockchain: Blockchain): Address =>
  getTSGContracts(blockchain).XAGM as Address;

export const useTsgSwapHandler = () => {
  const { price } = useTSGPrice();
  return useZapSwapHandler({
    price,
    resolveOutputToken: resolveTsgOutputToken,
    swap: useTsgSwap(),
  });
};
