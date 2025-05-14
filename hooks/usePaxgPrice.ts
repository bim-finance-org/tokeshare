import { useQuery } from '@tanstack/react-query';

export const usePaxgPrice = () => {
  return useQuery({
    queryKey: ['paxgPrice'],
    queryFn: async () => {
      const response = await fetch('/api/paxg-price');
      if (!response.ok) {
        throw new Error('Failed to fetch PAXG price');
      }
      const data = await response.json();
      return data.price;
    },
    staleTime: 5 * 60 * 1000, // Les données sont considérées comme fraîches pendant 5 minutes
    refetchInterval: 5 * 60 * 1000, // Rafraîchissement toutes les 5 minutes
    retry: 3, // 3 tentatives en cas d'échec
    retryDelay: 1000, // 1 seconde entre chaque tentative
  });
}; 