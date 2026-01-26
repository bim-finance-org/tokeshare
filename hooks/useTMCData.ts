import { useQuery } from '@tanstack/react-query';
import { calculateTMCPrice } from '@/utils/priceUtils';

interface CMC20PriceResponse {
  price: number;
  percent_change_24h: number | null;
  percent_change_30d: number | null;
  percent_change_90d: number | null;
}

export function useTMCData() {
  const { data, isLoading, error } = useQuery<CMC20PriceResponse>({
    queryKey: ['cmc20PriceData'],
    queryFn: async () => {
      const response = await fetch('/api/cmc20/price');
      if (!response.ok) {
        throw new Error('Failed to fetch CMC20 price');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: 3,
    retryDelay: 1000,
  });

  return {
    price: data?.price ? calculateTMCPrice(data.price) : null,
    perf1d: data?.percent_change_24h ?? null,
    perf30d: data?.percent_change_30d ?? null,
    perf90d: data?.percent_change_90d ?? null,
    isLoading,
    error: error?.message ?? null,
  };
}
