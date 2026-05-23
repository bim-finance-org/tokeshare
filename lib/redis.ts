import { Redis } from 'ioredis';
import { getLogger } from '@/lib/logger';

const log = getLogger('redis');

// In-memory cache with LRU eviction and size limit
const MAX_CACHE_SIZE = 50; // Maximum entries in memory cache
const memoryCache = new Map<string, { data: string; expiry: number }>();

// Cleanup expired entries and enforce size limit
function cleanupMemoryCache() {
  const now = Date.now();

  // Remove expired entries
  for (const [key, value] of memoryCache.entries()) {
    if (value.expiry <= now) {
      memoryCache.delete(key);
    }
  }

  // If still over limit, remove oldest entries (LRU - Map preserves insertion order)
  while (memoryCache.size > MAX_CACHE_SIZE) {
    const firstKey = memoryCache.keys().next().value;
    if (firstKey) memoryCache.delete(firstKey);
  }
}

// Run cleanup every 2 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupMemoryCache, 2 * 60 * 1000);
}

// Check if Redis URL is usable (not an internal container hostname)
function isRedisUrlUsable(): boolean {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return false;

  try {
    const url = new URL(redisUrl);
    // Skip if hostname looks like an internal container network name
    if (/^[a-z0-9]{20,}$/i.test(url.hostname)) {
      log.info('skipping connection (internal hostname detected), using in-memory cache');
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

const globalForRedis = globalThis as unknown as {
  redis: Redis | null | undefined;
  redisAvailable: boolean | undefined;
};

function createRedisClient(): Redis | null {
  if (!isRedisUrlUsable()) {
    globalForRedis.redisAvailable = false;
    return null;
  }

  const client = new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) {
        log.warn('max retries reached, falling back to in-memory cache');
        globalForRedis.redisAvailable = false;
        return null;
      }
      return Math.min(times * 200, 1000);
    },
    lazyConnect: true,
  });

  client.on('connect', () => {
    log.info('connected');
    globalForRedis.redisAvailable = true;
  });

  client.on('error', () => {
    if (globalForRedis.redisAvailable !== false) {
      log.error('connection failed, using in-memory cache instead');
      globalForRedis.redisAvailable = false;
    }
  });

  client.connect().catch(() => {
    globalForRedis.redisAvailable = false;
  });

  return client;
}

export const redisClient = globalForRedis.redis !== undefined
  ? globalForRedis.redis
  : createRedisClient();

globalForRedis.redis = redisClient;

const DEFAULT_EXPIRATION = 5 * 60;

/**
 * Get data from cache (Redis or in-memory fallback)
 */
export async function getFromCache<T>(key: string): Promise<T | null> {
  // Try Redis first if available
  if (redisClient && globalForRedis.redisAvailable) {
    try {
      const cachedData = await redisClient.get(key);
      if (cachedData) {
        return JSON.parse(cachedData) as T;
      }
      return null;
    } catch {
      // Fall through to memory cache
    }
  }

  // Fallback to in-memory cache
  const cached = memoryCache.get(key);
  if (cached) {
    if (cached.expiry > Date.now()) {
      // Move to end for LRU (delete and re-add)
      memoryCache.delete(key);
      memoryCache.set(key, cached);
      return JSON.parse(cached.data) as T;
    }
    memoryCache.delete(key);
  }
  return null;
}

/**
 * Set data in cache (Redis or in-memory fallback)
 */
export async function setCache<T>(key: string, data: T, expiration = DEFAULT_EXPIRATION): Promise<void> {
  const jsonData = JSON.stringify(data);

  // Try Redis first if available
  if (redisClient && globalForRedis.redisAvailable) {
    try {
      await redisClient.set(key, jsonData, 'EX', expiration);
      return;
    } catch {
      // Fall through to memory cache
    }
  }

  // Cleanup before adding new entry
  cleanupMemoryCache();

  // Add to memory cache
  memoryCache.set(key, {
    data: jsonData,
    expiry: Date.now() + expiration * 1000,
  });
}

export { redisClient as default };
