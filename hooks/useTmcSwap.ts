import type { Address } from 'viem';
import { useReadContract } from 'wagmi';
import { BASE_CONTRACTS } from '@/contracts/contracts';
import { ZAP_TMC_ABI } from '@/contracts/abis/zap_tmc_abi';
import { Blockchain } from '@/enums/Blockchain';
import { useZAPTMCContract } from './useContracts';
import { useZapSwap, type ResolvedZapContracts } from './useZapSwap';

// TMC to CMC20 ratio: 1 TMC = 1/10 CMC20
export const TMC_CMC20_RATIO = 10;

export const useZapTmcFees = () => {
  const {
    data: zapMintFeeRaw,
    isLoading: isLoadingMintFee,
    error: mintFeeError,
  } = useReadContract({
    address: BASE_CONTRACTS.ZAP_TMC as Address,
    abi: ZAP_TMC_ABI,
    functionName: 'zapMintFee',
  });

  const {
    data: zapWithdrawFeeRaw,
    isLoading: isLoadingWithdrawFee,
    error: withdrawFeeError,
  } = useReadContract({
    address: BASE_CONTRACTS.ZAP_TMC as Address,
    abi: ZAP_TMC_ABI,
    functionName: 'zapWithdrawFee',
  });

  return {
    zapMintFee: zapMintFeeRaw ? Number(zapMintFeeRaw) / 100 : 0,
    zapWithdrawFee: zapWithdrawFeeRaw ? Number(zapWithdrawFeeRaw) / 100 : 0,
    isLoading: isLoadingMintFee || isLoadingWithdrawFee,
    error: mintFeeError || withdrawFeeError,
    raw: { zapMintFeeRaw, zapWithdrawFeeRaw },
  };
};

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
