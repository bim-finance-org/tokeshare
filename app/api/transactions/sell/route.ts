import { NextResponse, NextRequest, after } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendTransactionEmail } from '@/utils/email/sendEmail';
import { requireAuth } from '@/lib/api-utils';
import { rateLimit, rateLimitHeaders } from '@/lib/ratelimit';
import { SellTxSchema } from '@/lib/schemas/transactions';
import { getLogger } from '@/lib/logger';
import { DECIMALS_FIXED_TO_TWO, FEES } from '@/constants/api';

const log = getLogger('api:tx:sell');

export async function GET(_request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const sellTransactions = await prisma.sellTransaction.findMany({
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(sellTransactions);
  } catch {
    return NextResponse.json({ error: 'Error retrieving sell transactions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const limit = await rateLimit(request, { key: 'tx:sell', limit: 5, windowSec: 60 });
  if (!limit.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = SellTxSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', issues: parsed.error.flatten() },
      { status: 422 },
    );
  }
  const data = parsed.data;
  const fees = data.fees ?? Number((data.fiatAmount * FEES).toFixed(DECIMALS_FIXED_TO_TWO));

  try {
    const newTransaction = await prisma.sellTransaction.create({
      data: {
        ref: data.ref,
        date: new Date(),
        email: data.email,
        fullName: data.fullName,
        iban: data.paymentMethod === 'bank_transfer' ? data.iban : null,
        status: data.status ?? 'pending',
        blockchain: data.blockchain,
        fiat: data.fiat,
        fiatAmount: data.fiatAmount,
        crypto: data.crypto,
        cryptoAmount: data.cryptoAmount,
        fees,
        paymentMethod: data.paymentMethod,
        walletAddress: data.paymentMethod === 'usdc_transfer' ? data.walletAddress : data.walletAddress ?? null,
        txHash: data.paymentMethod === 'usdc_transfer' ? data.txHash : null,
      },
    });

    after(async () => {
      try {
        await sendTransactionEmail({
          email: data.email,
          fullName: data.fullName,
          transactionRef: newTransaction.ref,
          transactionType: 'sell',
        });
      } catch (emailError) {
        log.error('confirmation email failed', { ref: newTransaction.ref, emailError });
      }
    });

    return NextResponse.json(newTransaction, { status: 201, headers: rateLimitHeaders(limit) });
  } catch (error) {
    log.error('create transaction failed', error);
    return NextResponse.json({ error: 'Error creating sell transaction' }, { status: 500 });
  }
}
