import { createClient, type RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;
let isInitializing = false;

/**
 * Get or initialize the shared Redis client
 */
export async function getRedisClient(): Promise<RedisClientType | null> {
  if (redisClient) return redisClient;
  if (!process.env.REDIS_URL) return null;
  if (isInitializing) {
     // Wait a bit if another call is initializing
     await new Promise(resolve => setTimeout(resolve, 500));
     return redisClient;
  }

  isInitializing = true;
  try {
    let redisUrl = process.env.REDIS_URL.trim();

    // Support replit-style redis-cli connection strings
    if (redisUrl.includes('redis-cli')) {
      redisUrl = redisUrl.replace(/^redis-cli\s+-u\s+/, '');
    }

    // Extract standard redis:// URL if embedded in a larger string
    const match = redisUrl.match(/redis:\/\/[^:]+:[^@]+@[^:]+:\d+/);
    if (match) {
      redisUrl = match[0];
    }

    const client = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: (retries) => Math.min(retries * 50, 2000)
      }
    });

    client.on('error', (err) => console.error('Redis Client Error', err));
    
    await client.connect();
    console.log('✅ Shared Redis Client Connected');
    redisClient = client as RedisClientType;
    return redisClient;
  } catch (err) {
    console.error('❌ Failed to connect to Redis:', err);
    return null;
  } finally {
    isInitializing = false;
  }
}

/**
 * Simple Distributed Lock
 * Tries to acquire a lock for a specific key
 */
export async function acquireLock(key: string, ttlSeconds: number = 30): Promise<boolean> {
  const client = await getRedisClient();
  if (!client) return true; // Fail open (safe for refreshing as DB will still be update target)

  try {
    const result = await client.set(`lock:${key}`, 'locked', {
      NX: true,
      EX: ttlSeconds
    });
    return result === 'OK';
  } catch (err) {
    return true; // Fail open
  }
}

/**
 * Release a Distributed Lock
 */
export async function releaseLock(key: string): Promise<void> {
  const client = await getRedisClient();
  if (!client) return;

  try {
    await client.del(`lock:${key}`);
  } catch (err) {
    // Ignore release errors
  }
}
