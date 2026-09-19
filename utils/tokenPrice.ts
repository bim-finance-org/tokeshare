import { calculateTGGPrice, calculateTSGPrice } from './priceUtils';
import { TFT_001_PRICE_USD, TLT_001_PRICE_USD } from '@/constants/constants';

export function getTokenPrice(
  symbol: string,
  options: {
    paxgPrice?: number; // pour TGG
    xagmPrice?: number; // pour TSG
    // Tu peux ajouter d'autres sources si besoin
  },
): number {
  switch (symbol) {
    case 'TGG':
      if (options.paxgPrice === undefined) return 0;
      return calculateTGGPrice(options.paxgPrice);
    case 'TSG':
      if (options.xagmPrice === undefined) return 0;
      return calculateTSGPrice(options.xagmPrice);
    case 'TFT_001':
      return TFT_001_PRICE_USD;
    case 'TLT_001':
      return TLT_001_PRICE_USD;
    default:
      return 0;
  }
}
