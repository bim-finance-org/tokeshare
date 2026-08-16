// Cap table of one asset from the indexer's holder set. The sale contract's
// row is flagged as inventory so consumers can set it apart from investors.

import { publicJson, publicPreflight } from '@/lib/cors';
import { getLogger } from '@/lib/logger';
import { getAssetHolders, isKnownAsset } from '@/lib/stellar-distributions';
import { rateLimit, rateLimitHeaders } from '@/lib/ratelimit';

const log = getLogger('api:stellar-holders');

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

  try {
    const holders = await getAssetHolders(slug);
    return publicJson({ holders }, { headers: { 'Cache-Control': CDN_CACHE_HEADER, ...rateLimitHeaders(limit) } });
  } catch (error) {
    log.error('asset holders failed', error);
    return publicJson({ error: 'Error retrieving holders' }, { status: 500 });
  }
}
