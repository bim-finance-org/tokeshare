import { TokenSwapHandler } from '@/interfaces/TokenSwapHandler';
import { useTftSwapHandler } from './useTftSwapHandler';
import { useTggSwapHandler } from './useTggSwapHandler';
import { useTmcSwapHandler } from './useTmcSwapHandler';

export const useSwapHandlerByToken = (tokenSymbol: string): TokenSwapHandler => {
  switch (tokenSymbol) {
    case 'TGG':
      return useTggSwapHandler();
    case 'TFT_001':
      return useTftSwapHandler();
    case 'TMC':
      return useTmcSwapHandler();
    default:
      throw new Error(`No swap handler found for token: ${tokenSymbol}`);
  }
};
