// Operator console, step 1: dry-run a distribution cycle. Reads fresh
// balances and trustlines, returns the exact payout table — no side effects,
// nothing on-chain. Mandatory look-before-you-leap: a published Merkle root
// is irreversible.

import { NextResponse } from 'next/server';
import { getStellarAsset, isAssetConfigured } from '@/config/stellar-assets';
import { requireAuth } from '@/lib/api-utils';
import { getLogger } from '@/lib/logger';
import { unitsToStroops } from '@/lib/stellar';
import { computeSnapshot } from '@/lib/stellar-admin';

const log = getLogger('api:stellar-admin-preview');

export async function POST(request: Request) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { slug?: string; totalUsdc?: string };
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

  try {
    const snapshot = await computeSnapshot(asset, totalStroops);
    return NextResponse.json({
      slug: asset.slug,
      network: asset.network,
      snapshotLedger: snapshot.snapshotLedger,
      eligibleShares: snapshot.eligibleShares.toString(),
      dust: snapshot.dust.toString(),
      excluded: snapshot.excluded,
      lines: snapshot.lines.map((l) => ({
        address: l.address,
        shares: l.shares.toString(),
        amount: l.amount.toString(),
        push: l.push,
      })),
    });
  } catch (error) {
    log.error('snapshot preview failed', error);
    const message = error instanceof Error ? error.message : 'Snapshot failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
