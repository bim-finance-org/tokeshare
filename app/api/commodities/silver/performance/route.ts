import { NextRequest, NextResponse } from 'next/server';
import { getFromCache, setCache } from '@/lib/redis';
import { rateLimit, rateLimitHeaders } from '@/lib/ratelimit';
import { singleFlight } from '@/lib/singleFlight';
import { getLogger } from '@/lib/logger';
import { Period } from '@/enums/Period';

const log = getLogger('api:xagm-perf');

// CoinGecko id du XAGM (Matrixdock Silver), le sous-jacent du TSG.
const COINGECKO_URL = 'https://api.coingecko.com/api/v3/coins/matrixdock-silver/market_chart';

const CACHE_EXPIRATION_1D = 20 * 60;
const CACHE_EXPIRATION_1Y = 6 * 60 * 60;

const DAYS_FOR_YEAR = 365;
const DAYS_FOR_DAY = 2;

const PRICE_INDEX_TODAY = -1;
const PRICE_INDEX_YESTERDAY = -2;

const MIN_PRICES_REQUIRED = 2;
const PERCENT_MULTIPLIER = 100;

function extractPeriode(request: NextRequest): string | null {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period');
  return period;
}

async function fetchAndBuildPerformance(period: string) {
  const days = period === Period.OneYear ? DAYS_FOR_YEAR : DAYS_FOR_DAY;
  const url = `${COINGECKO_URL}?vs_currency=usd&days=${days}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    const errorBody = await resp.text();
    throw new Error(`CoinGecko fetch failed. Status: ${resp.status}, Body: ${errorBody}`);
  }
  const json = await resp.json();
  const prices: [number, number][] = json.prices;

  if (!prices || prices.length < MIN_PRICES_REQUIRED) {
    throw new Error('Not enough price data');
  }
  return buildPerformanceResult(prices, period);
}

async function getCachedOrFetch<Data>(
  key: string,
  fetcher: () => Promise<Data>,
  expiration: number,
): Promise<{ data: Data; source: string }> {
  const cached = await getFromCache<Data>(key);
  if (cached) {
    return { data: cached, source: 'redis-cache' };
  }
  const freshData = await singleFlight(key, async () => {
    const fresh = await fetcher();
    await setCache(key, fresh, expiration);
    return fresh;
  });
  return { data: freshData, source: 'coingecko-api' };
}

function buildPerformanceResult(prices: [number, number][], period: string) {
  prices.sort((a, b) => a[0] - b[0]);
  const todayPrice = prices[prices.length + PRICE_INDEX_TODAY][1];

  if (period === Period.OneYear) {
    const oneYearAgoPrice = prices[0][1];
    const perf1y = oneYearAgoPrice ? ((todayPrice - oneYearAgoPrice) / oneYearAgoPrice) * PERCENT_MULTIPLIER : null;
    return {
      todayPrice,
      oneYearAgoPrice,
      perf1y,
      lastUpdate: new Date().toISOString(),
    };
  } else {
    const yesterdayPrice = prices[prices.length + PRICE_INDEX_YESTERDAY][1];
    const perf1d = yesterdayPrice ? ((todayPrice - yesterdayPrice) / yesterdayPrice) * PERCENT_MULTIPLIER : null;
    return {
      todayPrice,
      yesterdayPrice,
      perf1d,
      lastUpdate: new Date().toISOString(),
    };
  }
}

export async function GET(request: NextRequest) {
  const limit = await rateLimit(request, { key: 'api:xagm-perf', limit: 60, windowSec: 60 });
  if (!limit.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rateLimitHeaders(limit) });
  }

  try {
    const period = extractPeriode(request);
    if (!period) {
      return NextResponse.json({ error: 'Invalid or missing period argument' }, { status: 400 });
    }

    const cacheKey = `coingecko:xagm:perf:${period}`;
    const cacheExpiration = period === Period.OneYear ? CACHE_EXPIRATION_1Y : CACHE_EXPIRATION_1D;

    const { data, source } = await getCachedOrFetch(cacheKey, () => fetchAndBuildPerformance(period), cacheExpiration);

    return NextResponse.json({ ...data, source });
  } catch (e) {
    log.error('XAGM performance failed', e);
    return NextResponse.json({ error: 'Failed to get XAGM performance' }, { status: 500 });
  }
}
