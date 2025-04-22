import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/app/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// PUT to update the status of a buy transaction
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
    if (!data.status || !['pending', 'completed', 'failed', 'receipt'].includes(data.status)) {
      return NextResponse.json(
        { error: 'Invalid status. Allowed values are: pending, completed, failed, receipt' },
        { status: 400 }
      );
    }
    
    // Check if transaction exists
    const transaction = await prisma.buyTransaction.findUnique({
      where: { id }
    });
    
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }
    
    // Update transaction status
    const updatedTransaction = await prisma.buyTransaction.update({
      where: { id },
      data: { 
        status: data.status 
      }
    });
    
    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error('Error updating transaction status:', error);
    return NextResponse.json(
      { error: 'Error updating transaction status' },
      { status: 500 }
    );
  }
} 