import { Redis } from 'ioredis';

// Logging de configuration Redis pour débogage
console.log(
  'Initializing Redis client with URL pattern:',
  process.env.REDIS_URL ? 'redis://username:***@' + process.env.REDIS_URL.split('@')[1] : 'redis://localhost:6379',
);

// Initialize Redis client
const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Logs de connexion Redis
redisClient.on('connect', () => {
  console.log('Redis client connected successfully');
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});

// Default expiration time in seconds (5 minutes)
const DEFAULT_EXPIRATION = 5 * 60;

/**
 * Get data from Redis cache
 * @param key Cache key
 */
export async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    console.log(`Attempting to get data from Redis cache with key: ${key}`);
    const cachedData = await redisClient.get(key);
    if (cachedData) {
      console.log(`Cache hit for key: ${key}`);
      return JSON.parse(cachedData) as T;
    }
    console.log(`Cache miss for key: ${key}`);
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
export async function setCache(key: string, data: any, expiration = DEFAULT_EXPIRATION): Promise<void> {
  try {
    console.log(`Setting data in Redis cache with key: ${key}, expiration: ${expiration}s`);
    await redisClient.set(key, JSON.stringify(data), 'EX', expiration);
    console.log(`Successfully cached data with key: ${key}`);
  } catch (error) {
    console.error(`Redis set error for key ${key}:`, error);
  }
}

export { redisClient };
