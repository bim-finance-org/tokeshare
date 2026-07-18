import { NextResponse } from 'next/server';
import { generateSnapshot, type FrontRow } from '@/lib/snapshot';
import { requireAuth } from '@/lib/api-utils';
import { getFromCache, setCache } from '@/lib/redis';
import { rateLimit } from '@/lib/ratelimit';
import { getLogger } from '@/lib/logger';

const log = getLogger('api:snapshot');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const SNAPSHOT_CACHE_KEY = 'snapshot:holders:latest';
const SNAPSHOT_TTL_SECONDS = 24 * 60 * 60;

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
    const { totalUsdc } = (await request.json().catch(() => ({}))) as {
      totalUsdc?: string | null;
    };

    const rows = await generateSnapshot({ totalUsdc: totalUsdc ?? null });
    await setCache(SNAPSHOT_CACHE_KEY, rows, SNAPSHOT_TTL_SECONDS);

    return NextResponse.json({ ok: true, count: rows.length, rows });
  } catch (e) {
    log.error('generation failed', e);
    return NextResponse.json({ error: 'Snapshot failed' }, { status: 500 });
  } finally {
    snapshotInProgress = false;
  }
}

export async function GET() {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
  }

  const rows = await getFromCache<FrontRow[]>(SNAPSHOT_CACHE_KEY);
  if (!rows) {
    return NextResponse.json({ error: 'No snapshot available. Generate one first.' }, { status: 404 });
  }
  return NextResponse.json({ rows });
}
