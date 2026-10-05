// The customer's USDC balance at Alfred. Only `available` can fund a payout;
// `pending` is money that arrived but has not settled yet. Also nudges any
// payout still in flight, as the pull-side fallback to webhooks.

import { NextResponse } from 'next/server';
import { alfredNetwork, handleError, isResponse, requireCorridor, requireWallet } from '@/lib/alfred/http';
import { readBalance, refreshPayouts } from '@/lib/alfred/offramp';

export async function GET(request: Request) {
  const wallet = await requireWallet(request, 'balance', 60);
  if (isResponse(wallet)) return wallet;

  const corridor = requireCorridor(new URL(request.url).searchParams.get('corridor'));
  if (isResponse(corridor)) return corridor;

  try {
    const [balance] = await Promise.all([
      readBalance(alfredNetwork, wallet.address, corridor),
      refreshPayouts(alfredNetwork, wallet.address),
    ]);
    return NextResponse.json({ balance });
  } catch (error) {
    return handleError('alfred balance', error);
  }
}
