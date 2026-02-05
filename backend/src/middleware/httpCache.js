/**
 * 1️⃣3️⃣ HTTP CACHE HEADERS MIDDLEWARE
 * Bir xil ma'lumot qayta-qayta serverdan kelmasin
 */

/**
 * Cache-Control headers for different content types
 */
export const cacheControl = {
  // Static assets - 1 yil
  static: (req, res, next) => {
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    next();
  },

  // Images - 1 hafta
  images: (req, res, next) => {
    res.set('Cache-Control', 'public, max-age=604800');
    next();
  },

  // API responses - 5 daqiqa
  api: (req, res, next) => {
    res.set('Cache-Control', 'public, max-age=300');
    next();
  },

  // Dynamic content - 1 daqiqa
  dynamic: (req, res, next) => {
    res.set('Cache-Control', 'public, max-age=60');
    next();
  },

  // No cache - har doim yangi
  noCache: (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
  },

  // Private cache - faqat browser
  private: (req, res, next) => {
    res.set('Cache-Control', 'private, max-age=300');
    next();
  }
};

/**
 * ETag support for conditional requests
 */
export const etagMiddleware = (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = function(data) {
    // Generate ETag from response data
    const etag = generateETag(JSON.stringify(data));
    res.set('ETag', etag);

    // Check if client has cached version
    const clientETag = req.headers['if-none-match'];
    if (clientETag === etag) {
      return res.status(304).end();
    }

    return originalJson(data);
  };

  next();
};

/**
 * Last-Modified header support
 */
export const lastModifiedMiddleware = (getLastModified) => {
  return (req, res, next) => {
    const lastModified = getLastModified(req);
    if (lastModified) {
      res.set('Last-Modified', lastModified.toUTCString());

      const ifModifiedSince = req.headers['if-modified-since'];
      if (ifModifiedSince) {
        const clientDate = new Date(ifModifiedSince);
        if (clientDate >= lastModified) {
          return res.status(304).end();
        }
      }
    }
    next();
  };
};

/**
 * Vary header for content negotiation
 */
export const varyMiddleware = (...headers) => {
  return (req, res, next) => {
    res.set('Vary', headers.join(', '));
    next();
  };
};

/**
 * Cache by user role
 */
export const cacheByRole = (duration = 300) => {
  return (req, res, next) => {
    const role = req.user?.role || 'guest';
    res.set('Cache-Control', `private, max-age=${duration}`);
    res.set('Vary', 'Authorization');
    next();
  };
};

/**
 * Stale-while-revalidate strategy
 */
export const staleWhileRevalidate = (maxAge = 60, staleTime = 300) => {
  return (req, res, next) => {
    res.set('Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=${staleTime}`);
    next();
  };
};

/**
 * Generate ETag from content
 */
function generateETag(content) {
  const crypto = require('crypto');
  return `"${crypto.createHash('md5').update(content).digest('hex')}"`;
}

/**
 * Smart cache middleware
 * Automatically determines cache strategy based on route
 */
export const smartCache = (req, res, next) => {
  const path = req.path;
  const method = req.method;

  // No cache for non-GET requests
  if (method !== 'GET') {
    return cacheControl.noCache(req, res, next);
  }

  // Static assets
  if (path.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/)) {
    return cacheControl.static(req, res, next);
  }

  // Images
  if (path.includes('/images/') || path.includes('/uploads/')) {
    return cacheControl.images(req, res, next);
  }

  // API endpoints
  if (path.startsWith('/api/')) {
    // List endpoints - short cache
    if (path.includes('/list') || path.includes('/search')) {
      return cacheControl.dynamic(req, res, next);
    }
    // Detail endpoints - longer cache
    return cacheControl.api(req, res, next);
  }

  // Default - no cache
  return cacheControl.noCache(req, res, next);
};

export default {
  cacheControl,
  etagMiddleware,
  lastModifiedMiddleware,
  varyMiddleware,
  cacheByRole,
  staleWhileRevalidate,
  smartCache
};
