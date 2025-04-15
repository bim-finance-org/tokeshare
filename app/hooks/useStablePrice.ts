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

/**
 * Hook principal qui récupère tous les stablecoins en une seule requête.
 * Ce hook est conçu pour être appelé au lancement de l'application.
 */
export const useAllStablePrices = (refetchInterval = 5 * 60 * 1000) => {
  return useQuery({
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
      
      // Traiter les données de l'API
      ACTIVE_STABLECOINS.forEach(symbol => {
        if (data.data && data.data[symbol]) {
          prices[symbol] = data.data[symbol].quote.USD.price;
        } else {
          // Valeur par défaut pour les stablecoins (proche de 1 USD)
          prices[symbol] = 1.0;
        }
      });
      
      return prices;
    },
    staleTime: refetchInterval, // Données considérées comme fraîches pendant X minutes
    refetchInterval: refetchInterval, // Rafraîchissement automatique toutes les X minutes
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
    staleTime: 5 * 60 * 1000,
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
        
        ACTIVE_STABLECOINS.forEach(symbol => {
          if (data.data && data.data[symbol]) {
            prices[symbol] = data.data[symbol].quote.USD.price;
          } else {
            prices[symbol] = 1.0;
          }
        });
        
        return prices;
      },
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient]);
  
  return null;
};
