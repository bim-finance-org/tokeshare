import { NextResponse } from 'next/server';
import { generateSnapshot, isSnapshotToken, type FrontRow } from '@/lib/snapshot';
import type { MarketplaceTokenSymbol } from '@/config/token';
import { requireAuth } from '@/lib/api-utils';
import { getFromCache, setCache } from '@/lib/redis';
import { rateLimit } from '@/lib/ratelimit';
import { getLogger } from '@/lib/logger';

const log = getLogger('api:snapshot');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const SNAPSHOT_TTL_SECONDS = 24 * 60 * 60;

// TFT keeps its historical key so a snapshot taken before TLT existed stays readable.
const snapshotCacheKey = (token: MarketplaceTokenSymbol) =>
  token === 'TFT_001' ? 'snapshot:holders:latest' : `snapshot:holders:${token.toLowerCase()}:latest`;

// Guard the expensive full-chain scan: a global budget plus an in-process lock
// so two admins can't kick off overlapping scans at once.
let snapshotInProgress = false;

export async function POST(request: Request) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
  }

  const limit = await rateLimit(request, { key: 'snapshot:generate', identifier: 'global', limit: 5, windowSec: 3600 });
  if (!limit.success) {
    return NextResponse.json({ error: 'Snapshot rate limit reached. Try again later.' }, { status: 429 });
  }

  if (snapshotInProgress) {
    return NextResponse.json({ error: 'A snapshot is already running. Please wait for it to finish.' }, { status: 409 });
  }
  snapshotInProgress = true;

  try {
    const { totalUsdc, token: rawToken } = (await request.json().catch(() => ({}))) as {
      totalUsdc?: string | null;
      token?: string;
    };
    const token = rawToken ?? 'TFT_001';
    if (!isSnapshotToken(token)) {
      return NextResponse.json({ error: `Unknown token: ${token}` }, { status: 400 });
    }

    const rows = await generateSnapshot({ token, totalUsdc: totalUsdc ?? null });
    await setCache(snapshotCacheKey(token), rows, SNAPSHOT_TTL_SECONDS);

    return NextResponse.json({ ok: true, token, count: rows.length, rows });
  } catch (e) {
    log.error('generation failed', e);
    return NextResponse.json({ error: 'Snapshot failed' }, { status: 500 });
  } finally {
    snapshotInProgress = false;
  }
}

export async function GET(request: Request) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
  }

  const rawToken = new URL(request.url).searchParams.get('token') ?? 'TFT_001';
  if (!isSnapshotToken(rawToken)) {
    return NextResponse.json({ error: `Unknown token: ${rawToken}` }, { status: 400 });
  }

  const rows = await getFromCache<FrontRow[]>(snapshotCacheKey(rawToken));
  if (!rows) {
    return NextResponse.json({ error: 'No snapshot available. Generate one first.' }, { status: 404 });
  }
  return NextResponse.json({ token: rawToken, rows });
}
