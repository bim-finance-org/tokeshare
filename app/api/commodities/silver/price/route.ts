import { NextResponse } from 'next/server';
import { getFromCache, setCache } from '@/lib/redis';
import { rateLimit, rateLimitHeaders } from '@/lib/ratelimit';
import { singleFlight } from '@/lib/singleFlight';

const CACHE_KEY_XAGM_PRICE = 'xagm:price';
const CACHE_EXPIRATION_SECONDS = 60;
const MS_PER_SECOND = 1000;
// Spot du XAGM (Matrixdock Silver), même fournisseur que le PAXG du TGG.
const XAGM_PRICE_API_URL = 'https://cryptoprices.cc/XAGM/';

interface CachedPrice {
  price: number;
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
    source: 'cryptoprices-api',
    cachedAt: new Date(now).toISOString(),
    age: 0,
  };
}

async function fetchXagmPrice(): Promise<CachedPrice> {
  const response = await fetch(XAGM_PRICE_API_URL, {
    method: 'GET',
    headers: {
      Accept: 'text/plain',
      'Content-Type': 'text/plain',
    },
  });
  if (!response.ok) {
    throw new Error('Error retrieving XAGM price');
  }
  const priceText = await response.text();
  const price = parseFloat(priceText);
  if (isNaN(price)) throw new Error('Invalid price format');
  return {
    price,
    timestamp: Date.now(),
  };
}

export async function GET(request: Request) {
  const limit = await rateLimit(request, { key: 'api:xagm-price', limit: 60, windowSec: 60 });
  if (!limit.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rateLimitHeaders(limit) });
  }

  try {
    const { data, source, cachedAt, age } = await getCachedOrFetch<CachedPrice>(
      CACHE_KEY_XAGM_PRICE,
      fetchXagmPrice,
      CACHE_EXPIRATION_SECONDS,
    );
    return NextResponse.json({
      price: data.price,
      source,
      cachedAt,
      age,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error retrieving XAGM price', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
