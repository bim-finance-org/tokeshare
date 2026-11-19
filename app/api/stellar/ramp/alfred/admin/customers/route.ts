// Operator console: Alfred customers, those still awaiting identity
// verification first. Dashboard session only.

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-utils';
import { handleError } from '@/lib/alfred/http';
import { listCustomersForAdmin } from '@/lib/alfred/offramp';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    return NextResponse.json(await listCustomersForAdmin());
  } catch (error) {
    return handleError('alfred admin customers', error);
  }
}
