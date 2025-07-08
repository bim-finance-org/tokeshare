import { NextResponse } from 'next/server';
import { getFromCache, setCache } from '@/lib/redis';

const CACHE_KEY_PAXG_PRICE = 'paxg:price';
const CACHE_EXPIRATION_SECONDS = 60;
const MS_PER_SECOND = 1000;
const PAXG_PRICE_API_URL = 'https://cryptoprices.cc/PAXG/';

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
  const freshData = await fetcher();
  await setCache(key, freshData, expiration);
  return {
    data: freshData,
    source: 'cryptoprices-api',
    cachedAt: new Date(now).toISOString(),
    age: 0,
  };
}

async function fetchPaxgPrice(): Promise<CachedPrice> {
  const response = await fetch(PAXG_PRICE_API_URL, {
    method: 'GET',
    headers: {
      Accept: 'text/plain',
      'Content-Type': 'text/plain',
    },
  });
  if (!response.ok) {
    throw new Error('Error retrieving PAXG price');
  }
  const priceText = await response.text();
  const price = parseFloat(priceText);
  if (isNaN(price)) throw new Error('Invalid price format');
  return {
    price,
    timestamp: Date.now(),
  };
}

export async function GET() {
  try {
    const { data, source, cachedAt, age } = await getCachedOrFetch<CachedPrice>(
      CACHE_KEY_PAXG_PRICE,
      fetchPaxgPrice,
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
      { error: 'Error retrieving PAXG price', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
