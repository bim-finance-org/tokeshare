// Single-token variant of /api/tokens. Same public contract, one entry.

import { publicJson, publicPreflight } from '@/lib/cors';
import { getLogger } from '@/lib/logger';
import { getPublicToken } from '@/lib/public-tokens';
import { rateLimit, rateLimitHeaders } from '@/lib/ratelimit';

const log = getLogger('api:tokens-symbol');

const CDN_CACHE_HEADER = 'public, s-maxage=60, stale-while-revalidate=300';

export async function OPTIONS() {
  return publicPreflight();
}

export async function GET(request: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const limit = await rateLimit(request, { key: 'api:tokens', limit: 120, windowSec: 60 });
  if (!limit.success) {
    return publicJson({ error: 'Too many requests' }, { status: 429, headers: rateLimitHeaders(limit) });
  }

  const { symbol } = await params;

  try {
    const token = await getPublicToken(symbol);
    if (!token) {
      return publicJson({ error: 'Unknown token' }, { status: 404, headers: rateLimitHeaders(limit) });
    }
    return publicJson(token, { headers: { 'Cache-Control': CDN_CACHE_HEADER, ...rateLimitHeaders(limit) } });
  } catch (error) {
    log.error('token lookup failed', error);
    return publicJson({ error: 'Error retrieving token' }, { status: 500 });
  }
}
