import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/app/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// PUT to update the amount of a sell transaction
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid transaction ID' },
        { status: 400 }
      );
    }

    const data = await request.json();
    
    // Data validation
    if (data.amount === undefined || isNaN(parseFloat(data.amount)) || parseFloat(data.amount) <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be a positive number.' },
        { status: 400 }
      );
    }
    
    // Check if transaction exists
    const transaction = await prisma.sellTransaction.findUnique({
      where: { id }
    });
    
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }
    
    // Update transaction amount
    const updatedTransaction = await prisma.sellTransaction.update({
      where: { id },
      data: { 
        amount: parseFloat(data.amount)
      }
    });
    
    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error('Error updating transaction amount:', error);
    return NextResponse.json(
      { error: 'Error updating transaction amount' },
      { status: 500 }
    );
  }
} 