import { useMemo } from 'react';
import { TokenSwapHandler } from '@/interfaces/TokenSwapHandler';
import { useTftSwapHandler } from './useTftSwapHandler';
import { useTggSwapHandler } from './useTggSwapHandler';
import { useTmcSwapHandler } from './useTmcSwapHandler';

export const useSwapHandlerByToken = (tokenSymbol: string): TokenSwapHandler => {
  // Call ALL hooks unconditionally to respect React hooks rules
  const tggHandler = useTggSwapHandler();
  const tftHandler = useTftSwapHandler();
  const tmcHandler = useTmcSwapHandler();

  // Return the appropriate handler based on token symbol
  return useMemo(() => {
    switch (tokenSymbol) {
      case 'TGG':
        return tggHandler;
      case 'TFT_001':
        return tftHandler;
      case 'TMC':
        return tmcHandler;
      default:
        throw new Error(`No swap handler found for token: ${tokenSymbol}`);
    }
  }, [tokenSymbol, tggHandler, tftHandler, tmcHandler]);
};
