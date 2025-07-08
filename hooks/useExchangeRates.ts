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

/**
 * Convertit un montant d'une devise à une autre en utilisant USD comme intermédiaire
 * @param amount Montant à convertir
 * @param from Devise source
 * @param to Devise cible
 * @param rates Taux de change par rapport à USD
 * @returns Montant converti ou undefined si les taux ne sont pas disponibles
 */
export const convertCurrency = (
  amount: number,
  from: keyof ExchangeRates | 'USD',
  to: keyof ExchangeRates | 'USD',
  rates: ExchangeRates | undefined,
): number | undefined => {
  if (!rates) return undefined;

  // Si les devises sont identiques, retourner le montant directement
  if (from === to) return amount;

  // Convertir en USD d'abord (si pas déjà en USD)
  let amountInUSD = amount;
  if (from !== 'USD') {
    amountInUSD = amount / rates[from];
  }

  // Puis convertir d'USD vers la devise cible
  if (to === 'USD') {
    return amountInUSD;
  }

  return amountInUSD * rates[to];
};

/**
 * Helper function to format a currency amount with the correct symbol and decimals
 * @param amount Amount to format
 * @param currency Currency code
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, currency: string): string => {
  const formatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(amount);
};
