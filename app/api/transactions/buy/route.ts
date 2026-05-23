import { NextResponse, NextRequest, after } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendTransactionEmail } from '@/utils/email/sendEmail';
import { requireAuth } from '@/lib/api-utils';
import { rateLimit, rateLimitHeaders } from '@/lib/ratelimit';
import { BuyTxSchema } from '@/lib/schemas/transactions';
import { FEES, DECIMALS_FIXED_TO_FOUR } from '@/constants/api';

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
  } catch {
    return NextResponse.json({ error: 'Error retrieving transactions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const limit = await rateLimit(request, { key: 'tx:buy', limit: 5, windowSec: 60 });
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

  const parsed = BuyTxSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', issues: parsed.error.flatten() },
      { status: 422 },
    );
  }
  const data = parsed.data;

  const baseAmount = data.amount ?? data.fiatAmount;
  const fees = data.fees ?? Number((baseAmount * FEES).toFixed(DECIMALS_FIXED_TO_FOUR));

  try {
    const newTransaction = await prisma.buyTransaction.create({
      data: {
        ref: data.ref,
        date: new Date(),
        email: data.email,
        fullName: data.fullName,
        cvu: data.cvu,
        walletAddress: data.walletAddress,
        status: data.status ?? 'pending',
        blockchain: data.blockchain,
        fiat: data.fiat,
        fiatAmount: data.fiatAmount,
        crypto: data.crypto,
        cryptoAmount: data.cryptoAmount,
        fees,
      },
    });

    after(async () => {
      try {
        await sendTransactionEmail({
          email: data.email,
          fullName: data.fullName,
          transactionRef: newTransaction.ref,
          transactionType: 'buy',
          date: newTransaction.date.toLocaleDateString(),
          blockchain: data.blockchain,
          fiatSymbol: data.fiat,
          fiatAmount: String(data.fiatAmount),
          tokenSymbol: data.crypto,
          tokenAmount: String(data.cryptoAmount),
          walletAddress: data.walletAddress,
        });
      } catch (emailError) {
        console.error('[buy] confirmation email failed', { ref: newTransaction.ref, emailError });
      }
    });

    return NextResponse.json(newTransaction, { status: 201, headers: rateLimitHeaders(limit) });
  } catch (error) {
    console.error('[buy] create transaction failed', error);
    return NextResponse.json({ error: 'Error creating buy transaction' }, { status: 500 });
  }
}
