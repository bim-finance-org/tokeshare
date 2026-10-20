// Alfred onboarding state for the proven wallet, and its creation.
//
// GET re-reads the customer, its endorsements and its payout destination from
// Alfred until everything is ready, so the panel is correct even when a webhook
// was missed. Only masked data leaves the server: the payout account is reduced
// to its last digits, and identity data never existed here in the first place —
// Alfred's hosted onboarding holds it.

import { NextResponse } from 'next/server';
import { alfredNetwork, handleError, isResponse, parseBody, requireCorridor, requireWallet } from '@/lib/alfred/http';
import { getOnboarding, refreshOnboarding, startOnboarding } from '@/lib/alfred/offramp';
import { AlfredOnboardingSchema } from '@/lib/schemas/alfred';

const SETTLED_STATUSES = new Set(['REJECTED', 'OFFBOARDED']);

export async function GET(request: Request) {
  const wallet = await requireWallet(request, 'customer:get', 60);
  if (isResponse(wallet)) return wallet;

  const corridor = requireCorridor(new URL(request.url).searchParams.get('corridor'));
  if (isResponse(corridor)) return corridor;

  try {
    const existing = await getOnboarding(alfredNetwork, wallet.address, corridor);
    if (!existing) return NextResponse.json({ onboarding: null });

    const refreshed =
      existing.ready || SETTLED_STATUSES.has(existing.status)
        ? existing
        : await refreshOnboarding(alfredNetwork, wallet.address, corridor);
    return NextResponse.json({ onboarding: refreshed });
  } catch (error) {
    return handleError('alfred onboarding read', error);
  }
}

export async function POST(request: Request) {
  const wallet = await requireWallet(request, 'customer:post', 10);
  if (isResponse(wallet)) return wallet;

  const body = await parseBody(request, AlfredOnboardingSchema);
  if (isResponse(body)) return body;

  const corridor = requireCorridor(body.corridor);
  if (isResponse(corridor)) return corridor;

  try {
    const onboarding = await startOnboarding({
      network: alfredNetwork,
      address: wallet.address,
      corridor,
      email: body.email,
    });
    return NextResponse.json({ onboarding });
  } catch (error) {
    return handleError('alfred onboarding', error);
  }
}
