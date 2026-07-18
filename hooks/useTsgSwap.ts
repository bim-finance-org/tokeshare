import type { Address } from 'viem';
import { getTSGContracts } from '@/contracts/contracts';
import { ZAP_ABI } from '@/contracts/abis/zap_abi';
import { Blockchain } from '@/enums/Blockchain';
import { useZAPSilverContract } from './useContracts';
import { useZapSwap, type ResolvedZapContracts } from './useZapSwap';

// 1 g silver = 31.1034768 g per troy oz, scaled to 1e9 for fixed-point math.
const GRAMS_PER_TROY_OUNCE_SCALED = 31_103_476_800;

// XAGM has 9 decimals (unlike PAXG's 18), so the payment amount in the withdraw
// path is scaled accordingly via paymentDecimals.
const XAGM_DECIMALS = 9;

function resolveTsgContracts(blockchain: Blockchain): ResolvedZapContracts {
  const c = getTSGContracts(blockchain);
  return {
    zap: c.ZAP as Address,
    baseToken: c.TSG as Address,
    paymentToken: c.XAGM as Address,
    paymentDecimals: XAGM_DECIMALS,
    kyberChain: 'ethereum',
  };
}

function computeTsgWithdrawAmount(amount: string, withdrawFee: number): number {
  const conversion = (parseFloat(amount) * 10 ** 9) / GRAMS_PER_TROY_OUNCE_SCALED;
  return conversion - conversion * withdrawFee;
}

export const useTsgSwap = () =>
  useZapSwap({
    zap: useZAPSilverContract(),
    abi: ZAP_ABI,
    resolveContracts: resolveTsgContracts,
    defaultBlockchain: Blockchain.Ethereum,
    computeWithdrawAmount: computeTsgWithdrawAmount,
  });
