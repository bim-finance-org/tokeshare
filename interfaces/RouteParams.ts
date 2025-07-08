import { Address } from 'viem';

export interface RouteParams {
  tokenIn: Address;
  tokenOut: Address;
  amountIn: string;
  saveGas?: boolean;
  gasInclude?: boolean;
  gasPrice?: string;
  slippageTolerance?: number;
  chargeFeeBy?: 'currency_in' | 'currency_out';
  feeAmount?: string;
  feeReceiver?: string;
  isInBps?: boolean;
}
