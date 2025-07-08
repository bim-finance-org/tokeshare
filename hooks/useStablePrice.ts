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
 * Hook qui permet de récupérer les prix de stablecoins spécifiques.
 * Utilise les données mises en cache par useAllStablePrices.
 */
export const useStablePrices = (symbols: string[] = ACTIVE_STABLECOINS) => {
  const queryClient = useQueryClient();

  // Force le chargement des données si elles ne sont pas déjà dans le cache
  useAllStablePrices();

  return useQuery({
    queryKey: [...STABLE_PRICES_QUERY_KEY, ...symbols],
    queryFn: () => {
      // Récupérer les données du cache
      const cachedData = queryClient.getQueryData<StablecoinPrices>(STABLE_PRICES_QUERY_KEY);

      if (!cachedData) {
        // Si les données ne sont pas en cache, retourne undefined
        return undefined;
      }

      // Filtrer pour n'inclure que les symboles demandés
      const filteredData: StablecoinPrices = {};
      symbols.forEach((symbol) => {
        // Transférer la valeur exacte sans valeur par défaut
        filteredData[symbol] = cachedData[symbol];
      });

      return filteredData;
    },
    // Cette requête dépend de la requête principale
    enabled: Boolean(queryClient.getQueryData(STABLE_PRICES_QUERY_KEY)),
    // Utilise le même staleTime que la requête principale
    staleTime: CACHE_EXPIRATION,
  });
};

// Hook spécifique pour un stablecoin
export const useStablecoinPrice = ({ stablecoin }: { stablecoin: string }) => {
  // Si nous recevons USDC.e mais que nous n'avons que USDCE dans notre dictionnaire
  const normalizedStablecoin = stablecoin === 'USDC.e' ? 'USDCE' : stablecoin;

  // Vérifier que le stablecoin est supporté
  if (!STABLECOINS[normalizedStablecoin]) {
    console.warn(`Stablecoin not supported: ${stablecoin} (normalized: ${normalizedStablecoin})`);
    // Indiquer que le stablecoin n'est pas supporté plutôt que de donner une valeur par défaut
    return { data: undefined, isLoading: false, error: new Error(`Stablecoin not supported: ${stablecoin}`) };
  }

  const { data, isLoading, error } = useStablePrices([normalizedStablecoin]);

  // Retourner la valeur exacte, même si undefined
  return { data: data?.[normalizedStablecoin], isLoading, error };
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
