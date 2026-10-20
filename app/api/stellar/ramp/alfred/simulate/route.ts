// Sandbox only: credits the customer's Alfred balance through Alfred's deposit
// simulator. Sandbox accounts cannot receive real funds, so this is the only
// way to exercise the payout leg there. Refused unless ALFRED_API_ENV=sandbox
// (and the path 404s on Alfred's production host anyway).

import { NextResponse } from 'next/server';
import { isAlfredSandbox } from '@/lib/alfred/client';
import {
  alfredNetwork,
  handleError,
  isResponse,
  jsonError,
  parseBody,
  requireCorridor,
  requireWallet,
} from '@/lib/alfred/http';
import { simulateFunding } from '@/lib/alfred/offramp';
import { AlfredAmountSchema } from '@/lib/schemas/alfred';

export async function POST(request: Request) {
  if (!isAlfredSandbox()) return jsonError('Not found', 404);

  const wallet = await requireWallet(request, 'simulate', 10);
  if (isResponse(wallet)) return wallet;

  const body = await parseBody(request, AlfredAmountSchema);
  if (isResponse(body)) return body;

  const corridor = requireCorridor(body.corridor);
  if (isResponse(corridor)) return corridor;

  try {
    await simulateFunding({ network: alfredNetwork, address: wallet.address, corridor, amount: body.amount });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError('alfred simulated deposit', error);
  }
}
