import { useMemo } from 'react';
import { TokenSwapHandler } from '@/interfaces/TokenSwapHandler';
import { useMarketplaceSwapHandler } from './useMarketplaceSwapHandler';
import { useTggSwapHandler } from './useTggSwapHandler';
import { useTsgSwapHandler } from './useTsgSwapHandler';
import { useTmcSwapHandler } from './useTmcSwapHandler';
import { useTsp500SwapHandler } from './useTsp500SwapHandler';

export const useSwapHandlerByToken = (tokenSymbol: string): TokenSwapHandler => {
  // Call ALL hooks unconditionally to respect React hooks rules
  const tggHandler = useTggSwapHandler();
  const tsgHandler = useTsgSwapHandler();
  const tftHandler = useMarketplaceSwapHandler('TFT_001');
  const tltHandler = useMarketplaceSwapHandler('TLT_001');
  const tmcHandler = useTmcSwapHandler();
  const tsp500Handler = useTsp500SwapHandler();

  // Return the appropriate handler based on token symbol
  return useMemo(() => {
    switch (tokenSymbol) {
      case 'TGG':
        return tggHandler;
      case 'TSG':
        return tsgHandler;
      case 'TFT_001':
        return tftHandler;
      case 'TLT_001':
        return tltHandler;
      case 'TMC':
        return tmcHandler;
      case 'TSP500':
        return tsp500Handler;
      default:
        throw new Error(`No swap handler found for token: ${tokenSymbol}`);
    }
  }, [tokenSymbol, tggHandler, tsgHandler, tftHandler, tltHandler, tmcHandler, tsp500Handler]);
};
