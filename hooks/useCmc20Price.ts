import { useQuery } from '@tanstack/react-query';

export const useCmc20Price = ({ enabled = true }: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: ['cmc20Price'],
    queryFn: async () => {
      const response = await fetch('/api/cmc20/price');
      if (!response.ok) {
        throw new Error('Failed to fetch CMC20 price');
      }
      const data = await response.json();
      return data.price;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: 3,
    retryDelay: 1000,
  });
};
