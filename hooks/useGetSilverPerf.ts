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

async function fetchSilverPerformance(period: Period): Promise<PerformanceData> {
  const res = await fetch(`/api/commodities/silver/performance?period=${period}`);
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || 'Unknown error');
  }
  return res.json();
}

export function useSilverPerformance(period: Period = Period.OneDay) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['silver-performance', period],
    queryFn: () => fetchSilverPerformance(period),
  });

  return {
    data: data ?? null,
    isLoading,
    error: error ? (error as Error).message : null,
  };
}
