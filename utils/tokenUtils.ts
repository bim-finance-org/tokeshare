import { Address } from 'viem';
import { useERC20 } from '@/hooks/useERC20';

// Decimals connues pour les tokens les plus utilisés
const KNOWN_DECIMALS: Record<string, number> = {
    '0x493af8d9ac56f46652f5b0c1fb617fe59da535c7': 18,
    '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': 6,
    '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359': 6,
    '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063': 18,
    '0xe111178a87a3bff0c8d18decba5798827539ae99': 2,
    '0x2791bca1f2de4661ed88a30c99a7a9449aa84174': 6,
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
