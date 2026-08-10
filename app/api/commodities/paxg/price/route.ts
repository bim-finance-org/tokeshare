import { NextResponse } from 'next/server';
import { getLogger } from '@/lib/logger';
import { getPaxgPrice } from '@/lib/prices';
import { rateLimit, rateLimitHeaders } from '@/lib/ratelimit';

const log = getLogger('api:paxg-price');

export async function GET(request: Request) {
  const limit = await rateLimit(request, { key: 'api:paxg-price', limit: 60, windowSec: 60 });
  if (!limit.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rateLimitHeaders(limit) });
  }

  try {
    const { data, source, cachedAt, age } = await getPaxgPrice();
    return NextResponse.json({
      price: data.price,
      source,
      cachedAt,
      age,
    });
  } catch (error) {
    log.error('PAXG price failed', error);
    return NextResponse.json({ error: 'Error retrieving PAXG price' }, { status: 500 });
  }
}
