// Every payout line of one address: settled history plus claimable lines.
// A claimable line carries its Merkle proof — everything the claim
// transaction needs besides the holder's signature.

import { publicJson, publicPreflight } from '@/lib/cors';
import { getLogger } from '@/lib/logger';
import { getPortfolioDistributions, isStrkey } from '@/lib/stellar-distributions';
import { rateLimit, rateLimitHeaders } from '@/lib/ratelimit';

const log = getLogger('api:stellar-portfolio-distributions');

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
    const distributions = await getPortfolioDistributions(address);
    return publicJson({ address, distributions }, { headers: { 'Cache-Control': CDN_CACHE_HEADER, ...rateLimitHeaders(limit) } });
  } catch (error) {
    log.error('portfolio distributions failed', error);
    return publicJson({ error: 'Error retrieving distributions' }, { status: 500 });
  }
}
