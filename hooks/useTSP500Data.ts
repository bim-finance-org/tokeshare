import { useQuery } from '@tanstack/react-query';
import { calculateTSP500Price } from '@/utils/priceUtils';

interface DeSPXAPriceResponse {
  price: number;
  percent_change_24h: number | null;
  percent_change_30d: number | null;
  percent_change_90d: number | null;
}

export function useTSP500Data() {
  const { data, isLoading, error } = useQuery<DeSPXAPriceResponse>({
    queryKey: ['despxaPriceData'],
    queryFn: async () => {
      const response = await fetch('/api/tsp500/price');
      if (!response.ok) {
        throw new Error('Failed to fetch deSPXA price');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: 3,
    retryDelay: 1000,
  });

  return {
    price: data?.price ? calculateTSP500Price(data.price) : null,
    perf1d: data?.percent_change_24h ?? null,
    perf30d: data?.percent_change_30d ?? null,
    perf90d: data?.percent_change_90d ?? null,
    isLoading,
    error: error?.message ?? null,
  };
}
