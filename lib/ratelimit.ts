import { redisClient } from '@/lib/redis';

const MEMORY_CACHE_MAX = 5_000;
const memoryStore = new Map<string, { count: number; expiresAt: number }>();

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  const real = request.headers.get('x-real-ip');
  if (real) return real.trim();
  return 'unknown';
}

export interface RateLimitOptions {
  /** Logical bucket name, e.g. `tx:buy`. */
  key: string;
  /** Maximum hits allowed inside the window. */
  limit: number;
  /** Window length in seconds. */
  windowSec: number;
  /** Optional explicit identifier (falls back to client IP). */
  identifier?: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  /** Unix-ms timestamp when the current window resets. */
  reset: number;
}

// Evict by expiry, not insertion order: purge everything already expired, and
// only if still at capacity drop the entry that expires soonest (it resets
// first, so it's the least useful to keep). This stops an attacker from
// flooding fresh keys to evict their own still-active limiter.
function evictOne(now: number): void {
  let purged = false;
  for (const [key, value] of memoryStore) {
    if (value.expiresAt <= now) {
      memoryStore.delete(key);
      purged = true;
    }
  }
  if (purged || memoryStore.size < MEMORY_CACHE_MAX) return;

  let soonestKey: string | undefined;
  let soonest = Infinity;
  for (const [key, value] of memoryStore) {
    if (value.expiresAt < soonest) {
      soonest = value.expiresAt;
      soonestKey = key;
    }
  }
  if (soonestKey) memoryStore.delete(soonestKey);
}

function memoryHit(fullKey: string, limit: number, windowSec: number): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(fullKey);

  if (!entry || entry.expiresAt <= now) {
    if (memoryStore.size >= MEMORY_CACHE_MAX) {
      evictOne(now);
    }
    const fresh = { count: 1, expiresAt: now + windowSec * 1000 };
    memoryStore.set(fullKey, fresh);
    return { success: true, limit, remaining: limit - 1, reset: fresh.expiresAt };
  }

  entry.count += 1;
  const remaining = Math.max(0, limit - entry.count);
  return { success: entry.count <= limit, limit, remaining, reset: entry.expiresAt };
}

// Atomic fixed-window counter: INCR, set the TTL on first hit, and read the TTL
// back — all in one server-side script so a crash between INCR and EXPIRE can
// never leave a key without a TTL (which would ban the IP forever). Also cuts
// the 3 round-trips down to 1.
const RATE_LIMIT_LUA = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return {current, redis.call('TTL', KEYS[1])}
`;

export async function rateLimit(request: Request, options: RateLimitOptions): Promise<RateLimitResult> {
  const identifier = options.identifier ?? getClientIp(request);
  const fullKey = `ratelimit:${options.key}:${identifier}`;

  if (redisClient) {
    try {
      const [count, ttl] = (await redisClient.eval(RATE_LIMIT_LUA, 1, fullKey, options.windowSec)) as [
        number,
        number,
      ];
      const reset = Date.now() + (ttl > 0 ? ttl * 1000 : options.windowSec * 1000);
      const remaining = Math.max(0, options.limit - count);
      return { success: count <= options.limit, limit: options.limit, remaining, reset };
    } catch {
      // fall through to memory store
    }
  }

  return memoryHit(fullKey, options.limit, options.windowSec);
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.floor(result.reset / 1000)),
    ...(result.success ? {} : { 'Retry-After': String(Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))) }),
  };
}
