import type { Address } from 'viem';
import { getTGGContracts } from '@/contracts/contracts';
import { ZAP_ABI } from '@/contracts/abis/zap_abi';
import { Blockchain } from '@/enums/Blockchain';
import { useZAPContract } from './useContracts';
import { useZapSwap, type ResolvedZapContracts } from './useZapSwap';

// 1 g gold = 31.1034768 g per troy oz, scaled to 1e9 for fixed-point math.
const GRAMS_PER_TROY_OUNCE_SCALED = 31_103_476_800;

function resolveTggContracts(blockchain: Blockchain): ResolvedZapContracts {
  const c = getTGGContracts(blockchain);
  return {
    zap: c.ZAP as Address,
    baseToken: c.TGG as Address,
    paymentToken: c.PAXG as Address,
  };
}

function computeTggWithdrawAmount(amount: string, withdrawFee: number): number {
  const conversion = (parseFloat(amount) * 10 ** 9) / GRAMS_PER_TROY_OUNCE_SCALED;
  return conversion - conversion * withdrawFee;
}

export const useSwap = () =>
  useZapSwap({
    zap: useZAPContract(),
    abi: ZAP_ABI,
    resolveContracts: resolveTggContracts,
    defaultBlockchain: Blockchain.Polygon,
    computeWithdrawAmount: computeTggWithdrawAmount,
  });
