import { useQuery } from '@tanstack/react-query';

export const useXlmPrice = () => {
  return useQuery({
    queryKey: ['xlmPrice'],
    queryFn: async () => {
      const response = await fetch('/api/poc-stellar/xlm-price');
      if (!response.ok) {
        throw new Error('Failed to fetch XLM price');
      }
      const data = await response.json();
      return data.price as number;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: 3,
    retryDelay: 1000,
  });
};
