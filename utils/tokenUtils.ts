import { Address } from 'viem';

// Decimals connues pour les tokens les plus utilisés
const KNOWN_DECIMALS: Record<string, number> = {
  // Polygon
  '0x3d4df7bd7ea3f305ac3a4065019b96d382834b71': 18, // TGG
  '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': 6, // USDT
  '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359': 6, // USDC
  '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063': 18, // DAI
  '0xe111178a87a3bff0c8d18decba5798827539ae99': 2, // EURS
  '0x2791bca1f2de4661ed88a30c99a7a9449aa84174': 6, // USDCE
  '0x553d3d295e0f695b9228246232edf400ed3560b5': 18, // PAXG (Polygon)
  // Ethereum
  '0x45804880de22913dafe09f4980848ece6ecbaf78': 18, // PAXG (Ethereum)
  '0x0764ff270aaceda56d0940327c50f8a199573a9b': 18, // TGG (Ethereum)
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 6, // USDC (Ethereum)
  '0xdac17f958d2ee523a2206206994597c13d831ec7': 6, // USDT (Ethereum)
  '0x6b175474e89094c44da98b954eedeac495271d0f': 18, // DAI (Ethereum)
  // Base
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': 6, // USDC
  '0x50c5725949a6f0c72e6c4a641f24049a917db0cb': 18, // DAI
  '0x60a3e35cc302bfa44cb288bc5a4f316fdb1adb42': 6, // EURC
  '0x417ac0e078398c154edfadd9ef675d30be60af93': 18, // CRVUSD
  '0x03569cc076654f82679c4ba2124d64774781b01d': 18, // BOLD
  '0x820c137fa70c8691f0e44dc420a5e53c168921dc': 18, // USDS
  '0xa0a8481fc246cd12f75227abb96220ff5360fad3': 18, // CMC20
  '0xf47c9e511d215e286d3ca1b956e7c3dd6f6195d4': 18, // TMC
  '0x9c5c365e764829876243d0b289733b9d2b729685': 18, // deSPXA
  '0x9476d702dc72242a7cefbf802da8f09ddb305e51': 18, // TSP500
};

/**
 * Fonction synchrone pour obtenir les decimals
 * Retourne 18 par défaut (standard ERC20) si non trouvé
 * À utiliser uniquement quand le hook n'est pas possible
 */
export const getTokenDecimals = (tokenAddress: Address): number => {
  const normalizedAddress = tokenAddress.toLowerCase();
  return KNOWN_DECIMALS[normalizedAddress] ?? undefined;
};
