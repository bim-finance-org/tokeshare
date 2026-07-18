import { calculateTGGPrice, calculateTSGPrice } from './priceUtils';

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
      return 31.25;
    default:
      return 0;
  }
}
