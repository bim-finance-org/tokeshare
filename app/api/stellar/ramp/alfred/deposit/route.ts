// Funding the Alfred balance: where to send USDC, and the record of having sent it.
//
// GET returns the customer's permanent Stellar deposit address and memo, read
// live from Alfred every time (the mirror is history, never a destination).
// POST records the on-chain payment hash once the wallet has paid, so the
// history shows it until Alfred credits it.

import { NextResponse } from 'next/server';
import { alfredNetwork, handleError, isResponse, parseBody, requireCorridor, requireWallet } from '@/lib/alfred/http';
import { readDepositInstructions, recordDeposit } from '@/lib/alfred/offramp';
import { AlfredDepositSchema } from '@/lib/schemas/alfred';

export async function GET(request: Request) {
  const wallet = await requireWallet(request, 'deposit:get', 30);
  if (isResponse(wallet)) return wallet;

  const corridor = requireCorridor(new URL(request.url).searchParams.get('corridor'));
  if (isResponse(corridor)) return corridor;

  try {
    const instructions = await readDepositInstructions(alfredNetwork, wallet.address, corridor);
    return NextResponse.json({ instructions });
  } catch (error) {
    return handleError('alfred deposit instructions', error);
  }
}

export async function POST(request: Request) {
  const wallet = await requireWallet(request, 'deposit:post', 20);
  if (isResponse(wallet)) return wallet;

  const body = await parseBody(request, AlfredDepositSchema);
  if (isResponse(body)) return body;

  const corridor = requireCorridor(body.corridor);
  if (isResponse(corridor)) return corridor;

  try {
    await recordDeposit({
      network: alfredNetwork,
      address: wallet.address,
      corridor,
      hash: body.hash,
      amount: body.amount,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError('alfred deposit record', error);
  }
}
