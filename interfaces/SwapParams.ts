import { Blockchain } from '@/enums/Blockchain';
import { Address } from 'viem';

export interface SwapParams {
  tokenSymbol: string;
  amount: string;
  stablecoin: string;
  blockchain: Blockchain;
  walletAddress: Address;
}
