import { describe, it, expect, vi } from 'vitest';

// Force the in-memory fallback path (no Redis) for deterministic tests.
vi.mock('@/lib/redis', () => ({ redisClient: null }));

import { rateLimit, rateLimitHeaders } from './ratelimit';

const req = new Request('http://localhost');
const opts = (identifier: string, limit = 3) => ({ key: 'test', limit, windowSec: 60, identifier });

describe('rateLimit (memory fallback)', () => {
  it('allows up to the limit then blocks', async () => {
    const id = 'user-a';
    const r1 = await rateLimit(req, opts(id));
    const r2 = await rateLimit(req, opts(id));
    const r3 = await rateLimit(req, opts(id));
    const r4 = await rateLimit(req, opts(id));

    expect(r1.success).toBe(true);
    expect(r1.remaining).toBe(2);
    expect(r3.success).toBe(true);
    expect(r3.remaining).toBe(0);
    expect(r4.success).toBe(false);
    expect(r4.remaining).toBe(0);
  });

  it('tracks identifiers independently', async () => {
    const a = await rateLimit(req, opts('ind-a', 1));
    const b = await rateLimit(req, opts('ind-b', 1));
    expect(a.success).toBe(true);
    expect(b.success).toBe(true);
  });

  it('resets in the future', async () => {
    const r = await rateLimit(req, opts('reset-user'));
    expect(r.reset).toBeGreaterThan(Date.now());
  });
});

describe('rateLimitHeaders', () => {
  it('omits Retry-After when successful', () => {
    const h = rateLimitHeaders({ success: true, limit: 10, remaining: 9, reset: Date.now() + 60_000 });
    expect(h['X-RateLimit-Limit']).toBe('10');
    expect(h['X-RateLimit-Remaining']).toBe('9');
    expect(h['Retry-After']).toBeUndefined();
  });

  it('includes Retry-After when blocked', () => {
    const h = rateLimitHeaders({ success: false, limit: 10, remaining: 0, reset: Date.now() + 30_000 });
    expect(Number(h['Retry-After'])).toBeGreaterThan(0);
  });
});
