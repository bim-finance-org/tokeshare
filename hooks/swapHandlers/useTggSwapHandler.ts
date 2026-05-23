import type { Address } from 'viem';
import type { Blockchain } from '@/enums/Blockchain';
import { useSwap } from '@/hooks/useSwap';
import { getTGGContracts } from '@/contracts/contracts';
import { useZapSwapHandler } from './useZapSwapHandler';

const resolveTggOutputToken = (blockchain: Blockchain): Address =>
  getTGGContracts(blockchain).PAXG as Address;

export const useTggSwapHandler = () =>
  useZapSwapHandler({
    tokenSymbol: 'TGG',
    resolveOutputToken: resolveTggOutputToken,
    swap: useSwap(),
  });
