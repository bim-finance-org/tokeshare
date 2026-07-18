import { NextResponse } from 'next/server';
import { getFromCache, setCache } from '@/lib/redis';
import { rateLimit, rateLimitHeaders } from '@/lib/ratelimit';
import { singleFlight } from '@/lib/singleFlight';

const CACHE_KEY_TSP500_PRICE = 'tsp500:price';
const CACHE_EXPIRATION_SECONDS = 60;
const MS_PER_SECOND = 1000;
const COINGECKO_ID = 'defi-janus-henderson-anemoy-s-p500-fund-token';
const COINGECKO_API_URL = `https://api.coingecko.com/api/v3/coins/${COINGECKO_ID}`;

interface CachedPrice {
  price: number;
  percent_change_24h: number | null;
  percent_change_30d: number | null;
  percent_change_90d: number | null;
  timestamp: number;
}

async function getCachedOrFetch<Data>(
  key: string,
  fetcher: () => Promise<Data>,
  expiration: number,
): Promise<{ data: Data; source: string; cachedAt: string; age: number }> {
  const cached = await getFromCache<CachedPrice>(key);
  const now = Date.now();
  if (cached && now - cached.timestamp < expiration * MS_PER_SECOND) {
    return {
      data: cached as Data,
      source: 'redis-cache',
      cachedAt: new Date(cached.timestamp).toISOString(),
      age: Math.round((now - cached.timestamp) / MS_PER_SECOND),
    };
  }
  const freshData = await singleFlight(key, async () => {
    const fresh = await fetcher();
    await setCache(key, fresh, expiration);
    return fresh;
  });
  return {
    data: freshData,
    source: 'coingecko-api',
    cachedAt: new Date(now).toISOString(),
    age: 0,
  };
}

async function fetchDeSPXAPrice(): Promise<CachedPrice> {
  const url = `${COINGECKO_API_URL}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false`;
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Error retrieving deSPXA price from CoinGecko');
  }

  const data = await response.json();
  const marketData = data?.market_data;
  const price = marketData?.current_price?.usd;

  if (typeof price !== 'number') {
    throw new Error('Invalid deSPXA price format');
  }

  return {
    price,
    percent_change_24h: marketData?.price_change_percentage_24h ?? null,
    percent_change_30d: marketData?.price_change_percentage_30d ?? null,
    percent_change_90d: null,
    timestamp: Date.now(),
  };
}

export async function GET(request: Request) {
  const limit = await rateLimit(request, { key: 'api:tsp500-price', limit: 60, windowSec: 60 });
  if (!limit.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rateLimitHeaders(limit) });
  }

  try {
    const { data, source, cachedAt, age } = await getCachedOrFetch<CachedPrice>(
      CACHE_KEY_TSP500_PRICE,
      fetchDeSPXAPrice,
      CACHE_EXPIRATION_SECONDS,
    );
    return NextResponse.json({
      price: data.price,
      percent_change_24h: data.percent_change_24h,
      percent_change_30d: data.percent_change_30d,
      percent_change_90d: data.percent_change_90d,
      source,
      cachedAt,
      age,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error retrieving deSPXA price', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
