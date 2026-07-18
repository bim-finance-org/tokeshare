import { NextResponse } from 'next/server';
import { getFromCache, setCache } from '@/lib/redis';
import { rateLimit, rateLimitHeaders } from '@/lib/ratelimit';
import { singleFlight } from '@/lib/singleFlight';

const CACHE_KEY_CMC20_CONSTITUENTS = 'cmc20:constituents';
const CACHE_EXPIRATION_SECONDS = 3600; // 1 hour cache (constituents don't change often)
const MS_PER_SECOND = 1000;
const CMC20_INDEX_URL = 'https://pro-api.coinmarketcap.com/v3/index/cmc20-latest';

export interface Constituent {
  id: number;
  name: string;
  symbol: string;
  marketCap: number;
  price: number;
  percentChange24h: number;
  weight: number;
}

interface CachedConstituents {
  constituents: Constituent[];
  totalMarketCap: number;
  timestamp: number;
}

interface CmcConstituent {
  id: number;
  name: string;
  symbol: string;
  weight: number;
  priceUsd: number;
  units: number;
  url: string;
}

interface Cmc20Response {
  data: {
    value: number;
    constituents: CmcConstituent[];
  };
}

async function getCachedOrFetch<Data>(
  key: string,
  fetcher: () => Promise<Data>,
  expiration: number,
): Promise<{ data: Data; source: string; cachedAt: string; age: number }> {
  const cached = await getFromCache<CachedConstituents>(key);
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
    source: 'coinmarketcap-api',
    cachedAt: new Date(now).toISOString(),
    age: 0,
  };
}

async function fetchCmc20Constituents(): Promise<CachedConstituents> {
  const apiKey = process.env.COINMARKETCAP_API_KEY;
  if (!apiKey) throw new Error('Missing CoinMarketCap API key');

  const response = await fetch(CMC20_INDEX_URL, {
    headers: {
      'X-CMC_PRO_API_KEY': apiKey,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Error retrieving CMC20 index from CoinMarketCap');
  }

  const data: Cmc20Response = await response.json();
  const cmcConstituents = data?.data?.constituents || [];
  const indexValue = data?.data?.value || 0;

  // Map to our constituent format (weight is already in percentage)
  const constituents: Constituent[] = cmcConstituents.map((c) => ({
    id: c.id,
    name: c.name,
    symbol: c.symbol,
    marketCap: c.priceUsd * c.units * 100, // Approximate market cap contribution to index
    price: c.priceUsd,
    percentChange24h: 0, // Not provided by this endpoint
    weight: c.weight, // Already in percentage
  }));

  // Calculate total market cap from index value
  const totalMarketCap = indexValue;

  return {
    constituents,
    totalMarketCap,
    timestamp: Date.now(),
  };
}

export async function GET(request: Request) {
  const limit = await rateLimit(request, { key: 'api:cmc20-constituents', limit: 60, windowSec: 60 });
  if (!limit.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rateLimitHeaders(limit) });
  }

  try {
    const { data, source, cachedAt, age } = await getCachedOrFetch<CachedConstituents>(
      CACHE_KEY_CMC20_CONSTITUENTS,
      fetchCmc20Constituents,
      CACHE_EXPIRATION_SECONDS,
    );
    return NextResponse.json({
      constituents: data.constituents,
      totalMarketCap: data.totalMarketCap,
      source,
      cachedAt,
      age,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error retrieving CMC20 constituents', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
