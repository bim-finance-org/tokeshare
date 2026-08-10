// CORS helpers for the deliberately public, unauthenticated endpoints (the
// token catalog under /api/tokens). Everything else on the API stays same-origin.

import { NextResponse } from 'next/server';

export const PUBLIC_CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

/** JSON response carrying the public CORS headers, plus any extra headers given. */
export function publicJson(body: unknown, init: { status?: number; headers?: Record<string, string> } = {}) {
  return NextResponse.json(body, {
    status: init.status ?? 200,
    headers: { ...PUBLIC_CORS_HEADERS, ...(init.headers ?? {}) },
  });
}

/** Preflight answer — mirrors PUBLIC_CORS_HEADERS with no body. */
export function publicPreflight() {
  return new Response(null, { status: 204, headers: PUBLIC_CORS_HEADERS });
}
