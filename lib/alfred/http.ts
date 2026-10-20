// Shared plumbing for the /api/stellar/ramp/alfred/* routes: rate limiting,
// wallet-proof gating, corridor resolution and a single error mapping, so each
// route file is just its own logic.

import { NextResponse } from 'next/server';
import type { ZodSchema } from 'zod';
import { ALFRED_NETWORK, getCorridor, type AlfredCorridor } from '@/config/alfred';
import { getNetworkProfile, type StellarNetworkProfile } from '@/config/stellar';
import { rateLimit, rateLimitHeaders } from '@/lib/ratelimit';
import { getLogger } from '@/lib/logger';
import { AlfredError, isAlfredConfigured } from './client';
import { readSession } from './session';

const log = getLogger('api:alfred');

/** Network Alfred settles USDC on. */
export const alfredNetwork = ALFRED_NETWORK;
export const alfredProfile = (): StellarNetworkProfile => getNetworkProfile(ALFRED_NETWORK);

export const jsonError = (message: string, status: number) => NextResponse.json({ error: message }, { status });

/**
 * Rate limit, then require a proven wallet. These routes expose personal data
 * (email, KYC state, masked bank account), so — unlike the SEP-24 mirror —
 * knowing an address is not enough to read or write it.
 */
export async function requireWallet(
  request: Request,
  key: string,
  limit = 30,
): Promise<{ address: string } | NextResponse> {
  const throttle = await rateLimit(request, { key: `api:alfred:${key}`, limit, windowSec: 60 });
  if (!throttle.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rateLimitHeaders(throttle) });
  }
  if (!isAlfredConfigured()) return jsonError('Alfred is not configured on this environment', 503);

  const address = readSession(request);
  if (!address) return jsonError('Wallet proof required', 401);
  return { address };
}

/** Corridor from a query string or body, restricted to the known registry. */
export function requireCorridor(value: unknown): AlfredCorridor | NextResponse {
  const corridor = typeof value === 'string' ? getCorridor(value) : undefined;
  if (!corridor) return jsonError('Unknown corridor', 400);
  return corridor;
}

export async function parseBody<T>(request: Request, schema: ZodSchema<T>): Promise<T | NextResponse> {
  const raw = await request.json().catch(() => null);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? 'Invalid request', 400);
  return parsed.data;
}

export const isResponse = (value: unknown): value is NextResponse => value instanceof NextResponse;

/**
 * Maps a failure to a response. Alfred's own 4xx messages are user-facing
 * (a rejected CLABE, an expired quote, an insufficient balance); anything else
 * is logged and hidden.
 */
export function handleError(scope: string, error: unknown): NextResponse {
  if (error instanceof AlfredError) {
    // Alfred's own 401 means OUR credentials are wrong — never let it reach the
    // browser as a 401, which the panel reads as "wallet proof expired".
    if (error.status >= 400 && error.status < 500 && error.status !== 401) {
      return jsonError(error.message, error.status);
    }
    log.error(`${scope} failed`, error);
    return jsonError('Alfred could not process this request', 502);
  }
  log.error(`${scope} failed`, error);
  return jsonError('Unexpected error', 500);
}
