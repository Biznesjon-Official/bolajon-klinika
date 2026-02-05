/**
 * 1️⃣9️⃣ RESPONSE COMPRESSION MIDDLEWARE
 * JSON hajmini kichraytirish - tezroq yuklanadi
 */

import compression from 'compression';

/**
 * Compression middleware with optimal settings
 */
export const compressionMiddleware = compression({
  // Compression level (0-9, 6 is default and optimal)
  level: 6,
  
  // Minimum response size to compress (1KB)
  threshold: 1024,
  
  // Filter function - qaysi responslarni compress qilish
  filter: (req, res) => {
    // Agar client compression qabul qilmasa
    if (req.headers['x-no-compression']) {
      return false;
    }

    // Default compression filter
    return compression.filter(req, res);
  },
  
  // Memory level (1-9, 8 is default)
  memLevel: 8,
  
  // Strategy
  strategy: compression.Z_DEFAULT_STRATEGY
});

/**
 * Brotli compression (yanada yaxshi siqish)
 * Faqat static fayllar uchun
 */
export const brotliMiddleware = compression({
  level: 11, // Brotli uchun maksimal siqish
  threshold: 1024,
  filter: (req, res) => {
    // Faqat static fayllar
    const contentType = res.getHeader('Content-Type');
    if (!contentType) return false;
    
    return (
      contentType.includes('text/') ||
      contentType.includes('application/json') ||
      contentType.includes('application/javascript') ||
      contentType.includes('application/xml')
    );
  }
});

/**
 * Custom compression for specific routes
 */
export const apiCompression = compression({
  level: 6,
  threshold: 512, // API uchun kichikroq threshold
  filter: (req, res) => {
    const contentType = res.getHeader('Content-Type');
    return contentType && contentType.includes('application/json');
  }
});

/**
 * Compression statistics middleware
 */
export const compressionStats = (req, res, next) => {
  const originalWrite = res.write;
  const originalEnd = res.end;
  let originalSize = 0;
  let compressedSize = 0;

  res.write = function(chunk, ...args) {
    if (chunk) {
      originalSize += chunk.length;
    }
    return originalWrite.call(this, chunk, ...args);
  };

  res.end = function(chunk, ...args) {
    if (chunk) {
      originalSize += chunk.length;
    }
    
    const encoding = res.getHeader('Content-Encoding');
    if (encoding && (encoding.includes('gzip') || encoding.includes('br'))) {
      compressedSize = parseInt(res.getHeader('Content-Length') || 0);
      const ratio = originalSize > 0 ? ((1 - compressedSize / originalSize) * 100).toFixed(2) : 0;
      
      console.log(`📦 Compression: ${originalSize}B → ${compressedSize}B (${ratio}% saved)`);
    }
    
    return originalEnd.call(this, chunk, ...args);
  };

  next();
};

export default {
  compressionMiddleware,
  brotliMiddleware,
  apiCompression,
  compressionStats
};
