import { SwapParams } from './SwapParams';

export interface TokenSwapHandler {
  swapIn: (params: SwapParams) => Promise<void>;
  swapOut: (params: SwapParams) => Promise<void>;
  isPending: boolean;
  error: Error | null;
  hash: string | undefined;
}
