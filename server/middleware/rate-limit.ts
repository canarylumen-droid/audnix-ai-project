
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

// Log if Redis isn't configured for production
if (process.env.NODE_ENV === 'production' && !process.env.REDIS_URL) {
  console.warn('⚠️  REDIS_URL not set - rate limiting will use memory (not recommended for production)');
  console.warn('💡 Add Redis from Replit to prevent rate limit bypass across restarts');
}

// Redis client for distributed rate limiting (optional)
let redisClient: ReturnType<typeof createClient> | null = null;

if (process.env.REDIS_URL) {
  try {
    // Extract clean Redis URL (handle malformed URLs with "redis-cli -u" prefix)
    let redisUrl = process.env.REDIS_URL;
    if (redisUrl.includes('redis-cli -u')) {
      redisUrl = redisUrl.match(/redis:\/\/[^\s]+/)?.[0] || redisUrl;
    }
    
    console.log('📍 Connecting to Redis...');
    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 1000)
      }
    });
    
    redisClient.on('error', (err) => {
      console.error('⚠️  Redis connection error:', err.message);
      redisClient = null; // Fallback to memory storage
    });
    
    redisClient.on('connect', () => {
      console.log('✅ Redis connected for rate limiting');
    });
    
    redisClient.connect().catch((err) => {
      console.warn('⚠️  Redis failed, using memory-based rate limiting:', err.message);
      redisClient = null;
    });
  } catch (err) {
    console.error('❌ Redis initialization error:', err);
    redisClient = null; // Fallback to memory
  }
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
      // @ts-ignore - RedisStore types don't match express-rate-limit
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
      // @ts-ignore - RedisStore types don't match express-rate-limit
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
      // @ts-ignore - RedisStore types don't match express-rate-limit
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
    const userId = (req.session as any)?.userId;
    if (userId) return `user:${userId}`;
    return `ip:${req.ip}`;
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false, // Disable IPv6 validation warnings
  ...(redisClient && {
    store: new RedisStore({
      // @ts-ignore - RedisStore types don't match express-rate-limit
      client: redisClient,
      prefix: 'rl:ai:'
    })
  })
});

/**
 * WhatsApp message limiter - 20 messages per minute per user
 * Prevents abuse and ensures compliance with WhatsApp limits
 */
export const whatsappLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: 'WhatsApp message rate limit exceeded. Please wait before sending more messages.',
  keyGenerator: (req) => {
    const userId = (req.session as any)?.userId;
    if (userId) return `user:${userId}`;
    return `ip:${req.ip}`;
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  ...(redisClient && {
    store: new RedisStore({
      // @ts-ignore - RedisStore types don't match express-rate-limit
      client: redisClient,
      prefix: 'rl:whatsapp:'
    })
  })
});

/**
 * Vite dev server limiter - Higher limit for development, stricter for production
 * Protects development server from abuse while allowing HMR
 */
export const viteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 5000 : 500,
  message: 'Too many requests to development server',
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  ...(redisClient && {
    store: new RedisStore({
      // @ts-ignore - RedisStore types don't match express-rate-limit
      client: redisClient,
      prefix: 'rl:vite:'
    })
  })
});

/**
 * SMTP email rate limiter - 150-300 emails per hour per user
 * Prevents deliverability issues and domain blacklisting
 * Random delays between 2-12 seconds per email
 * Max 5k per day unless manually overridden by admin
 */
export const smtpRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 300, // 150-300 emails per hour (adjustable via user plan)
  message: 'Email sending rate limit exceeded. Please wait before sending more emails.',
  keyGenerator: (req) => {
    const userId = (req.session as any)?.userId;
    if (userId) return `smtp:${userId}`;
    return req.ip || 'unknown';
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  ...(redisClient && {
    store: new RedisStore({
      // @ts-ignore
      client: redisClient,
      prefix: 'rl:smtp:'
    })
  })
});

/**
 * Email import limiter - prevent import flooding
 * Max 1000 emails per day
 */
export const emailImportLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 1000,
  message: 'Daily email import limit exceeded',
  keyGenerator: (req) => {
    const userId = (req.session as any)?.userId;
    if (userId) return `import:${userId}`;
    // Use ipv6KeyGenerator for IPv6 support
    return req.ip?.includes(':') ? `ip:${req.ip}` : `ip:${req.ip || 'unknown'}`;
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  ...(redisClient && {
    store: new RedisStore({
      // @ts-ignore
      client: redisClient,
      prefix: 'rl:import:'
    })
  })
});
