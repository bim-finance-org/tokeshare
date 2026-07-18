import type { Address } from 'viem';
import { getTGGContracts } from '@/contracts/contracts';
import { ZAP_ABI } from '@/contracts/abis/zap_abi';
import { Blockchain } from '@/enums/Blockchain';
import { useZAPContract } from './useContracts';
import { useZapSwap, type ResolvedZapContracts } from './useZapSwap';
import { computeGoldLikeWithdrawAmount } from './goldLikeWithdrawAmount';

function resolveTggContracts(blockchain: Blockchain): ResolvedZapContracts {
  const c = getTGGContracts(blockchain);
  return {
    zap: c.ZAP as Address,
    baseToken: c.TGG as Address,
    paymentToken: c.PAXG as Address,
  };
}

export const useSwap = () =>
  useZapSwap({
    zap: useZAPContract(),
    abi: ZAP_ABI,
    resolveContracts: resolveTggContracts,
    defaultBlockchain: Blockchain.Polygon,
    computeWithdrawAmount: computeGoldLikeWithdrawAmount,
  });
