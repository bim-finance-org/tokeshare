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

function memoryHit(fullKey: string, limit: number, windowSec: number): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(fullKey);

  if (!entry || entry.expiresAt <= now) {
    if (memoryStore.size >= MEMORY_CACHE_MAX) {
      const firstKey = memoryStore.keys().next().value;
      if (firstKey) memoryStore.delete(firstKey);
    }
    const fresh = { count: 1, expiresAt: now + windowSec * 1000 };
    memoryStore.set(fullKey, fresh);
    return { success: true, limit, remaining: limit - 1, reset: fresh.expiresAt };
  }

  entry.count += 1;
  const remaining = Math.max(0, limit - entry.count);
  return { success: entry.count <= limit, limit, remaining, reset: entry.expiresAt };
}

export async function rateLimit(request: Request, options: RateLimitOptions): Promise<RateLimitResult> {
  const identifier = options.identifier ?? getClientIp(request);
  const fullKey = `ratelimit:${options.key}:${identifier}`;

  if (redisClient) {
    try {
      const count = await redisClient.incr(fullKey);
      if (count === 1) {
        await redisClient.expire(fullKey, options.windowSec);
      }
      const ttl = await redisClient.ttl(fullKey);
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
