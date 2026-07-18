import { Blockchain } from '@/enums/Blockchain';
import { Address } from 'viem';

export interface SwapParams {
  tokenSymbol: string;
  amount: string;
  stablecoin: string;
  blockchain: Blockchain;
  walletAddress: Address;
  /**
   * Exact stablecoin amount to spend on a buy (StablecoinToToken). When set, the
   * ZAP handler spends this instead of re-deriving it from `amount × spotPrice`,
   * which drifts because the DEX route price differs from the spot oracle.
   */
  stablecoinAmount?: string;
}
