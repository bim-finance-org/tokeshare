// Ramp transaction records (SEP-24 flows against MoneyGram / the test anchor).
//
// The anchor owns the state machine; these rows are the app-side mirror so the
// dashboard can render ramp history without holding an anchor JWT. The client
// reports what the anchor's /transaction endpoint said — same trust model as
// the other address-keyed public endpoints (rate limits, strict shapes), and
// nothing here moves funds.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getLogger } from '@/lib/logger';
import { isStrkey } from '@/lib/stellar-distributions';
import { rateLimit, rateLimitHeaders } from '@/lib/ratelimit';

const log = getLogger('api:stellar-ramp');

const PROVIDERS = new Set(['moneygram', 'testanchor']);
const DIRECTIONS = new Set(['deposit', 'withdrawal']);
const NETWORKS = new Set(['mainnet', 'testnet']);

const str = (value: unknown, max: number): string | undefined =>
  typeof value === 'string' && value.length > 0 && value.length <= max ? value : undefined;

export async function GET(request: Request) {
  const limit = await rateLimit(request, { key: 'api:stellar-ramp:get', limit: 120, windowSec: 60 });
  if (!limit.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rateLimitHeaders(limit) });
  }

  const address = new URL(request.url).searchParams.get('address') ?? '';
  if (!isStrkey(address)) {
    return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
  }

  const transactions = await prisma.rampTransaction.findMany({
    where: { address },
    orderBy: { startedAt: 'desc' },
    take: 50,
  });
  return NextResponse.json({ transactions });
}

export async function POST(request: Request) {
  const limit = await rateLimit(request, { key: 'api:stellar-ramp:post', limit: 60, windowSec: 60 });
  if (!limit.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rateLimitHeaders(limit) });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const network = str(body.network, 10);
  const provider = str(body.provider, 20);
  const direction = str(body.direction, 12);
  const address = str(body.address, 60) ?? '';
  const anchorTxId = str(body.anchorTxId, 120);
  const assetCode = str(body.assetCode, 12);
  const status = str(body.status, 40);

  if (
    !network ||
    !NETWORKS.has(network) ||
    !provider ||
    !PROVIDERS.has(provider) ||
    !direction ||
    !DIRECTIONS.has(direction) ||
    !isStrkey(address) ||
    !anchorTxId ||
    !assetCode ||
    !status
  ) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  // Mutable mirror fields — everything the anchor may update over the flow's life.
  const mutable = {
    status,
    amountIn: str(body.amountIn, 40) ?? null,
    amountOut: str(body.amountOut, 40) ?? null,
    amountFee: str(body.amountFee, 40) ?? null,
    moreInfoUrl: str(body.moreInfoUrl, 500) ?? null,
    externalRef: str(body.externalRef, 120) ?? null,
    stellarTxHash: str(body.stellarTxHash, 80) ?? null,
    message: str(body.message, 500) ?? null,
    completedAt: typeof body.completedAt === 'string' && body.completedAt ? new Date(body.completedAt) : null,
  };

  try {
    const record = await prisma.rampTransaction.upsert({
      where: { network_provider_anchorTxId: { network, provider, anchorTxId } },
      create: { network, provider, direction, address, anchorTxId, assetCode, ...mutable },
      update: mutable,
    });
    return NextResponse.json({ id: record.id });
  } catch (error) {
    log.error('ramp upsert failed', error);
    return NextResponse.json({ error: 'Could not save the transaction' }, { status: 500 });
  }
}
