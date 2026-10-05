// Operator console, step 2 and history.
//
// POST: the one click. Re-snapshots, persists the round, then advances it as
// far as it goes (SDP top-up → claim cycle → SDP disbursement, or the
// distributor push on a network without SDP). A failure leaves the round
// `planned` with its error — the console resumes it via /[id]/advance.
//
// GET ?slug=: every round of an asset with its lines, after a best-effort sync
// of the ones still in flight (the worker does the same every minute).

import { NextResponse } from 'next/server';
import { getStellarAsset } from '@/config/stellar-assets';
import { requireAuth } from '@/lib/api-utils';
import { getLogger } from '@/lib/logger';
import { advanceRound, getRound, listRounds, planRound, syncActiveRounds } from '@/lib/stellar-rounds';
import { parseRoundRequest } from './parse';

const log = getLogger('api:stellar-admin-rounds');

/** Claim window when the console does not specify one. */
const DEFAULT_EXPIRES_DAYS = 90;

export async function POST(request: Request) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { slug?: string; totalUsdc?: string; expiresDays?: number };
  const parsed = parseRoundRequest(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  const expiresDays = Number(body.expiresDays) || DEFAULT_EXPIRES_DAYS;
  if (expiresDays < 1 || expiresDays > 365) {
    return NextResponse.json({ error: 'expiresDays must be 1-365' }, { status: 400 });
  }

  let roundId: string;
  try {
    roundId = await planRound(parsed.asset, parsed.totalStroops, expiresDays);
  } catch (error) {
    log.error('round planning failed', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Planning failed' }, { status: 500 });
  }

  try {
    await advanceRound(roundId);
    const round = await getRound(roundId);
    log.info(`round ${roundId} submitted for ${parsed.asset.slug}`);
    return NextResponse.json(round);
  } catch (error) {
    log.error(`round ${roundId} stopped`, error);
    const message = error instanceof Error ? error.message : 'Round execution failed';
    return NextResponse.json({ error: message, roundId }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const slug = new URL(request.url).searchParams.get('slug') ?? '';
  if (!getStellarAsset(slug)) return NextResponse.json({ error: 'Unknown asset' }, { status: 404 });

  const { errors } = await syncActiveRounds({ assetSlug: slug });
  if (errors.length > 0) log.warn('round sync errors', errors);
  try {
    return NextResponse.json({ rounds: await listRounds(slug), syncErrors: errors });
  } catch (error) {
    log.error('round listing failed', error);
    return NextResponse.json({ error: 'Error retrieving rounds' }, { status: 500 });
  }
}
