import { useQuery } from '@tanstack/react-query';

// Prix spot du XAGM (Matrixdock Silver), le sous-jacent du TSG — équivalent de usePaxgPrice.
export const useXagmPrice = ({ enabled = true }: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: ['xagmPrice'],
    queryFn: async () => {
      const response = await fetch('/api/commodities/silver/price');
      if (!response.ok) {
        throw new Error('Failed to fetch XAGM price');
      }
      const data = await response.json();
      return data.price;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // Les données sont considérées comme fraîches pendant 5 minutes
    refetchInterval: 5 * 60 * 1000, // Rafraîchissement toutes les 5 minutes
    retry: 3, // 3 tentatives en cas d'échec
    retryDelay: 1000, // 1 seconde entre chaque tentative
  });
};
