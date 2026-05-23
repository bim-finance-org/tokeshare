import type { Address } from 'viem';
import { useTmcSwap } from '@/hooks/useTmcSwap';
import { BASE_CONTRACTS } from '@/contracts/contracts';
import { useZapSwapHandler } from './useZapSwapHandler';

const resolveTmcOutputToken = (): Address => BASE_CONTRACTS.CMC20 as Address;

export const useTmcSwapHandler = () =>
  useZapSwapHandler({
    tokenSymbol: 'TMC',
    resolveOutputToken: resolveTmcOutputToken,
    swap: useTmcSwap(),
  });
