import rateLimit from 'express-rate-limit';

export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000, // 1 daqiqa
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // 1000 so'rov/daqiqa
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 daqiqa
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX) || 100, // 100 urinish (development uchun)
  message: 'Too many login attempts, please try again after 15 minutes',
  skipSuccessfulRequests: true,
});

export const searchRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 daqiqa
  max: 100, // 100 qidiruv/daqiqa
  message: 'Too many search requests, please slow down',
});
