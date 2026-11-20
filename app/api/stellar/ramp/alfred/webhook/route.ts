// Alfred webhook receiver — the nominal channel for customer, destination,
// deposit and payout status.
//
// Alfred's rules for an endpoint: answer 2xx first and work afterwards, never
// fail on an event type you do not handle, expect duplicates. So the response
// goes out as soon as the body yields an event id, and the work runs in
// `after()`: the event is fetched back from Alfred with our credentials (the
// body itself is never trusted — see lib/alfred/webhook.ts) and applied by
// re-reading the resource it names, which makes duplicates and out-of-order
// deliveries harmless. A missed event stays recoverable through the panel's
// pull-side refreshes.

import { after, NextResponse } from 'next/server';
import { getLogger } from '@/lib/logger';
import { rateLimit, rateLimitHeaders } from '@/lib/ratelimit';
import { AlfredError, getEvent, isAlfredConfigured } from '@/lib/alfred/client';
import { applyEvent } from '@/lib/alfred/offramp';
import { readEventId } from '@/lib/alfred/webhook';

const log = getLogger('api:alfred-webhook');

export async function POST(request: Request) {
  const throttle = await rateLimit(request, { key: 'api:alfred:webhook', limit: 300, windowSec: 60 });
  if (!throttle.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rateLimitHeaders(throttle) });
  }
  if (!isAlfredConfigured()) return NextResponse.json({ error: 'Not configured' }, { status: 503 });

  const eventId = readEventId(await request.text());
  if (!eventId) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  after(async () => {
    try {
      await applyEvent(await getEvent(eventId));
    } catch (error) {
      if (error instanceof AlfredError && error.status === 404) {
        log.warn(`dropped a delivery for unknown event ${eventId}`);
        return;
      }
      log.error(`processing Alfred event ${eventId} failed`, error);
    }
  });
  return NextResponse.json({ ok: true });
}
