// Wallet proof for the Alfred routes.
//
// GET returns a challenge transaction (sequence 0 — unsubmittable by
// construction), POST exchanges the wallet's signature for a short-lived
// httpOnly cookie, DELETE drops it. Same idea as SEP-10, except the verifier
// is us rather than an anchor.

import { NextResponse } from 'next/server';
import { rateLimit, rateLimitHeaders } from '@/lib/ratelimit';
import { alfredProfile, handleError, isResponse, jsonError, parseBody } from '@/lib/alfred/http';
import { buildChallengeXdr, issueSession, sessionCookie, verifyChallenge, SESSION_COOKIE } from '@/lib/alfred/session';
import { AlfredSessionSchema, StellarAddressSchema } from '@/lib/schemas/alfred';

export async function GET(request: Request) {
  const throttle = await rateLimit(request, { key: 'api:alfred:challenge', limit: 30, windowSec: 60 });
  if (!throttle.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rateLimitHeaders(throttle) });
  }

  const address = StellarAddressSchema.safeParse(new URL(request.url).searchParams.get('address'));
  if (!address.success) return jsonError('Invalid address', 400);

  try {
    return NextResponse.json({ xdr: buildChallengeXdr(alfredProfile(), address.data) });
  } catch (error) {
    return handleError('alfred challenge', error);
  }
}

export async function POST(request: Request) {
  const throttle = await rateLimit(request, { key: 'api:alfred:session', limit: 20, windowSec: 60 });
  if (!throttle.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rateLimitHeaders(throttle) });
  }

  const body = await parseBody(request, AlfredSessionSchema);
  if (isResponse(body)) return body;

  try {
    const proven = verifyChallenge(alfredProfile(), body.xdr, body.address);
    if (!proven) return jsonError('Invalid signature', 401);

    const session = issueSession(proven);
    const response = NextResponse.json({ address: proven });
    response.headers.set('Set-Cookie', sessionCookie(session.token, session.maxAge));
    return response;
  } catch (error) {
    return handleError('alfred session', error);
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.headers.set('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  return response;
}
