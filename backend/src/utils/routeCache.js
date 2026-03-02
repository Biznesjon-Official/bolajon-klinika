/**
 * Route-level caching utility using Redis
 * Uses config/redis.js cache instance
 */
import { cache } from '../config/redis.js'

/**
 * Cache middleware for GET routes
 * @param {string} prefix - Cache key prefix (e.g. 'billing:services')
 * @param {number} ttl - Seconds to cache (default 60)
 */
export const withCache = (prefix, ttl = 60) => async (req, res, next) => {
  const key = `${prefix}:${req.originalUrl}`
  try {
    const cached = await cache.get(key)
    if (cached) return res.json(cached)

    const originalJson = res.json.bind(res)
    res.json = (data) => {
      // Only cache successful responses
      if (data?.success !== false) {
        cache.set(key, data, ttl).catch(() => {})
      }
      return originalJson(data)
    }
    next()
  } catch {
    next()
  }
}

/**
 * Invalidate all cache keys matching a prefix pattern
 * Call this in POST/PUT/DELETE handlers
 * @param {...string} prefixes - e.g. 'billing:services', 'billing:categories'
 */
export const bust = async (...prefixes) => {
  for (const prefix of prefixes) {
    await cache.invalidatePattern(`${prefix}:*`).catch(() => {})
  }
}
