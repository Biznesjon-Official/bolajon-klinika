/**
 * 1️⃣2️⃣ REDIS CACHE MIDDLEWARE
 * Ko'p so'raladigan ma'lumotlarni cache'da saqlash
 */

import { createClient } from 'redis';

// Redis client
let redisClient = null;
let isRedisConnected = false;

// Redis ulanish
export const connectRedis = async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('Redis: Too many reconnection attempts');
            return new Error('Redis reconnection failed');
          }
          return retries * 100; // Exponential backoff
        }
      }
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
      isRedisConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected successfully');
      isRedisConnected = true;
    });

    redisClient.on('disconnect', () => {
      console.log('⚠️  Redis disconnected');
      isRedisConnected = false;
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('Redis connection error:', error);
    isRedisConnected = false;
    return null;
  }
};

/**
 * Cache middleware
 * @param {number} duration - Cache duration in seconds
 */
export const cacheMiddleware = (duration = 60) => {
  return async (req, res, next) => {
    // Redis mavjud emas yoki ulanmagan bo'lsa, cache'siz davom et
    if (!isRedisConnected || !redisClient) {
      return next();
    }

    // Faqat GET requestlar uchun cache
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // Cache key yaratish
      const cacheKey = `cache:${req.originalUrl || req.url}`;
      
      // Cache'dan olish
      const cachedData = await redisClient.get(cacheKey);
      
      if (cachedData) {
        console.log(`✅ Cache HIT: ${cacheKey}`);
        return res.json(JSON.parse(cachedData));
      }

      console.log(`❌ Cache MISS: ${cacheKey}`);

      // Original res.json ni saqlash
      const originalJson = res.json.bind(res);

      // res.json ni override qilish
      res.json = (data) => {
        // Cache'ga saqlash
        redisClient.setEx(cacheKey, duration, JSON.stringify(data))
          .catch(err => console.error('Cache save error:', err));
        
        // Original response yuborish
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

/**
 * Cache invalidation
 * @param {string} pattern - Cache key pattern (e.g., 'cache:/api/v1/patients*')
 */
export const invalidateCache = async (pattern) => {
  if (!isRedisConnected || !redisClient) {
    return;
  }

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`🗑️  Invalidated ${keys.length} cache keys`);
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
};

/**
 * Clear all cache
 */
export const clearAllCache = async () => {
  if (!isRedisConnected || !redisClient) {
    return;
  }

  try {
    await redisClient.flushAll();
    console.log('🗑️  All cache cleared');
  } catch (error) {
    console.error('Clear cache error:', error);
  }
};

/**
 * Get cache stats
 */
export const getCacheStats = async () => {
  if (!isRedisConnected || !redisClient) {
    return { connected: false };
  }

  try {
    const info = await redisClient.info('stats');
    const keyspace = await redisClient.info('keyspace');
    
    return {
      connected: true,
      info,
      keyspace
    };
  } catch (error) {
    console.error('Get cache stats error:', error);
    return { connected: false, error: error.message };
  }
};

/**
 * Manual cache get
 */
export const getCache = async (key) => {
  if (!isRedisConnected || !redisClient) {
    return null;
  }

  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Get cache error:', error);
    return null;
  }
};

/**
 * Manual cache set
 */
export const setCache = async (key, value, duration = 60) => {
  if (!isRedisConnected || !redisClient) {
    return false;
  }

  try {
    await redisClient.setEx(key, duration, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Set cache error:', error);
    return false;
  }
};

export default {
  connectRedis,
  cacheMiddleware,
  invalidateCache,
  clearAllCache,
  getCacheStats,
  getCache,
  setCache
};
