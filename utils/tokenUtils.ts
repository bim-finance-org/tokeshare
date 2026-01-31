import { Address } from 'viem';
import { useERC20 } from '@/hooks/useERC20';

// Decimals connues pour les tokens les plus utilisés
const KNOWN_DECIMALS: Record<string, number> = {
  // Polygon
  '0x3d4df7bd7ea3f305ac3a4065019b96d382834b71': 18, // TGG
  '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': 6, // USDT
  '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359': 6, // USDC
  '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063': 18, // DAI
  '0xe111178a87a3bff0c8d18decba5798827539ae99': 2, // EURS
  '0x2791bca1f2de4661ed88a30c99a7a9449aa84174': 6, // USDCE
  '0x553d3d295e0f695b9228246232edf400ed3560b5': 18, // PAXG
  // Base
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': 6, // USDC
  '0x50c5725949a6f0c72e6c4a641f24049a917db0cb': 18, // DAI
  '0x60a3e35cc302bfa44cb288bc5a4f316fdb1adb42': 6, // EURC
  '0x417ac0e078398c154edfadd9ef675d30be60af93': 18, // CRVUSD
  '0x03569cc076654f82679c4ba2124d64774781b01d': 18, // BOLD
  '0x820c137fa70c8691f0e44dc420a5e53c168921dc': 18, // USDS
  '0xa0a8481fc246cd12f75227abb96220ff5360fad3': 18, // CMC20
  '0xf47C9E511d215E286d3Ca1B956e7C3DD6F6195D4': 18, // TMC
};

/**
 * Hook pour récupérer les decimals d'un token
 * Si l'adresse est connue → retourne directement
 * Si l'adresse n'est pas connue → va chercher avec le contrat
 */
export const useTokenDecimals = (tokenAddress: Address) => {
  const normalizedAddress = tokenAddress.toLowerCase();

  // Vérifier si on connaît déjà les decimals
  if (normalizedAddress in KNOWN_DECIMALS) {
    return {
      data: KNOWN_DECIMALS[normalizedAddress],
      isLoading: false,
      error: null,
    };
  }

  // Si on ne connaît pas, aller chercher via le contrat
  const { useDecimals } = useERC20(tokenAddress);
  const contractResult = useDecimals();

  return {
    data: contractResult.data ? Number(contractResult.data) : undefined,
    isLoading: contractResult.isLoading,
    error: contractResult.error,
  };
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
