import { calculateTGGPrice } from './priceUtils';

export function getTokenPrice(
  symbol: string,
  options: {
    paxgPrice?: number; // pour TGG
    // Tu peux ajouter d'autres sources si besoin
  },
): number {
  switch (symbol) {
    case 'TGG':
      if (options.paxgPrice === undefined) return 0;
      return calculateTGGPrice(options.paxgPrice);
    case 'TFT_001':
      return 31.25;
    default:
      return 0;
  }
}
