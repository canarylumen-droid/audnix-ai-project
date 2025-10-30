
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

// Redis client for distributed rate limiting (optional)
let redisClient: ReturnType<typeof createClient> | null = null;

if (process.env.REDIS_URL) {
  redisClient = createClient({
    url: process.env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => Math.min(retries * 50, 1000)
    }
  });
  
  redisClient.on('error', (err) => {
    console.error('Redis rate limit error:', err);
  });
  
  redisClient.connect().catch(console.error);
}

/**
 * General API rate limiter - 100 requests per 15 minutes
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  ...(redisClient && {
    store: new RedisStore({
      client: redisClient,
      prefix: 'rl:api:'
    })
  })
});

/**
 * Strict limiter for auth endpoints - 5 requests per 15 minutes
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  ...(redisClient && {
    store: new RedisStore({
      client: redisClient,
      prefix: 'rl:auth:'
    })
  })
});

/**
 * Webhook limiter - 1000 requests per minute (for high-volume webhooks)
 */
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  message: 'Webhook rate limit exceeded',
  standardHeaders: true,
  legacyHeaders: false,
  ...(redisClient && {
    store: new RedisStore({
      client: redisClient,
      prefix: 'rl:webhook:'
    })
  })
});

/**
 * AI generation limiter - 20 requests per minute per user
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: 'AI generation rate limit exceeded',
  keyGenerator: (req) => {
    return (req.session as any)?.userId || req.ip || 'anonymous';
  },
  standardHeaders: true,
  legacyHeaders: false,
  ...(redisClient && {
    store: new RedisStore({
      client: redisClient,
      prefix: 'rl:ai:'
    })
  })
});
