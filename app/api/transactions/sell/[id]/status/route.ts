import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, validateId, validateStatus } from '@/lib/api-utils';
import { ALLOWED_STATUS } from '@/constants/api';

/**
 * PUT to update the status of a sell transaction
 * @param request - The request object
 * @param params - The parameters object
 * @returns The updated transaction
 */
export async function PUT(request: NextRequest, { params }: { params: any }) {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const id = validateId(params.id);
    if (!id) {
      return NextResponse.json({ error: 'Invalid transaction ID' }, { status: 400 });
    }

    const { status } = await request.json();
    if (!validateStatus(status)) {
      return NextResponse.json(
        { error: `Invalid status. Allowed values are: ${ALLOWED_STATUS.join(', ')}` },
        { status: 400 },
      );
    }

    const transaction = await prisma.sellTransaction.findUnique({ where: { id } });
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const updatedTransaction = await prisma.sellTransaction.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    return NextResponse.json({ error: 'Error updating transaction status' }, { status: 500 });
  }
}
