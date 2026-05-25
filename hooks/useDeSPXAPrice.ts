import { useQuery } from '@tanstack/react-query';

export const useDeSPXAPrice = ({ enabled = true }: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: ['despxaPrice'],
    queryFn: async () => {
      const response = await fetch('/api/tsp500/price');
      if (!response.ok) {
        throw new Error('Failed to fetch deSPXA price');
      }
      const data = await response.json();
      return data.price as number;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: 3,
    retryDelay: 1000,
  });
};
