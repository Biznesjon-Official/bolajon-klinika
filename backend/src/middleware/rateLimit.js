/**
 * 1️⃣7️⃣ RATE LIMITING MIDDLEWARE
 * Bir user sekundiga ko'p so'rov yubormasin
 */

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

// Redis client for rate limiting
let redisClient = null;

export const initRateLimitRedis = async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    await redisClient.connect();
    console.log('✅ Rate limit Redis connected');
    return redisClient;
  } catch (error) {
    console.error('Rate limit Redis error:', error);
    return null;
  }
};

/**
 * General API rate limit
 * 100 requests per 15 minutes
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    message: 'Juda ko\'p so\'rov yuborildi. Iltimos, biroz kuting.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Redis store (agar mavjud bo'lsa)
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'rl:general:'
  }) : undefined
});

/**
 * Strict rate limit for sensitive operations
 * 10 requests per 15 minutes
 */
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Juda ko\'p urinish. Iltimos, 15 daqiqadan keyin qayta urinib ko\'ring.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'rl:strict:'
  }) : undefined
});

/**
 * Login rate limit
 * 5 attempts per 15 minutes
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Juda ko\'p login urinishi. Iltimos, 15 daqiqadan keyin qayta urinib ko\'ring.'
  },
  skipSuccessfulRequests: true, // Muvaffaqiyatli loginlarni hisobga olmaslik
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'rl:login:'
  }) : undefined
});

/**
 * Search rate limit
 * 30 requests per minute
 */
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: {
    success: false,
    message: 'Juda ko\'p qidiruv so\'rovi. Iltimos, biroz kuting.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'rl:search:'
  }) : undefined
});

/**
 * File upload rate limit
 * 10 uploads per hour
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    success: false,
    message: 'Juda ko\'p fayl yuklash urinishi. Iltimos, 1 soatdan keyin qayta urinib ko\'ring.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'rl:upload:'
  }) : undefined
});

/**
 * API creation rate limit
 * 20 creates per hour
 */
export const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Juda ko\'p yaratish so\'rovi. Iltimos, biroz kuting.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'rl:create:'
  }) : undefined
});

/**
 * Custom rate limiter factory
 */
export const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = 'Juda ko\'p so\'rov yuborildi',
    prefix = 'rl:custom:'
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: redisClient ? new RedisStore({
      client: redisClient,
      prefix
    }) : undefined
  });
};

export default {
  initRateLimitRedis,
  generalLimiter,
  strictLimiter,
  loginLimiter,
  searchLimiter,
  uploadLimiter,
  createLimiter,
  createRateLimiter
};
