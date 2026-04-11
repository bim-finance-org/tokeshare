import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, validateId, validateCryptoAmount } from '@/lib/api-utils';
import { DECIMALS_FIXED_TO_TWO, FEES, TFT_001_SELL_FEES } from '@/constants/api';

const ADMIN_SETTABLE_STATUS = ['pending', 'received', 'completed', 'failed'] as const;
type AdminStatus = (typeof ADMIN_SETTABLE_STATUS)[number];

function isAdminStatus(value: unknown): value is AdminStatus {
  return typeof value === 'string' && (ADMIN_SETTABLE_STATUS as readonly string[]).includes(value);
}

/**
 * PATCH to update a sell transaction (status and/or cryptoAmount atomically).
 * Fees are recomputed whenever cryptoAmount changes.
 */
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const id = validateId((await context.params).id);
    if (!id) {
      return NextResponse.json({ error: 'Invalid transaction ID' }, { status: 400 });
    }

    const body = await request.json();
    const { status, cryptoAmount } = body ?? {};

    if (status === undefined && cryptoAmount === undefined) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    if (status !== undefined && !isAdminStatus(status)) {
      return NextResponse.json(
        { error: `Invalid status. Allowed values are: ${ADMIN_SETTABLE_STATUS.join(', ')}` },
        { status: 400 },
      );
    }

    const transaction = await prisma.sellTransaction.findUnique({ where: { id } });
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const data: {
      status?: AdminStatus;
      cryptoAmount?: number;
      fees?: number;
    } = {};

    if (status !== undefined) {
      data.status = status;
    }

    if (cryptoAmount !== undefined) {
      const validAmount = validateCryptoAmount(Number(cryptoAmount));
      if (!validAmount) {
        return NextResponse.json({ error: 'Invalid amount. Must be a positive number.' }, { status: 400 });
      }
      data.cryptoAmount = validAmount;

      // Recompute fees on the new fiat value so the admin UI stays consistent.
      const feesCoef = transaction.crypto === 'TFT_001' ? TFT_001_SELL_FEES : FEES;
      const fiatAmount = Number(transaction.fiatAmount);
      data.fees = parseFloat((fiatAmount * feesCoef).toFixed(DECIMALS_FIXED_TO_TWO));
    }

    const updated = await prisma.sellTransaction.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating sell transaction:', error);
    return NextResponse.json({ error: 'Error updating transaction' }, { status: 500 });
  }
}
