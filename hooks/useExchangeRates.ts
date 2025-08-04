import { useQuery } from '@tanstack/react-query';

export interface ExchangeRates {
  EUR: number;
  CAD: number;
  // Ajoutez d'autres devises au besoin
}

/**
 * Hook pour récupérer les taux de change par rapport au dollar USD
 * @param refetchInterval Intervalle de rafraîchissement en ms (par défaut 30 minutes)
 * @returns Objet contenant les taux de change et l'état de la requête
 */
export const useExchangeRates = (refetchInterval = 30 * 60 * 1000) => {
  return useQuery({
    queryKey: ['exchangeRates'],
    queryFn: async (): Promise<ExchangeRates> => {
      const response = await fetch('/api/exchange-rates');

      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }

      const data = await response.json();
      return data.rates;
    },
    staleTime: refetchInterval,
    refetchInterval: refetchInterval,
    retry: 3,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
  });
};
