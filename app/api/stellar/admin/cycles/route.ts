// Operator console, step 2: the one click. Re-snapshots, builds the Merkle
// tree, persists the plan (entries + proofs — they exist nowhere else), then
// signs create_cycle (USDC deposit) and the distribute_for batches with the
// server-held admin key. Holders without a USDC trustline are left out of the
// batches; their lines await the claim path.

import { NextResponse } from 'next/server';
import { getStellarAsset, isAssetConfigured } from '@/config/stellar-assets';
import { requireAuth } from '@/lib/api-utils';
import { getLogger } from '@/lib/logger';
import { unitsToStroops } from '@/lib/stellar';
import { executeCycle } from '@/lib/stellar-admin';

const log = getLogger('api:stellar-admin-cycles');

/** Claim window when the console does not specify one. */
const DEFAULT_EXPIRES_DAYS = 90;

export async function POST(request: Request) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    slug?: string;
    totalUsdc?: string;
    expiresDays?: number;
  };
  const asset = body.slug ? getStellarAsset(body.slug) : undefined;
  if (!asset || !isAssetConfigured(asset)) {
    return NextResponse.json({ error: 'Unknown asset' }, { status: 404 });
  }
  let totalStroops: bigint;
  try {
    totalStroops = unitsToStroops(String(body.totalUsdc ?? ''));
    if (totalStroops <= 0n) throw new Error();
  } catch {
    return NextResponse.json({ error: 'Invalid totalUsdc' }, { status: 400 });
  }
  const expiresDays = Number(body.expiresDays) || DEFAULT_EXPIRES_DAYS;
  if (expiresDays < 1 || expiresDays > 365) {
    return NextResponse.json({ error: 'expiresDays must be 1-365' }, { status: 400 });
  }

  try {
    const result = await executeCycle(asset, totalStroops, expiresDays);
    log.info(`cycle ${result.cycleId} executed for ${asset.slug}: ${result.pushedCount} pushed, ${result.claimableCount} claimable`);
    return NextResponse.json(result);
  } catch (error) {
    log.error('cycle execution failed', error);
    const message = error instanceof Error ? error.message : 'Cycle execution failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
