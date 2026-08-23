// Portfolio of one Stellar address across every registry asset: holdings,
// trade totals and distribution totals. Valuation stays client-side (the app
// already reads live prices from the sale contracts).

import { publicJson, publicPreflight } from '@/lib/cors';
import { getLogger } from '@/lib/logger';
import { getPortfolio, isStrkey } from '@/lib/stellar-distributions';
import { rateLimit, rateLimitHeaders } from '@/lib/ratelimit';

const log = getLogger('api:stellar-portfolio');

// Short: a fresh claim should show up promptly after the next indexer pass.
const CDN_CACHE_HEADER = 'public, s-maxage=30, stale-while-revalidate=120';

export async function OPTIONS() {
  return publicPreflight();
}

export async function GET(request: Request, { params }: { params: Promise<{ address: string }> }) {
  const limit = await rateLimit(request, { key: 'api:stellar', limit: 120, windowSec: 60 });
  if (!limit.success) {
    return publicJson({ error: 'Too many requests' }, { status: 429, headers: rateLimitHeaders(limit) });
  }

  const { address } = await params;
  if (!isStrkey(address)) {
    return publicJson({ error: 'Invalid Stellar address' }, { status: 400, headers: rateLimitHeaders(limit) });
  }

  try {
    const portfolio = await getPortfolio(address);
    return publicJson(portfolio, { headers: { 'Cache-Control': CDN_CACHE_HEADER, ...rateLimitHeaders(limit) } });
  } catch (error) {
    log.error('portfolio failed', error);
    return publicJson({ error: 'Error retrieving portfolio' }, { status: 500 });
  }
}
