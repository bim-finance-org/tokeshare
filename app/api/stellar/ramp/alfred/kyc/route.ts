// Mints Alfred's hosted onboarding link for the proven wallet.
//
// This is the whole point of the integration's shape: the user's identity
// fields, ID photos and selfie are entered on Alfred's page, so the only thing
// crossing our servers is the URL itself. A new link supersedes the previous
// one, which is why this is a POST.

import { NextResponse } from 'next/server';
import { alfredNetwork, handleError, isResponse, requireCorridor, requireWallet } from '@/lib/alfred/http';
import { startKyc } from '@/lib/alfred/offramp';

export async function POST(request: Request) {
  const wallet = await requireWallet(request, 'kyc', 20);
  if (isResponse(wallet)) return wallet;

  const corridor = requireCorridor(new URL(request.url).searchParams.get('corridor'));
  if (isResponse(corridor)) return corridor;

  try {
    const link = await startKyc(alfredNetwork, wallet.address, corridor);
    return NextResponse.json(link);
  } catch (error) {
    return handleError('alfred onboarding link', error);
  }
}
