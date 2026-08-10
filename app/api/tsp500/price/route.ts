import { NextResponse } from 'next/server';
import { getLogger } from '@/lib/logger';
import { getDeSPXAPrice } from '@/lib/prices';
import { rateLimit, rateLimitHeaders } from '@/lib/ratelimit';

const log = getLogger('api:tsp500-price');

export async function GET(request: Request) {
  const limit = await rateLimit(request, { key: 'api:tsp500-price', limit: 60, windowSec: 60 });
  if (!limit.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rateLimitHeaders(limit) });
  }

  try {
    const { data, source, cachedAt, age } = await getDeSPXAPrice();
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
    log.error('deSPXA price failed', error);
    return NextResponse.json({ error: 'Error retrieving deSPXA price' }, { status: 500 });
  }
}
