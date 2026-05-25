import type { Address } from 'viem';
import { useReadContract } from 'wagmi';
import { BASE_CONTRACTS } from '@/contracts/contracts';
import { ZAP_TSP500_ABI } from '@/contracts/abis/zap_tsp500_abi';
import { Blockchain } from '@/enums/Blockchain';
import { useZAPTSP500Contract } from './useContracts';
import { useZapSwap, type ResolvedZapContracts } from './useZapSwap';

// TSP500 to deSPXA ratio: 1 TSP500 = 1/10 deSPXA
export const TSP500_DESPXA_RATIO = 10;

export const useZapTsp500Fees = () => {
  const {
    data: zapMintFeeRaw,
    isLoading: isLoadingMintFee,
    error: mintFeeError,
  } = useReadContract({
    address: BASE_CONTRACTS.ZAP_TSP500 as Address,
    abi: ZAP_TSP500_ABI,
    functionName: 'zapMintFee',
  });

  const {
    data: zapWithdrawFeeRaw,
    isLoading: isLoadingWithdrawFee,
    error: withdrawFeeError,
  } = useReadContract({
    address: BASE_CONTRACTS.ZAP_TSP500 as Address,
    abi: ZAP_TSP500_ABI,
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
