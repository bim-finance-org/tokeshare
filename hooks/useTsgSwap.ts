import type { Address } from 'viem';
import { getTSGContracts } from '@/contracts/contracts';
import { ZAP_ABI } from '@/contracts/abis/zap_abi';
import { Blockchain } from '@/enums/Blockchain';
import { useZAPSilverContract } from './useContracts';
import { useZapSwap, type ResolvedZapContracts } from './useZapSwap';
import { computeGoldLikeWithdrawAmount } from './goldLikeWithdrawAmount';

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

export const useTsgSwap = () =>
  useZapSwap({
    zap: useZAPSilverContract(),
    abi: ZAP_ABI,
    resolveContracts: resolveTsgContracts,
    defaultBlockchain: Blockchain.Ethereum,
    computeWithdrawAmount: computeGoldLikeWithdrawAmount,
  });
