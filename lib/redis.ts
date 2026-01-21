import { Redis } from 'ioredis';

// Utilisation de globalThis pour éviter les connexions multiples en dev mode (HMR)
const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient(): Redis {
  const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

  client.on('connect', () => {
    console.log('Redis client connected successfully');
  });

  client.on('error', (err) => {
    console.error('Redis connection error:', err);
  });

  return client;
}

// Réutilise l'instance existante en dev, ou en crée une nouvelle
export const redisClient = globalForRedis.redis ?? createRedisClient();

// Stocke l'instance dans globalThis pour éviter les connexions multiples
globalForRedis.redis = redisClient;

// Default expiration time in seconds (5 minutes)
const DEFAULT_EXPIRATION = 5 * 60;

/**
 * Get data from Redis cache
 * @param key Cache key
 */
export async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    const cachedData = await redisClient.get(key);
    if (cachedData) {
      return JSON.parse(cachedData) as T;
    }
    return null;
  } catch (error) {
    console.error(`Redis get error for key ${key}:`, error);
    return null;
  }
}

/**
 * Set data in Redis cache
 * @param key Cache key
 * @param data Data to cache
 * @param expiration Expiration time in seconds (default: 5 minutes)
 */
export async function setCache<T>(key: string, data: T, expiration = DEFAULT_EXPIRATION): Promise<void> {
  try {
    await redisClient.set(key, JSON.stringify(data), 'EX', expiration);
  } catch (error) {
    console.error(`Redis set error for key ${key}:`, error);
  }
}
