// Resumes a round stopped mid-way (SDP unreachable, insufficient balance,
// RPC timeout…). Every step is idempotent: what already took effect is
// skipped, the rest is retried.

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-utils';
import { getLogger } from '@/lib/logger';
import { advanceRound, getRound } from '@/lib/stellar-rounds';
import { errorMessage } from '@/lib/error-message';

const log = getLogger('api:stellar-admin-round-advance');

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    await advanceRound(id);
    const round = await getRound(id);
    if (!round) return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    return NextResponse.json(round);
  } catch (error) {
    log.error(`round ${id} advance failed`, error);
    const message = errorMessage(error, 'Round execution failed');
    return NextResponse.json({ error: message, roundId: id }, { status: 500 });
  }
}
