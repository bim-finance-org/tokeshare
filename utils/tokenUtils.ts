import { Address } from 'viem';
import { useERC20 } from '@/hooks/useERC20';

// Decimals connues pour les tokens les plus utilisés
const KNOWN_DECIMALS: Record<string, number> = {
    '0xf779B8CBd6fc9022181b399931b63ec64a552fB9': 18,
    '0x1E4a5963aBFD975d8c9021ce480b42188849D41d': 6,
    '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359': 6,
    '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063': 18,
    '0xE111178A87A3BFf0c8d18DECBa5798827539Ae99': 2,
    '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174': 6,
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
  return KNOWN_DECIMALS[normalizedAddress] ?? 18;
};
