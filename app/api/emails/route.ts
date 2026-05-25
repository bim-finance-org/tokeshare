import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { rateLimit, rateLimitHeaders } from '@/lib/ratelimit';
import { EmailSubscriptionSchema } from '@/lib/schemas/transactions';
import { getLogger } from '@/lib/logger';

const log = getLogger('api:emails');
const EMAIL_ALREADY_EXISTS_CODE = 'P2002';

async function saveEmail(email: string) {
  try {
    await prisma.emails.create({ data: { email } });
    return { success: true };
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError && e.code === EMAIL_ALREADY_EXISTS_CODE) {
      return { success: true };
    }
    log.error('persist failed', e);
    return { success: false };
  }
}

export async function POST(request: Request) {
  const limit = await rateLimit(request, { key: 'emails:subscribe', limit: 10, windowSec: 60 });
  if (!limit.success) {
    return NextResponse.json(
      { success: false, error: 'Too many requests' },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = EmailSubscriptionSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid email' }, { status: 422 });
  }

  const result = await saveEmail(parsed.data.email);
  return NextResponse.json(
    { success: result.success },
    { status: result.success ? 200 : 500, headers: rateLimitHeaders(limit) },
  );
}
