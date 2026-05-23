import { NextResponse } from 'next/server';
import { generateSnapshot, type FrontRow } from '@/lib/snapshot';
import { requireAuth } from '@/lib/api-utils';
import { getFromCache, setCache } from '@/lib/redis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const SNAPSHOT_CACHE_KEY = 'snapshot:holders:latest';
const SNAPSHOT_TTL_SECONDS = 24 * 60 * 60;

export async function POST(request: Request) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
  }

  try {
    const { totalUsdc } = (await request.json().catch(() => ({}))) as {
      totalUsdc?: string | null;
    };

    const rows = await generateSnapshot({ totalUsdc: totalUsdc ?? null });
    await setCache(SNAPSHOT_CACHE_KEY, rows, SNAPSHOT_TTL_SECONDS);

    return NextResponse.json({ ok: true, count: rows.length, rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Snapshot failed' }, { status: 500 });
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
