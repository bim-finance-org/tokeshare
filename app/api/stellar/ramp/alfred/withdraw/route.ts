// Executes the fiat payout a quote prices: Alfred debits the USDC balance,
// converts it inside the payout and sends the bank transfer. Only the quote id
// comes from the browser — amounts are re-read from Alfred server-side.

import { NextResponse } from 'next/server';
import { alfredNetwork, handleError, isResponse, parseBody, requireCorridor, requireWallet } from '@/lib/alfred/http';
import { executeWithdrawal } from '@/lib/alfred/offramp';
import { AlfredWithdrawSchema } from '@/lib/schemas/alfred';

export async function POST(request: Request) {
  const wallet = await requireWallet(request, 'withdraw', 10);
  if (isResponse(wallet)) return wallet;

  const body = await parseBody(request, AlfredWithdrawSchema);
  if (isResponse(body)) return body;

  const corridor = requireCorridor(body.corridor);
  if (isResponse(corridor)) return corridor;

  try {
    const payout = await executeWithdrawal({
      network: alfredNetwork,
      address: wallet.address,
      corridor,
      quoteId: body.quoteId,
    });
    return NextResponse.json({ payout });
  } catch (error) {
    return handleError('alfred payout', error);
  }
}
