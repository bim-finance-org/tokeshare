import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendTransactionEmail } from '@/utils/email/sendEmail';
import { requireAuth } from '@/lib/api-utils';
import { DECIMALS_FIXED_TO_TWO, FEES } from '@/constants/api';

const BASE_REQUIRED_FIELDS = ['blockchain', 'crypto', 'cryptoAmount', 'fiat', 'fiatAmount', 'email', 'fullName', 'ref'];

function hasRequiredFields(data: any) {
  const baseValid = BASE_REQUIRED_FIELDS.every((field) => data[field]);
  if (!baseValid) return false;

  if (data.paymentMethod === 'usdc_transfer') {
    return !!data.walletAddress && !!data.txHash;
  }
  return !!data.iban;
}

/**
 * GET to retrieve all sell transactions
 * @param request - The request object
 * @returns The sell transactions
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const sellTransactions = await prisma.sellTransaction.findMany({
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(sellTransactions);
  } catch (error) {
    return NextResponse.json({ error: 'Error retrieving sell transactions' }, { status: 500 });
  }
}

/**
 * POST to create a new sell transaction
 * @param request - The request object
 * @returns The new sell transaction
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    if (!hasRequiredFields(data)) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    const fiatAmount = parseFloat(data.fiatAmount);
    const fees =
      data.fees !== undefined ? parseFloat(data.fees) : parseFloat((fiatAmount * FEES).toFixed(DECIMALS_FIXED_TO_TWO));

    const newTransaction = await prisma.sellTransaction.create({
      data: {
        ref: data.ref,
        date: new Date(),
        email: data.email,
        fullName: data.fullName,
        iban: data.iban || null,
        status: data.status || 'pending',
        blockchain: data.blockchain,
        fiat: data.fiat,
        fiatAmount: data.fiatAmount,
        crypto: data.crypto,
        cryptoAmount: data.cryptoAmount,
        fees: fees,
        paymentMethod: data.paymentMethod || 'bank_transfer',
        walletAddress: data.walletAddress || null,
        txHash: data.txHash || null,
      },
    });

    try {
      await sendTransactionEmail({
        email: data.email,
        fullName: data.fullName,
        transactionRef: newTransaction.ref,
        transactionType: 'sell',
      });
    } catch (emailError) {
      return NextResponse.json({ error: 'Error sending confirmation email' }, { status: 500 });
    }

    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error creating sell transaction' }, { status: 500 });
  }
}
