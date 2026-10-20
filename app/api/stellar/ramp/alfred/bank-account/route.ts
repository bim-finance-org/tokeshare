// Registers the payout bank account with Alfred.
//
// The only end-user detail the app has to handle itself — Alfred exposes no
// hosted form for it. It is forwarded straight to Alfred and never persisted
// in full: the row keeps the returned destination id and the last four digits.

import { NextResponse } from 'next/server';
import {
  alfredNetwork,
  handleError,
  isResponse,
  jsonError,
  parseBody,
  requireCorridor,
  requireWallet,
} from '@/lib/alfred/http';
import { registerBankAccount } from '@/lib/alfred/offramp';
import { AlfredBankAccountSchema } from '@/lib/schemas/alfred';

export async function POST(request: Request) {
  const wallet = await requireWallet(request, 'bank-account', 10);
  if (isResponse(wallet)) return wallet;

  const body = await parseBody(request, AlfredBankAccountSchema);
  if (isResponse(body)) return body;

  const corridor = requireCorridor(body.corridor);
  if (isResponse(corridor)) return corridor;

  // Shape of the identifier is corridor-specific (18-digit CLABE, 11-digit CPF…).
  if (!new RegExp(corridor.account.pattern).test(body.identifier)) {
    return jsonError(`Invalid ${corridor.account.label}`, 400);
  }
  if (corridor.account.requiresTaxId && !body.holderTaxId) {
    return jsonError('A tax id is required for this corridor', 400);
  }

  try {
    const onboarding = await registerBankAccount({
      network: alfredNetwork,
      address: wallet.address,
      corridor,
      identifier: body.identifier,
      holderName: body.holderName,
      holderTaxId: body.holderTaxId,
    });
    return NextResponse.json({ onboarding });
  } catch (error) {
    return handleError('alfred bank account', error);
  }
}
