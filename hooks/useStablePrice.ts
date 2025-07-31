import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export interface StablecoinPrices {
  [key: string]: number | undefined;
}

// Définition des stablecoins avec leur ID et symbole
interface StablecoinInfo {
  id: number;
  symbol: string;
}

// Map des stablecoins supportés avec leur ID CoinMarketCap
export const STABLECOINS: Record<string, StablecoinInfo> = {
  USDT: { id: 825, symbol: 'USDT' }, // Tether
  USDC: { id: 3408, symbol: 'USDC' }, // USD Coin
  DAI: { id: 4943, symbol: 'DAI' }, // Dai
  EURS: { id: 2989, symbol: 'EURS' }, // STASIS EURO
  CRVUSD: { id: 24927, symbol: 'CRVUSD' }, // Curve USD
  EURA: { id: 15024, symbol: 'EURA' }, // EURA
  USDCE: { id: 18852, symbol: 'USDCE' }, // USD Coin Ethereum (Bridged)
};

// Liste des symboles de stablecoins actifs
const ACTIVE_STABLECOINS = Object.keys(STABLECOINS);

// Clé de requête constante pour le cache React Query
const STABLE_PRICES_QUERY_KEY = ['stablePrices'];

// Durée d'expiration des données en millisecondes (20 minutes)
const CACHE_EXPIRATION = 20 * 60 * 1000;

/**
 * Convertit un tableau de symboles de stablecoins en chaîne d'IDs pour l'API
 */
const symbolsToIds = (symbols: string[]): string => {
  return symbols
    .map((symbol) => STABLECOINS[symbol]?.id)
    .filter((id) => id !== undefined)
    .join(',');
};

/**
 * Hook principal qui récupère tous les stablecoins.
 * Ce hook vérifie automatiquement si les données Redis doivent être rafraîchies.
 */
export const useAllStablePrices = (refetchInterval = CACHE_EXPIRATION) => {
  return useQuery({
    queryKey: STABLE_PRICES_QUERY_KEY,
    queryFn: async () => {
      // Convertir les symboles en IDs pour l'API
      const idsParam = symbolsToIds(ACTIVE_STABLECOINS);

      // Appel à l'API en utilisant les IDs
      const response = await fetch(`/api/cmc?ids=${idsParam}`);

      if (!response.ok) {
        throw new Error('Failed to fetch stablecoin prices');
      }

      // Extraire les données de la réponse
      const data = await response.json();

      // Initialiser l'objet de prix vide
      const prices: StablecoinPrices = {};

      // Si les données sont disponibles, mettre à jour les prix
      if (data.data && data.data.data) {
        // Parcourir les stablecoins actifs pour obtenir leur prix
        ACTIVE_STABLECOINS.forEach((symbol) => {
          const id = STABLECOINS[symbol]?.id;
          if (id && data.data.data[id]) {
            prices[symbol] = data.data.data[id].quote.USD.price;
          } else {
            // Ne pas définir de prix pour ce stablecoin si pas de données disponibles
            prices[symbol] = undefined;
          }
        });
      }

      return prices;
    },
    staleTime: refetchInterval,
    refetchInterval: refetchInterval,
    retry: 3,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook à appeler au chargement de l'application pour précharger tous les prix
 */
export const usePrefetchStablePrices = () => {
  const queryClient = useQueryClient();

  // Préchargement des données au montage du composant
  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: STABLE_PRICES_QUERY_KEY,
      queryFn: async () => {
        // Convertir les symboles en IDs pour l'API
        const idsParam = symbolsToIds(ACTIVE_STABLECOINS);

        // Appel à l'API en utilisant les IDs
        const response = await fetch(`/api/cmc?ids=${idsParam}`);

        if (!response.ok) {
          throw new Error('Failed to fetch stablecoin prices');
        }

        // Extraire les données de la réponse
        const data = await response.json();

        // Initialiser l'objet de prix vide
        const prices: StablecoinPrices = {};

        // Si les données sont disponibles, mettre à jour les prix
        if (data.data && data.data.data) {
          // Parcourir les stablecoins actifs
          ACTIVE_STABLECOINS.forEach((symbol) => {
            const id = STABLECOINS[symbol]?.id;
            if (id && data.data.data[id]) {
              prices[symbol] = data.data.data[id].quote.USD.price;
            } else {
              // Ne pas définir de prix pour ce stablecoin si pas de données disponibles
              prices[symbol] = undefined;
            }
          });
        }

        return prices;
      },
      staleTime: CACHE_EXPIRATION,
    });
  }, [queryClient]);

  return null;
};
