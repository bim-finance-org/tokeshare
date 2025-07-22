import { Period } from '@/enums/Period';
import { useEffect, useState } from 'react';

interface PerformanceData {
  todayPrice?: number;
  yesterdayPrice?: number;
  oneYearAgoPrice?: number;
  perf1d?: number | null;
  perf1y?: number | null;
  lastUpdate: string;
  source: string;
}

export function usePaxgPerformance(period: Period = Period.OneDay) {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetch(`/api/commodities/paxg/performance?period=${period}`)
      .then(async (res) => {
        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error || 'Unknow error');
        }
        return res.json();
      })
      .then((json) => {
        if (isMounted) setData(json);
      })
      .catch((e) => {
        if (isMounted) setError(e.message);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [period]);

  return { data, isLoading, error };
}
