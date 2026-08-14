// Public, unauthenticated catalog of every token Tokeshare sells: per-chain
// contract + collateral, price, and on-chain issued supply where the contract
// reports it.
// Consumed by third parties, hence the permissive CORS headers.

import { publicJson, publicPreflight } from '@/lib/cors';
import { getLogger } from '@/lib/logger';
import { getPublicTokens } from '@/lib/public-tokens';
import { rateLimit, rateLimitHeaders } from '@/lib/ratelimit';

const log = getLogger('api:tokens');

// Matches the 60s price cache: a CDN hit can't serve staler data than the
// origin would have computed anyway.
const CDN_CACHE_HEADER = 'public, s-maxage=60, stale-while-revalidate=300';

export async function OPTIONS() {
  return publicPreflight();
}

export async function GET(request: Request) {
  const limit = await rateLimit(request, { key: 'api:tokens', limit: 120, windowSec: 60 });
  if (!limit.success) {
    return publicJson({ error: 'Too many requests' }, { status: 429, headers: rateLimitHeaders(limit) });
  }

  try {
    const tokens = await getPublicTokens();
    return publicJson(
      { tokens, generatedAt: new Date().toISOString() },
      { headers: { 'Cache-Control': CDN_CACHE_HEADER, ...rateLimitHeaders(limit) } },
    );
  } catch (error) {
    log.error('token catalog failed', error);
    return publicJson({ error: 'Error retrieving tokens' }, { status: 500 });
  }
}
