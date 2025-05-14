import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sendTransactionEmail } from '@/app/utils/email/sendEmail';

/**
 * GET to retrieve all sell transactions
 * @param request - The request object
 * @returns The sell transactions
 */
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    
    // If no session, return 401 Unauthorized
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }
    
    const sellTransactions = await prisma.sellTransaction.findMany({
      orderBy: {
        date: 'desc'
      }
    });
    
    return NextResponse.json(sellTransactions);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error retrieving sell transactions' },
      { status: 500 }
    );
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

    if (!data.iban || !data.blockchain || !data.crypto || !data.cryptoAmount || !data.fiat || !data.fiatAmount || !data.email || !data.fullName || !data.ref) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    const fiatAmount = parseFloat(data.fiatAmount);
    const fees = data.fees !== undefined 
      ? parseFloat(data.fees) 
      : parseFloat((fiatAmount * 0.025).toFixed(2));
    
    const newTransaction = await prisma.sellTransaction.create({
      data: {
        ref: data.ref,
        date: new Date(),
        email: data.email,
        fullName: data.fullName,
        iban: data.iban,
        status: data.status || 'pending',
        blockchain: data.blockchain,
        fiat: data.fiat,
        fiatAmount: data.fiatAmount,
        crypto: data.crypto,
        cryptoAmount: data.cryptoAmount,
        fees: fees
      }
    });
    
    try {
      await sendTransactionEmail({
        email: data.email,
        fullName: data.fullName,
        transactionRef: newTransaction.ref,
        transactionType: 'sell'
      });
    } catch (emailError) {
      return NextResponse.json(
        { error: 'Error sending confirmation email' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error creating sell transaction' },
      { status: 500 }
    );
  }
} 