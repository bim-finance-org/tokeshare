import type { Address } from 'viem';
import { BASE_CONTRACTS } from '@/contracts/contracts';
import { ZAP_TMC_ABI } from '@/contracts/abis/zap_tmc_abi';
import { Blockchain } from '@/enums/Blockchain';
import { useZAPTMCContract } from './useContracts';
import { useZapSwap, type ResolvedZapContracts } from './useZapSwap';

// TMC to CMC20 ratio: 1 TMC = 1/10 CMC20
export const TMC_CMC20_RATIO = 10;

const TMC_CONTRACTS: ResolvedZapContracts = {
  zap: BASE_CONTRACTS.ZAP_TMC as Address,
  baseToken: BASE_CONTRACTS.TMC as Address,
  paymentToken: BASE_CONTRACTS.CMC20 as Address,
  kyberChain: 'base',
};

function resolveTmcContracts(): ResolvedZapContracts {
  return TMC_CONTRACTS;
}

function computeTmcWithdrawAmount(amount: string, withdrawFee: number): number {
  const conversion = parseFloat(amount) / TMC_CMC20_RATIO;
  return conversion - conversion * withdrawFee;
}

export const useTmcSwap = () =>
  useZapSwap({
    zap: useZAPTMCContract(),
    abi: ZAP_TMC_ABI,
    resolveContracts: resolveTmcContracts,
    defaultBlockchain: Blockchain.Base,
    computeWithdrawAmount: computeTmcWithdrawAmount,
  });
