import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

let redisClient = null;
let isRedisAvailable = false;
let connectionAttempted = false;

// Try to connect to Redis, but don't fail if it's not available
const initRedis = async () => {
  if (connectionAttempted) return;
  connectionAttempted = true;

  try {
    redisClient = createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        connectTimeout: 2000,
        reconnectStrategy: false, // Don't auto-reconnect
      },
      password: process.env.REDIS_PASSWORD || undefined,
    });

    // Suppress error logging after initial attempt
    let errorLogged = false;
    redisClient.on('error', (err) => {
      if (!errorLogged) {
        console.warn('⚠️  Redis not available - running without cache');
        errorLogged = true;
      }
      isRedisAvailable = false;
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis Client Connected');
      isRedisAvailable = true;
    });

    await redisClient.connect();
  } catch (error) {
    console.warn('⚠️  Redis not available - running without cache');
    redisClient = null;
    isRedisAvailable = false;
  }
};

// Initialize Redis connection
await initRedis();

// Cache wrapper that works with or without Redis
export const cache = {
  get: async (key) => {
    if (!isRedisAvailable || !redisClient) {
      return null;
    }
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },
  
  set: async (key, value, ttl = 3600) => {
    if (!isRedisAvailable || !redisClient) {
      return false;
    }
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  },
  
  del: async (key) => {
    if (!isRedisAvailable || !redisClient) {
      return false;
    }
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  },
  
  invalidatePattern: async (pattern) => {
    if (!isRedisAvailable || !redisClient) {
      return false;
    }
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Cache invalidate error:', error);
      return false;
    }
  }
};

export { isRedisAvailable };
export default redisClient;
