import { NextResponse } from 'next/server';
import { getFromCache, setCache } from '@/lib/redis';

const CACHE_KEY_CMC20_PRICE = 'cmc20:price';
const CACHE_EXPIRATION_SECONDS = 60;
const MS_PER_SECOND = 1000;
const CMC20_ID = '38442';
const CMC_API_URL = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';

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
  const freshData = await fetcher();
  await setCache(key, freshData, expiration);
  return {
    data: freshData,
    source: 'coinmarketcap-api',
    cachedAt: new Date(now).toISOString(),
    age: 0,
  };
}

async function fetchCmc20Price(): Promise<CachedPrice> {
  const apiKey = process.env.COINMARKETCAP_API_KEY;
  if (!apiKey) throw new Error('Missing CoinMarketCap API key');

  const url = `${CMC_API_URL}?id=${CMC20_ID}&convert=USD`;
  const response = await fetch(url, {
    headers: {
      'X-CMC_PRO_API_KEY': apiKey,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Error retrieving CMC20 price from CoinMarketCap');
  }

  const data = await response.json();
  const quote = data?.data?.[CMC20_ID]?.quote?.USD;
  const price = quote?.price;

  if (typeof price !== 'number') {
    throw new Error('Invalid CMC20 price format');
  }

  return {
    price,
    percent_change_24h: quote?.percent_change_24h ?? null,
    percent_change_30d: quote?.percent_change_30d ?? null,
    percent_change_90d: quote?.percent_change_90d ?? null,
    timestamp: Date.now(),
  };
}

export async function GET() {
  try {
    const { data, source, cachedAt, age } = await getCachedOrFetch<CachedPrice>(
      CACHE_KEY_CMC20_PRICE,
      fetchCmc20Price,
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
      { error: 'Error retrieving CMC20 price', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
