import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StablecoinSymbol } from '../utils/StableCoins';
import { useEffect } from 'react';

export interface StablecoinPrices {
  [key: string]: number;
}

// Configuration des stablecoins actifs (ceux que nous voulons récupérer)
const ACTIVE_STABLECOINS: StablecoinSymbol[] = [
  'USDT', 'USDC', 'DAI'
];

// Clé de requête constante pour le cache React Query
const STABLE_PRICES_QUERY_KEY = ['stablePrices'];

// Durée d'expiration des données en millisecondes (20 minutes)
const CACHE_EXPIRATION = 20 * 60 * 1000;

/**
 * Hook principal qui récupère tous les stablecoins.
 * Ce hook vérifie automatiquement si les données Redis doivent être rafraîchies.
 */
export const useAllStablePrices = (refetchInterval = CACHE_EXPIRATION) => {
  return useQuery({
    queryKey: STABLE_PRICES_QUERY_KEY,
    queryFn: async () => {
      const symbols = ACTIVE_STABLECOINS.join(',');
      
      // Appel à l'API avec vérification de fraîcheur des données
      const response = await fetch(`/api/cmc?symbols=${symbols}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch stablecoin prices');
      }
      
      // Extraire les données de la réponse
      const data = await response.json();
      
      // Extraire les prix de la réponse
      const prices: StablecoinPrices = {};
      
      // Traiter les données de l'API
      // Si les données viennent de Redis (structure avec data.data)
      if (data.data && data.data.data) {
        ACTIVE_STABLECOINS.forEach(symbol => {
          if (data.data.data && data.data.data[symbol]) {
            prices[symbol] = data.data.data[symbol].quote.USD.price;
          } else {
            prices[symbol] = 1.0;
          }
        });
      } 
      // Si les données viennent directement de CMC
      else if (data.data) {
        ACTIVE_STABLECOINS.forEach(symbol => {
          if (data.data && data.data[symbol]) {
            prices[symbol] = data.data[symbol].quote.USD.price;
          } else {
            prices[symbol] = 1.0;
          }
        });
      }
      // Fallback
      else {
        ACTIVE_STABLECOINS.forEach(symbol => {
          prices[symbol] = 1.0;
        });
      }
      
      return prices;
    },
    staleTime: refetchInterval, // Données considérées comme fraîches pendant 20 minutes
    refetchInterval: refetchInterval, // Rafraîchissement automatique toutes les 20 minutes
    retry: 3, // 3 tentatives en cas d'échec
    retryDelay: 1000, // 1 seconde entre chaque tentative
    refetchOnWindowFocus: false, // Ne pas rafraîchir quand la fenêtre reprend le focus
  });
};

/**
 * Hook qui permet de récupérer les prix de stablecoins spécifiques.
 * Utilise les données mises en cache par useAllStablePrices.
 */
export const useStablePrices = (symbols: StablecoinSymbol[] = ACTIVE_STABLECOINS) => {
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
      symbols.forEach(symbol => {
        filteredData[symbol] = cachedData[symbol] || 1.0;
      });
      
      return filteredData;
    },
    // Cette requête dépend de la requête principale
    enabled: Boolean(queryClient.getQueryData(STABLE_PRICES_QUERY_KEY)),
    // Utilise le même staleTime que la requête principale
    staleTime: CACHE_EXPIRATION,
  });
};

// Hooks spécifiques pour chaque stablecoin
export const useStablecoinPrice = ({stablecoin}: {stablecoin: StablecoinSymbol}) => {
  const { data, isLoading, error } = useStablePrices([stablecoin]);
  return { data: data?.[stablecoin], isLoading, error };
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
        const symbols = ACTIVE_STABLECOINS.join(',');
        const response = await fetch(`/api/cmc?symbols=${symbols}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch stablecoin prices');
        }
        
        const data = await response.json();
        
        // Extraire les prix de la réponse
        const prices: StablecoinPrices = {};
        
        // Traiter les données comme dans useAllStablePrices
        if (data.data && data.data.data) {
          ACTIVE_STABLECOINS.forEach(symbol => {
            if (data.data.data && data.data.data[symbol]) {
              prices[symbol] = data.data.data[symbol].quote.USD.price;
            } else {
              prices[symbol] = 1.0;
            }
          });
        } else if (data.data) {
          ACTIVE_STABLECOINS.forEach(symbol => {
            if (data.data && data.data[symbol]) {
              prices[symbol] = data.data[symbol].quote.USD.price;
            } else {
              prices[symbol] = 1.0;
            }
          });
        } else {
          ACTIVE_STABLECOINS.forEach(symbol => {
            prices[symbol] = 1.0;
          });
        }
        
        return prices;
      },
      staleTime: CACHE_EXPIRATION,
    });
  }, [queryClient]);
  
  return null;
};
