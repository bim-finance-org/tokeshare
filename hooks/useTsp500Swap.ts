import type { Address } from 'viem';
import { BASE_CONTRACTS } from '@/contracts/contracts';
import { ZAP_TSP500_ABI } from '@/contracts/abis/zap_tsp500_abi';
import { Blockchain } from '@/enums/Blockchain';
import { useZAPTSP500Contract } from './useContracts';
import { useZapSwap, type ResolvedZapContracts } from './useZapSwap';

// TSP500 to deSPXA ratio: 1 TSP500 = 1/10 deSPXA
export const TSP500_DESPXA_RATIO = 10;

const TSP500_CONTRACTS: ResolvedZapContracts = {
  zap: BASE_CONTRACTS.ZAP_TSP500 as Address,
  baseToken: BASE_CONTRACTS.TSP500 as Address,
  paymentToken: BASE_CONTRACTS.DESPXA as Address,
  kyberChain: 'base',
};

function resolveTsp500Contracts(): ResolvedZapContracts {
  return TSP500_CONTRACTS;
}

function computeTsp500WithdrawAmount(amount: string, withdrawFee: number): number {
  const conversion = parseFloat(amount) / TSP500_DESPXA_RATIO;
  return conversion - conversion * withdrawFee;
}

export const useTsp500Swap = () =>
  useZapSwap({
    zap: useZAPTSP500Contract(),
    abi: ZAP_TSP500_ABI,
    resolveContracts: resolveTsp500Contracts,
    defaultBlockchain: Blockchain.Base,
    computeWithdrawAmount: computeTsp500WithdrawAmount,
  });
