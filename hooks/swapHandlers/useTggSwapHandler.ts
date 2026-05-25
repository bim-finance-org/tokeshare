import type { Address } from 'viem';
import type { Blockchain } from '@/enums/Blockchain';
import { useSwap } from '@/hooks/useSwap';
import { useTGGPrice } from '@/hooks/useTokenPrice';
import { getTGGContracts } from '@/contracts/contracts';
import { useZapSwapHandler } from './useZapSwapHandler';

const resolveTggOutputToken = (blockchain: Blockchain): Address =>
  getTGGContracts(blockchain).PAXG as Address;

export const useTggSwapHandler = () => {
  const { price } = useTGGPrice();
  return useZapSwapHandler({
    price,
    resolveOutputToken: resolveTggOutputToken,
    swap: useSwap(),
  });
};
