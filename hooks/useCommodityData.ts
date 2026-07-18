import useSWR from 'swr';

export interface CommodityPrice {
  price: number;
  [key: string]: unknown;
}

export interface CommodityPerformance {
  perf1d?: number | null;
  perf1y?: number | null;
  [key: string]: unknown;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useCommodityData(name: string) {
  if (name === 'Gold') name = 'paxg';
  else if (name === 'Silver') name = 'silver';
  else name = '';

  const {
    data: priceData,
    isLoading: loadingPrice,
    error: errorPrice,
  } = useSWR<CommodityPrice>(name ? `/api/commodities/${name}/price` : null, fetcher);

  const {
    data: perf1d,
    isLoading: loadingPerf1d,
    error: errorPerf1d,
  } = useSWR<CommodityPerformance>(name ? `/api/commodities/${name}/performance?period=1d` : null, fetcher);

  const {
    data: perf1y,
    isLoading: loadingPerf1y,
    error: errorPerf1y,
  } = useSWR<CommodityPerformance>(name ? `/api/commodities/${name}/performance?period=1y` : null, fetcher);

  return {
    price: priceData?.price ?? null,
    perf1d: perf1d ?? null,
    perf1y: perf1y ?? null,
    isLoading: loadingPrice || loadingPerf1d || loadingPerf1y,
    error: errorPrice?.message || errorPerf1d?.message || errorPerf1y?.message || null,
  };
}
