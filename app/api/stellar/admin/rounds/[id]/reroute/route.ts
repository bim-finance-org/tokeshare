// Moves the failed SDP lines of a round to the claim path: a new distributor
// cycle over exactly those holders, funded by the operator account.

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-utils';
import { getLogger } from '@/lib/logger';
import { getRound, rerouteFailed } from '@/lib/stellar-rounds';

const log = getLogger('api:stellar-admin-round-reroute');

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    const { cycleId, count } = await rerouteFailed(id);
    log.info(`round ${id}: ${count} failed SDP line(s) re-routed to claim cycle #${cycleId}`);
    return NextResponse.json({ cycleId, count, round: await getRound(id) });
  } catch (error) {
    log.error(`round ${id} reroute failed`, error);
    const message = error instanceof Error ? error.message : 'Re-route failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
