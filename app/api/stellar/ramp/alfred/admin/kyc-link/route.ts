// Operator console: relays the verification link copied from Alfred's
// dashboard to the user (stored for the panel, then emailed). Alfred has no API
// to mint that link, so this is the one manual step of the off-ramp.

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-utils';
import { handleError, jsonError } from '@/lib/alfred/http';
import { setKycLink } from '@/lib/alfred/offramp';
import { AlfredKycLinkSchema } from '@/lib/schemas/alfred';

export async function POST(request: Request) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = AlfredKycLinkSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? 'Invalid request', 400);

  try {
    return NextResponse.json(await setKycLink(parsed.data));
  } catch (error) {
    return handleError('alfred admin kyc link', error);
  }
}
