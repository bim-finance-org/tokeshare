import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { sendTransactionEmail } from '@/utils/email/sendEmail';
import { requireAuth } from '@/lib/api-utils';
import { FEES, DECIMALS_FIXED_TO_FOUR } from '@/constants/api';

const REQUIRED_FIELDS = ['walletAddress', 'blockchain', 'crypto', 'cryptoAmount', 'email', 'fiat', 'fiatAmount', 'ref'];

function hasRequiredFields(data: any) {
  return REQUIRED_FIELDS.every((field) => data[field]);
}

/**
 * GET to retrieve all buy transactions
 * @param _request - The request object
 * @returns The buy transactions
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const buyTransactions = await prisma.buyTransaction.findMany({
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(buyTransactions);
  } catch (error) {
    return NextResponse.json({ error: 'Error retrieving transactions' }, { status: 500 });
  }
}

/**
 * POST to create a new buy transaction
 * @param request - The request object
 * @returns The new buy transaction
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    if (!hasRequiredFields(data)) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    const amount = parseFloat(data.amount);
    const fees =
      data.fees !== undefined
        ? parseFloat(data.fees.toString())
        : parseFloat((amount * FEES).toFixed(DECIMALS_FIXED_TO_FOUR));

    const newTransaction = await prisma.buyTransaction.create({
      data: {
        ref: data.ref,
        date: new Date(),
        email: data.email,
        fullName: data.fullName || '',
        cvu: data.cvu || '',
        walletAddress: data.walletAddress,
        status: data.status || 'pending',
        blockchain: data.blockchain,
        fiat: data.fiat,
        fiatAmount: data.fiatAmount,
        crypto: data.crypto,
        cryptoAmount: data.cryptoAmount,
        fees,
      },
    });

    try {
      await sendTransactionEmail({
        email: data.email,
        fullName: data.fullName,
        transactionRef: newTransaction.ref,
        transactionType: 'buy',
        date: newTransaction.date.toLocaleDateString(),
        blockchain: data.blockchain,
        fiatSymbol: data.fiat,
        fiatAmount: data.fiatAmount,
        tokenSymbol: data.crypto,
        tokenAmount: data.cryptoAmount,
        walletAddress: data.walletAddress,
      });
    } catch (emailError) {
      return NextResponse.json({ error: 'Error sending confirmation email' }, { status: 500 });
    }

    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error creating buy transaction' }, { status: 500 });
  }
}
