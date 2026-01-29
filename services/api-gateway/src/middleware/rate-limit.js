'use strict';

const { AppError, errorCodes } = require('@real-estate/common');

const config = require('../config');

/**
 * In-memory store for rate limiting
 * In production, use Redis for distributed rate limiting
 */
const memoryStore = new Map();

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of memoryStore.entries()) {
    if (value.resetTime < now) {
      memoryStore.delete(key);
    }
  }
}, 60000);

/**
 * Create a rate limiter
 */
function createRateLimiter(options = {}) {
  const {
    windowMs = config.rateLimit.windowMs,
    max = config.rateLimit.maxRequests,
    keyGenerator = (req) => req.ip || req.headers['x-forwarded-for'] || 'unknown',
    message = 'Too many requests, please try again later',
  } = options;

  return async (req, res, next) => {
    const key = `ratelimit:${keyGenerator(req)}`;
    const now = Date.now();

    try {
      let data = memoryStore.get(key);

      if (!data || data.resetTime < now) {
        data = {
          count: 1,
          resetTime: now + windowMs,
        };
        memoryStore.set(key, data);
      } else {
        data.count++;
      }

      // Set rate limit headers
      const remaining = Math.max(0, max - data.count);
      const resetSeconds = Math.ceil((data.resetTime - now) / 1000);

      res.setHeader('X-RateLimit-Limit', String(max));
      res.setHeader('X-RateLimit-Remaining', String(remaining));
      res.setHeader('X-RateLimit-Reset', String(Math.ceil(data.resetTime / 1000)));

      if (data.count > max) {
        res.setHeader('Retry-After', String(resetSeconds));
        return next(new AppError(message, 429, errorCodes.SYSTEM.RATE_LIMIT_EXCEEDED));
      }

      next();
    } catch (error) {
      // Fail open
      console.error('Rate limiter error:', error);
      next();
    }
  };
}

// Default rate limiter
const rateLimiter = createRateLimiter();

// Stricter rate limiter for auth endpoints
const authRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: config.rateLimit.authMaxRequests,
  message: 'Too many authentication attempts, please try again later',
  keyGenerator: (req) => {
    const identifier = req.body?.phone || req.body?.email || req.ip;
    return `auth:${identifier}`;
  },
});

const webhookRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 300,
  message: 'Too many webhook requests, please try again later',
  keyGenerator: (req) => `webhook:${req.ip || req.headers['x-forwarded-for'] || 'unknown'}`,
});

module.exports = {
  rateLimiter,
  authRateLimiter,
  webhookRateLimiter,
  createRateLimiter,
};
