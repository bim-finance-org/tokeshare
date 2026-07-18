import { NextRequest, NextResponse } from 'next/server';
import { getFromCache, setCache } from '@/lib/redis';
import { rateLimit, rateLimitHeaders } from '@/lib/ratelimit';

const CACHE_EXPIRATION_SECONDS = 20 * 60;
const MS_PER_SECOND = 1000;
const CMC_API_URL = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';

type CmcQuoteResponse = Record<string, unknown>;

// Only the CoinMarketCap IDs we actually display (stablecoins + CMC20). Anything
// else is rejected so an attacker can't rotate arbitrary IDs to bypass the cache
// and burn the paid CMC quota.
const ALLOWED_CMC_IDS = new Set(['38442', '3408', '825', '4943', '2989', '18852', '20641', '24927']);
const MAX_CMC_IDS = 20;

interface CachedData<Data> {
  data: Data;
  timestamp: number;
}

/**
 * Retreive the ids crytos from url
 * @param request - The request object
 * @returns All ids of crypto
 */
function extractCryptoIds(request: NextRequest): string | null {
  const { searchParams } = new URL(request.url);
  const idParam = searchParams.get('id') || searchParams.get('ids');
  if (!idParam || !/^\d+(,\d+)*$/.test(idParam)) {
    return null;
  }
  // Dedupe + whitelist + sort → `1,2` and `2,1` resolve to one stable cache key.
  const ids = Array.from(new Set(idParam.split(','))).filter((id) => ALLOWED_CMC_IDS.has(id));
  if (ids.length === 0 || ids.length > MAX_CMC_IDS) {
    return null;
  }
  ids.sort((a, b) => Number(a) - Number(b));
  return ids.join(',');
}

/**
 * Fetch the price of crypto
 * @param ids - The list to fetch
 * @returns The response of CoinMarketCap
 */
async function fetchCoinMarketCap(ids: string): Promise<CmcQuoteResponse> {
  const apiKey = process.env.COINMARKETCAP_API_KEY;
  if (!apiKey) throw new Error('Missing CoinMarketCap API key');
  const url = `${CMC_API_URL}?id=${ids}&convert=USD`;
  const response = await fetch(url, {
    headers: {
      'X-CMC_PRO_API_KEY': apiKey,
      Accept: 'application/json',
    },
  });
  if (!response.ok) throw new Error('Error retrieving CoinMarketCap data');
  return response.json();
}

/**
 * Fetch data from redis cache or coinMarketCap API if redis cache expired
 * @param key A unique key for redis cache
 * @param fetcher A function to fetch data if needed
 * @returns A promise with data
 */
async function getCachedOrFetch<Data>(
  key: string,
  fetcher: () => Promise<Data>,
): Promise<{ data: Data; source: string; cachedAt: string; age: number }> {
  const cached = await getFromCache<CachedData<Data>>(key);
  const now = Date.now();
  if (cached && now - cached.timestamp < CACHE_EXPIRATION_SECONDS * MS_PER_SECOND) {
    return {
      data: cached.data,
      source: 'redis-cache',
      cachedAt: new Date(cached.timestamp).toISOString(),
      age: Math.round((now - cached.timestamp) / MS_PER_SECOND),
    };
  }
  const freshData = await fetcher();
  await setCache(key, { data: freshData, timestamp: now }, CACHE_EXPIRATION_SECONDS);
  return {
    data: freshData,
    source: 'coinmarketcap-api',
    cachedAt: new Date(now).toISOString(),
    age: 0,
  };
}

/**
 * GET to retrieve the prices of cryptocurrencies from CoinMarketCap
 * @param request - The request object
 * @returns The prices of cryptocurrencies
 */
export async function GET(request: NextRequest) {
  const limit = await rateLimit(request, { key: 'cmc:quotes', limit: 60, windowSec: 60 });
  if (!limit.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  try {
    const cryptoIds = extractCryptoIds(request);
    if (!cryptoIds) {
      return NextResponse.json(
        { error: 'Invalid or missing ID parameter (must be comma-separated integers)' },
        { status: 400, headers: rateLimitHeaders(limit) },
      );
    }

    const cacheKey = `cmc:prices:id:${cryptoIds}`;
    const result = await getCachedOrFetch<CmcQuoteResponse>(cacheKey, () => fetchCoinMarketCap(cryptoIds));
    return NextResponse.json(result, { headers: rateLimitHeaders(limit) });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch data from CoinMarketCap',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
