import { TOKENS } from '@/config/token';
import { TokenType } from '@/enums/TokenType';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export interface StablecoinPrices {
  [key: string]: number | undefined;
}

const STABLECOIN_TOKENS = Object.values(TOKENS).filter(
  (token) => token.type === TokenType.Stablecoin && token.cmcId !== undefined,
);

const ACTIVE_STABLECOINS = STABLECOIN_TOKENS.map((token) => token.symbol);

// Clé de requête constante pour le cache React Query
const STABLE_PRICES_QUERY_KEY = ['stablePrices'];

// Durée d'expiration des données en millisecondes (20 minutes)
const CACHE_EXPIRATION = 20 * 60 * 1000;

const symbolsToIds = (symbols: string[]): string => {
  return symbols
    .map((symbol) => TOKENS[symbol]?.cmcId)
    .filter((id): id is number => id !== undefined)
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
        STABLECOIN_TOKENS.forEach((token) => {
          const id = token.cmcId;
          if (id && data.data.data[id]) {
            prices[token.symbol] = data.data.data[id].quote.USD.price;
          } else {
            prices[token.symbol] = undefined;
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

  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: STABLE_PRICES_QUERY_KEY,
      queryFn: async () => {
        const idsParam = STABLECOIN_TOKENS.map((token) => token.cmcId).join(',');

        const response = await fetch(`/api/cmc?ids=${idsParam}`);
        if (!response.ok) throw new Error('Failed to fetch stablecoin prices');

        const data = await response.json();
        const prices: Record<string, number | undefined> = {};

        STABLECOIN_TOKENS.forEach((token) => {
          const id = token.cmcId;
          prices[token.symbol] = (id && data.data?.data[id]?.quote?.USD?.price) ?? undefined;
        });

        return prices;
      },
      staleTime: CACHE_EXPIRATION,
    });
  }, [queryClient]);

  return null;
};
