/**
 * 2️⃣0️⃣ PERFORMANCE MONITORING MIDDLEWARE
 * Sekin joylarni kuzatib borish
 */

import fs from 'fs';
import path from 'path';

// Performance logs
const performanceLogs = [];
const SLOW_THRESHOLD = 1000; // 1 second
const MAX_LOGS = 1000;

/**
 * Request timing middleware
 */
export const requestTiming = (req, res, next) => {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();

  // Response finish event
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const endMemory = process.memoryUsage();
    const memoryDiff = {
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      external: endMemory.external - startMemory.external
    };

    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      duration,
      memoryDiff,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress
    };

    // Log slow requests
    if (duration > SLOW_THRESHOLD) {
      console.warn(`⚠️  SLOW REQUEST: ${req.method} ${req.url} - ${duration}ms`);
      logSlowRequest(logEntry);
    }

    // Store in memory (limited)
    performanceLogs.push(logEntry);
    if (performanceLogs.length > MAX_LOGS) {
      performanceLogs.shift();
    }

    // Add timing header
    res.set('X-Response-Time', `${duration}ms`);
  });

  next();
};

/**
 * Database query timing
 */
export const queryTiming = (query, params) => {
  const startTime = Date.now();

  return {
    end: () => {
      const duration = Date.now() - startTime;
      
      if (duration > 100) { // Slow query threshold
        console.warn(`⚠️  SLOW QUERY: ${duration}ms`);
        console.warn(`Query: ${query.substring(0, 100)}...`);
        
        logSlowQuery({
          timestamp: new Date().toISOString(),
          query: query.substring(0, 500),
          params: JSON.stringify(params).substring(0, 200),
          duration
        });
      }

      return duration;
    }
  };
};

/**
 * Log slow requests to file
 */
function logSlowRequest(logEntry) {
  const logDir = path.join(process.cwd(), 'logs');
  const logFile = path.join(logDir, 'slow-requests.log');

  // Create logs directory if not exists
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logLine = JSON.stringify(logEntry) + '\n';
  fs.appendFileSync(logFile, logLine);
}

/**
 * Log slow queries to file
 */
function logSlowQuery(logEntry) {
  const logDir = path.join(process.cwd(), 'logs');
  const logFile = path.join(logDir, 'slow-queries.log');

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logLine = JSON.stringify(logEntry) + '\n';
  fs.appendFileSync(logFile, logLine);
}

/**
 * Get performance stats
 */
export const getPerformanceStats = () => {
  if (performanceLogs.length === 0) {
    return {
      totalRequests: 0,
      averageDuration: 0,
      slowRequests: 0,
      fastestRequest: 0,
      slowestRequest: 0
    };
  }

  const durations = performanceLogs.map(log => log.duration);
  const total = durations.reduce((sum, d) => sum + d, 0);
  const average = total / durations.length;
  const slowCount = durations.filter(d => d > SLOW_THRESHOLD).length;

  return {
    totalRequests: performanceLogs.length,
    averageDuration: Math.round(average),
    slowRequests: slowCount,
    fastestRequest: Math.min(...durations),
    slowestRequest: Math.max(...durations),
    recentLogs: performanceLogs.slice(-10)
  };
};

/**
 * Get slow requests
 */
export const getSlowRequests = (limit = 20) => {
  return performanceLogs
    .filter(log => log.duration > SLOW_THRESHOLD)
    .sort((a, b) => b.duration - a.duration)
    .slice(0, limit);
};

/**
 * Clear performance logs
 */
export const clearPerformanceLogs = () => {
  performanceLogs.length = 0;
  console.log('🗑️  Performance logs cleared');
};

/**
 * Memory usage monitoring
 */
export const memoryMonitor = () => {
  const usage = process.memoryUsage();
  const formatMemory = (bytes) => `${Math.round(bytes / 1024 / 1024)}MB`;

  return {
    heapUsed: formatMemory(usage.heapUsed),
    heapTotal: formatMemory(usage.heapTotal),
    external: formatMemory(usage.external),
    rss: formatMemory(usage.rss)
  };
};

/**
 * CPU usage monitoring
 */
export const cpuMonitor = () => {
  const usage = process.cpuUsage();
  
  return {
    user: Math.round(usage.user / 1000), // microseconds to milliseconds
    system: Math.round(usage.system / 1000)
  };
};

/**
 * Health check endpoint data
 */
export const getHealthCheck = () => {
  const uptime = process.uptime();
  const memory = memoryMonitor();
  const cpu = cpuMonitor();
  const stats = getPerformanceStats();

  return {
    status: 'healthy',
    uptime: Math.round(uptime),
    memory,
    cpu,
    performance: {
      averageResponseTime: stats.averageDuration,
      slowRequests: stats.slowRequests,
      totalRequests: stats.totalRequests
    },
    timestamp: new Date().toISOString()
  };
};

export default {
  requestTiming,
  queryTiming,
  getPerformanceStats,
  getSlowRequests,
  clearPerformanceLogs,
  memoryMonitor,
  cpuMonitor,
  getHealthCheck
};
