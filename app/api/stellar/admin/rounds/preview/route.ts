// Operator console, step 1: dry-run a distribution round. Reads fresh
// balances and trustlines, returns the exact split per payout channel (SDP /
// distributor push / claim) and the SDP top-up it implies — no side effects.
// Mandatory look-before-you-leap: SDP payments and Merkle roots are final.

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-utils';
import { getLogger } from '@/lib/logger';
import { previewRound } from '@/lib/stellar-rounds';
import { parseRoundRequest } from '../parse';
import { errorMessage } from '@/lib/error-message';

const log = getLogger('api:stellar-admin-round-preview');

export async function POST(request: Request) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = parseRoundRequest(await request.json().catch(() => ({})));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });

  try {
    return NextResponse.json(await previewRound(parsed.asset, parsed.totalStroops));
  } catch (error) {
    log.error('round preview failed', error);
    const message = errorMessage(error, 'Snapshot failed');
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
