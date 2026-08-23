// Recent on-chain activity of one asset: buys and sells inferred by the
// indexer, USDC leg included when matched. `?limit=` caps the page (max 100).

import { publicJson, publicPreflight } from '@/lib/cors';
import { getLogger } from '@/lib/logger';
import { getAssetActivity, isKnownAsset } from '@/lib/stellar-distributions';
import { rateLimit, rateLimitHeaders } from '@/lib/ratelimit';

const log = getLogger('api:stellar-activity');

const CDN_CACHE_HEADER = 'public, s-maxage=60, stale-while-revalidate=300';

export async function OPTIONS() {
  return publicPreflight();
}

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const limit = await rateLimit(request, { key: 'api:stellar', limit: 120, windowSec: 60 });
  if (!limit.success) {
    return publicJson({ error: 'Too many requests' }, { status: 429, headers: rateLimitHeaders(limit) });
  }

  const { slug } = await params;
  if (!isKnownAsset(slug)) {
    return publicJson({ error: 'Unknown asset' }, { status: 404, headers: rateLimitHeaders(limit) });
  }

  const requested = Number(new URL(request.url).searchParams.get('limit')) || 50;
  const pageSize = Math.min(Math.max(1, requested), 100);

  try {
    const trades = await getAssetActivity(slug, pageSize);
    return publicJson({ trades }, { headers: { 'Cache-Control': CDN_CACHE_HEADER, ...rateLimitHeaders(limit) } });
  } catch (error) {
    log.error('asset activity failed', error);
    return publicJson({ error: 'Error retrieving activity' }, { status: 500 });
  }
}
