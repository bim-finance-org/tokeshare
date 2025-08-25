import { NextResponse } from 'next/server';
import { generateSnapshot } from '@/lib/snapshot';
import { requireAuth } from '@/lib/api-utils';
import fs from 'node:fs';
import path from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(_request: Request) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
  }

  try {
    const { totalUsdc } = (await _request.json().catch(() => ({}))) as {
      totalUsdc?: string | null;
    };

    const rows = await generateSnapshot({ totalUsdc: totalUsdc ?? null });

    const outPath = path.join(process.cwd(), 'public/snapshots/holders_snapshot.json');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(rows, null, 2), 'utf-8');

    return NextResponse.json({ ok: true, count: rows.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Snapshot failed' }, { status: 500 });
  }
}
