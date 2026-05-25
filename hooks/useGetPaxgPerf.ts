import { Period } from '@/enums/Period';
import { useQuery } from '@tanstack/react-query';

interface PerformanceData {
  todayPrice?: number;
  yesterdayPrice?: number;
  oneYearAgoPrice?: number;
  perf1d?: number | null;
  perf1y?: number | null;
  lastUpdate: string;
  source: string;
}

async function fetchPaxgPerformance(period: Period): Promise<PerformanceData> {
  const res = await fetch(`/api/commodities/paxg/performance?period=${period}`);
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || 'Unknown error');
  }
  return res.json();
}

export function usePaxgPerformance(period: Period = Period.OneDay) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['paxg-performance', period],
    queryFn: () => fetchPaxgPerformance(period),
  });

  return {
    data: data ?? null,
    isLoading,
    error: error ? (error as Error).message : null,
  };
}
