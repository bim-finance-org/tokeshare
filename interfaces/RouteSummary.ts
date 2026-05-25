import { Address } from 'viem';

export interface RouteSummary {
  tokenIn: Address;
  amountIn: string;
  amountInUsd: string;
  tokenOut: Address;
  amountOut: string;
  amountOutUsd: string;
  gas: string;
  gasPrice: string;
  gasUsd: string;
  extraFee?: {
    feeAmount: string;
    chargeFeeBy: string;
    isInBps: boolean;
    feeReceiver: string;
  };
  route: unknown[][];
  routeID: string;
  checksum: string;
  timestamp: string;
}
