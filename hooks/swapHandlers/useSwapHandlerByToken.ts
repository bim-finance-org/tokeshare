import { TokenSwapHandler } from '@/interfaces/TokenSwapHandler';
import { useTftSwapHandler } from './useTftSwapHandler';
import { useTggSwapHandler } from './useTggSwapHandler';

export const useSwapHandlerByToken = (tokenSymbol: string): TokenSwapHandler => {
  switch (tokenSymbol) {
    case 'TGG':
      return useTggSwapHandler();
    case 'TFT_001':
      return useTftSwapHandler();
    default:
      throw new Error(`No swap handler found for token: ${tokenSymbol}`);
  }
};
