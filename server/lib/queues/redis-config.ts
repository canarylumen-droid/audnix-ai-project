import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Shared Redis connection for BullMQ
export const redisConnection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null, // Critical for BullMQ
  enableReadyCheck: false,
});

redisConnection.on('error', (err) => {
  console.error('❌ Redis Connection Error:', err);
});

redisConnection.on('connect', () => {
  console.log('✅ Connected to Redis');
});
