import { NextResponse } from 'next/server';
import { getLogger } from '@/lib/logger';
import { getXagmPrice } from '@/lib/prices';
import { rateLimit, rateLimitHeaders } from '@/lib/ratelimit';

const log = getLogger('api:xagm-price');

export async function GET(request: Request) {
  const limit = await rateLimit(request, { key: 'api:xagm-price', limit: 60, windowSec: 60 });
  if (!limit.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rateLimitHeaders(limit) });
  }

  try {
    const { data, source, cachedAt, age } = await getXagmPrice();
    return NextResponse.json({
      price: data.price,
      source,
      cachedAt,
      age,
    });
  } catch (error) {
    log.error('XAGM price failed', error);
    return NextResponse.json({ error: 'Error retrieving XAGM price' }, { status: 500 });
  }
}
