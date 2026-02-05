/**
 * OPTIMIZATION CONFIGURATION
 * Barcha optimizatsiya sozlamalari
 */

export const optimizationConfig = {
  // 1️⃣ Pagination
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
    defaultPage: 1
  },

  // 2️⃣ Infinite Scroll
  infiniteScroll: {
    threshold: 0.8, // 80% scroll
    prefetchThreshold: 0.9, // 90% prefetch
    limit: 20
  },

  // 4️⃣ Cursor Pagination
  cursorPagination: {
    defaultLimit: 20,
    maxLimit: 50
  },

  // 6️⃣ Database
  database: {
    poolSize: 20,
    idleTimeout: 30000,
    connectionTimeout: 2000
  },

  // 8️⃣ Images
  images: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    thumbnailSizes: {
      small: { width: 150, height: 150 },
      medium: { width: 300, height: 300 },
      large: { width: 600, height: 600 }
    },
    quality: {
      webp: 80,
      jpeg: 85,
      png: 90
    }
  },

  // 1️⃣1️⃣ Debounce
  debounce: {
    search: 300, // ms
    filter: 500,
    input: 300
  },

  // 1️⃣2️⃣ Cache
  cache: {
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      ttl: {
        short: 60, // 1 minute
        medium: 300, // 5 minutes
        long: 3600, // 1 hour
        veryLong: 86400 // 1 day
      }
    },
    memory: {
      max: 100, // Max items in memory cache
      ttl: 60 // seconds
    }
  },

  // 1️⃣3️⃣ HTTP Cache
  httpCache: {
    static: 31536000, // 1 year
    images: 604800, // 1 week
    api: 300, // 5 minutes
    dynamic: 60, // 1 minute
    noCache: 0
  },

  // 1️⃣7️⃣ Rate Limiting
  rateLimit: {
    general: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100
    },
    strict: {
      windowMs: 15 * 60 * 1000,
      max: 10
    },
    login: {
      windowMs: 15 * 60 * 1000,
      max: 5
    },
    search: {
      windowMs: 60 * 1000, // 1 minute
      max: 30
    },
    upload: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10
    },
    create: {
      windowMs: 60 * 60 * 1000,
      max: 20
    }
  },

  // 1️⃣9️⃣ Compression
  compression: {
    level: 6, // 0-9
    threshold: 1024, // 1KB
    memLevel: 8
  },

  // 2️⃣0️⃣ Performance
  performance: {
    slowRequestThreshold: 1000, // 1 second
    slowQueryThreshold: 100, // 100ms
    maxLogs: 1000,
    logToFile: true
  },

  // Virtual List
  virtualList: {
    itemHeight: 80,
    overscan: 5,
    threshold: 100 // Start virtualizing after 100 items
  },

  // Batch Requests
  batch: {
    maxSize: 100,
    timeout: 5000 // 5 seconds
  }
};

export default optimizationConfig;
