import { NextResponse } from 'next/server';
import { getFromCache, setCache } from '@/lib/redis';
import { rateLimit, rateLimitHeaders } from '@/lib/ratelimit';
import { singleFlight } from '@/lib/singleFlight';

const CACHE_KEY_EXCHANGE_RATES = 'exchange:rates:usd';
const CACHE_EXPIRATION_SECONDS = 30 * 60;
const MS_PER_SECOND = 1000;
const API_KEY = process.env.EXCHANGE_RATE_API_KEY;
const API_URL = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/USD`;

interface ExchangeRates {
  EUR: number;
  CAD: number;
  CHF: number;
  GBP: number;
  USD: number;
}
interface CachedExchangeRates {
  rates: ExchangeRates;
  base: string;
  timestamp: number;
}

async function getCachedOrFetch<Data extends { timestamp: number }>(
  key: string,
  fetcher: () => Promise<Data>,
  expiration: number,
): Promise<{ data: Data; source: string; cachedAt: string; age: number }> {
  const cached = await getFromCache<Data>(key);
  const now = Date.now();
  if (cached && now - cached.timestamp < expiration * MS_PER_SECOND) {
    return {
      data: cached,
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
    source: 'exchange-rate-api',
    cachedAt: new Date(now).toISOString(),
    age: 0,
  };
}

async function fetchExchangeRates(): Promise<CachedExchangeRates> {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error('Error retrieving exchange rates');
  const data = await response.json();
  if (data.result === 'error') throw new Error('Error retrieving exchange rates');

  return {
    rates: {
      EUR: data.conversion_rates.EUR,
      CAD: data.conversion_rates.CAD,
      CHF: data.conversion_rates.CHF,
      GBP: data.conversion_rates.GBP,
      USD: data.conversion_rates.USD,
    },
    base: data.base_code,
    timestamp: Date.now(),
  };
}

/**
 * GET to retrieve the exchange rates
 * @returns The exchange rates
 */
export async function GET(request: Request) {
  const limit = await rateLimit(request, { key: 'api:exchange-rates', limit: 60, windowSec: 60 });
  if (!limit.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rateLimitHeaders(limit) });
  }

  try {
    const { data, source, cachedAt, age } = await getCachedOrFetch<CachedExchangeRates>(
      CACHE_KEY_EXCHANGE_RATES,
      fetchExchangeRates,
      CACHE_EXPIRATION_SECONDS,
    );
    return NextResponse.json({
      rates: data.rates,
      base: data.base,
      source,
      cachedAt,
      age,
    });
  } catch {
    return NextResponse.json({ error: 'Error retrieving exchange rates' }, { status: 500 });
  }
}
