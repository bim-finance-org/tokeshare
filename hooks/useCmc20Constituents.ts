import { useQuery } from '@tanstack/react-query';
import { Constituent } from '@/app/api/cmc20/constituents/route';

interface ConstituentsResponse {
  constituents: Constituent[];
  totalMarketCap: number;
  source: string;
  cachedAt: string;
  age: number;
}

export const useCmc20Constituents = () => {
  return useQuery<ConstituentsResponse>({
    queryKey: ['cmc20Constituents'],
    queryFn: async () => {
      const response = await fetch('/api/cmc20/constituents');
      if (!response.ok) {
        throw new Error('Failed to fetch CMC20 constituents');
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    refetchInterval: 1000 * 60 * 60, // Refetch every hour
  });
};
