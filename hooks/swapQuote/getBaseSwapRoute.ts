import type { RouteParams } from '@/interfaces/RouteParams';
import type { RouteSummary } from '@/interfaces/RouteSummary';

// Plain async fetcher for Base-only tokens (TMC/TSP500) — no wagmi hooks needed,
// so it can be shared as-is by the pure quote strategies.
export async function getBaseSwapRoute(params: RouteParams): Promise<RouteSummary> {
  const queryParams = new URLSearchParams({
    tokenIn: params.tokenIn,
    tokenOut: params.tokenOut,
    amountIn: params.amountIn,
    ...(params.gasInclude && { gasInclude: params.gasInclude.toString() }),
    ...(params.slippageTolerance && { slippageTolerance: params.slippageTolerance.toString() }),
    excludedSources:
      'kyberswap-limit-order-v2,kyberswap-limit-order,kyberswap-pmm,kyber-pmm,hashflow-v3,bebop,clipper,native-v1,native-v2',
  });

  const url = `https://aggregator-api.kyberswap.com/base/api/v1/routes?${queryParams}`;
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'X-Client-Id': 'tokeshare-dapp' },
  });

  if (!response.ok) throw new Error(`HTTP Error ${response.status}: ${await response.text()}`);

  const data = await response.json();
  if (data.code !== 0 || !data.data?.routeSummary) throw new Error(`API Error: ${data.message}`);

  return data.data.routeSummary;
}
