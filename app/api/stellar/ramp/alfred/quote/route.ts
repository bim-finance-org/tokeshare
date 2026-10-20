// Exchange rate for a payout. Alfred's quotes expire in about two minutes, so
// the panel asks for one only once the USDC is available, right before paying.

import { NextResponse } from 'next/server';
import { alfredNetwork, handleError, isResponse, parseBody, requireCorridor, requireWallet } from '@/lib/alfred/http';
import { quoteWithdrawal } from '@/lib/alfred/offramp';
import { AlfredAmountSchema } from '@/lib/schemas/alfred';

export async function POST(request: Request) {
  const wallet = await requireWallet(request, 'quote', 60);
  if (isResponse(wallet)) return wallet;

  const body = await parseBody(request, AlfredAmountSchema);
  if (isResponse(body)) return body;

  const corridor = requireCorridor(body.corridor);
  if (isResponse(corridor)) return corridor;

  try {
    const quote = await quoteWithdrawal({
      network: alfredNetwork,
      address: wallet.address,
      corridor,
      amount: body.amount,
    });
    return NextResponse.json({ quote });
  } catch (error) {
    return handleError('alfred quote', error);
  }
}
