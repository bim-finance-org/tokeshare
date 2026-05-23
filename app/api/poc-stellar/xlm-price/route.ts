import { NextResponse } from 'next/server';
import { getFromCache, setCache } from '@/lib/redis';

const CACHE_KEY_XLM_PRICE = 'xlm:price';
const CACHE_EXPIRATION_SECONDS = 60;
const MS_PER_SECOND = 1000;
const XLM_PRICE_API_URL = 'https://cryptoprices.cc/XLM/';

interface CachedPrice {
  price: number;
  timestamp: number;
}

async function fetchXlmPrice(): Promise<CachedPrice> {
  const response = await fetch(XLM_PRICE_API_URL, {
    method: 'GET',
    headers: {
      Accept: 'text/plain',
      'Content-Type': 'text/plain',
    },
  });
  if (!response.ok) {
    throw new Error('Error retrieving XLM price');
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
    const cached = await getFromCache<CachedPrice>(CACHE_KEY_XLM_PRICE);
    const now = Date.now();
    if (cached && now - cached.timestamp < CACHE_EXPIRATION_SECONDS * MS_PER_SECOND) {
      return NextResponse.json({
        price: cached.price,
        source: 'redis-cache',
        cachedAt: new Date(cached.timestamp).toISOString(),
        age: Math.round((now - cached.timestamp) / MS_PER_SECOND),
      });
    }
    const fresh = await fetchXlmPrice();
    await setCache(CACHE_KEY_XLM_PRICE, fresh, CACHE_EXPIRATION_SECONDS);
    return NextResponse.json({
      price: fresh.price,
      source: 'cryptoprices-api',
      cachedAt: new Date(fresh.timestamp).toISOString(),
      age: 0,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error retrieving XLM price', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
