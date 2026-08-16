// Claim, step 1: build the transaction for one claimable payout line. The
// entry's amount and Merkle proof come from our records; the contract is the
// judge — a wrong line simply fails verification on-chain.
//
// Returns `needsTrustline: true` (and no XDR) when the holder cannot receive
// USDC yet: the claim's transfer would fail on-chain, so the client must open
// the trustline first (that transaction can go through /submit too, so its
// fee is sponsored as well).

import { NextResponse } from 'next/server';
import { getNetworkProfile, type StellarNetwork } from '@/config/stellar';
import { getLogger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { buildClaimXdr, hasPaymentTrustline } from '@/lib/stellar-assets';
import { isStrkey } from '@/lib/stellar-distributions';
import { rateLimit, rateLimitHeaders } from '@/lib/ratelimit';

const log = getLogger('api:stellar-claim-build');

export async function POST(request: Request) {
  const limit = await rateLimit(request, { key: 'api:stellar-claim', limit: 30, windowSec: 60 });
  if (!limit.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rateLimitHeaders(limit) });
  }

  const body = (await request.json().catch(() => ({}))) as {
    network?: string;
    cycleId?: number;
    address?: string;
  };
  const network = body.network as StellarNetwork;
  if (network !== 'mainnet' && network !== 'testnet') {
    return NextResponse.json({ error: 'Invalid network' }, { status: 400 });
  }
  const cycleId = Number(body.cycleId);
  if (!Number.isInteger(cycleId) || cycleId < 0 || !body.address || !isStrkey(body.address)) {
    return NextResponse.json({ error: 'Invalid cycle or address' }, { status: 400 });
  }

  const profile = getNetworkProfile(network);
  if (!profile.distributorId) {
    return NextResponse.json({ error: 'No distributor on this network' }, { status: 400 });
  }

  const entry = await prisma.distributionEntry.findUnique({
    where: { network_cycleId_address: { network, cycleId, address: body.address } },
    include: { cycle: true },
  });
  if (!entry) return NextResponse.json({ error: 'No payout line for this address' }, { status: 404 });
  if (entry.paidAt) return NextResponse.json({ error: 'Already paid' }, { status: 409 });
  if (entry.cycle.sweptAt || entry.cycle.expiresAt.getTime() <= Date.now()) {
    return NextResponse.json({ error: 'Claim window closed' }, { status: 410 });
  }

  try {
    if (!(await hasPaymentTrustline(profile, entry.address))) {
      return NextResponse.json({ needsTrustline: true });
    }
    const claimXdr = await buildClaimXdr(
      profile,
      profile.distributorId,
      entry.address,
      cycleId,
      entry.amount,
      entry.proof as string[],
    );
    return NextResponse.json({ needsTrustline: false, xdr: claimXdr, amount: entry.amount.toString() });
  } catch (error) {
    log.error('claim build failed', error);
    const message = error instanceof Error ? error.message : 'Claim build failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
