'use strict';

const { AppError } = require('../errors/app-error');
const errorCodes = require('../errors/error-codes');

/**
 * In-memory store for rate limiting
 * In production, use Redis for distributed rate limiting
 */
const memoryStore = new Map();

/**
 * Clean up expired entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of memoryStore.entries()) {
    if (value.resetTime < now) {
      memoryStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

/**
 * Create a rate limiter with custom options
 *
 * @param {Object} options - Rate limiter options
 * @param {number} [options.windowMs=60000] - Time window in milliseconds
 * @param {number} [options.max=100] - Maximum requests per window
 * @param {Function} [options.keyGenerator] - Function to generate rate limit key
 * @param {string} [options.message] - Error message
 * @param {boolean} [options.skipFailedRequests=false] - Don't count failed requests
 * @param {Function} [options.skip] - Function to skip rate limiting for certain requests
 * @param {Object} [options.store] - Custom store (must implement get/set/increment)
 * @returns {import('express').RequestHandler}
 */
function createRateLimiter(options = {}) {
  const {
    windowMs = 60000,
    max = 100,
    keyGenerator = (req) => req.ip || req.headers['x-forwarded-for'] || 'unknown',
    message = 'Too many requests, please try again later',
    skipFailedRequests = false,
    skip = () => false,
    store = null,
  } = options;

  // Use provided store or memory store
  const rateLimitStore = store || {
    get: (key) => memoryStore.get(key),
    set: (key, value) => memoryStore.set(key, value),
    increment: (key) => {
      const data = memoryStore.get(key);
      if (data) {
        data.count++;
        return data.count;
      }
      return 1;
    },
  };

  return async (req, res, next) => {
    // Skip if configured
    if (skip(req)) {
      return next();
    }

    const key = `ratelimit:${keyGenerator(req)}`;
    const now = Date.now();

    try {
      let data = rateLimitStore.get(key);

      if (!data || data.resetTime < now) {
        // Create new window
        data = {
          count: 1,
          resetTime: now + windowMs,
        };
        rateLimitStore.set(key, data);
      } else {
        // Increment counter
        data.count = rateLimitStore.increment(key);
      }

      // Set rate limit headers
      const remaining = Math.max(0, max - data.count);
      const resetSeconds = Math.ceil((data.resetTime - now) / 1000);

      res.setHeader('X-RateLimit-Limit', String(max));
      res.setHeader('X-RateLimit-Remaining', String(remaining));
      res.setHeader('X-RateLimit-Reset', String(Math.ceil(data.resetTime / 1000)));

      // Check if limit exceeded
      if (data.count > max) {
        res.setHeader('Retry-After', String(resetSeconds));
        return next(new AppError(message, 429, errorCodes.SYSTEM.RATE_LIMIT_EXCEEDED));
      }

      // Track response for skipFailedRequests
      if (skipFailedRequests) {
        res.on('finish', () => {
          if (res.statusCode >= 400) {
            // Decrement count for failed requests
            const currentData = rateLimitStore.get(key);
            if (currentData && currentData.count > 0) {
              currentData.count--;
            }
          }
        });
      }

      next();
    } catch (error) {
      // Fail open - don't block requests if rate limiting fails
      console.error('Rate limiter error:', error);
      next();
    }
  };
}

/**
 * Default rate limiter with standard configuration
 */
const rateLimiter = createRateLimiter({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
});

/**
 * Stricter rate limiter for auth endpoints
 */
const authRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS, 10) || 10,
  message: 'Too many authentication attempts, please try again later',
  keyGenerator: (req) => {
    // Rate limit by phone/email for auth endpoints
    const identifier = req.body?.phone || req.body?.email || req.ip;
    return `auth:${identifier}`;
  },
});

module.exports = {
  rateLimiter,
  authRateLimiter,
  createRateLimiter,
};
