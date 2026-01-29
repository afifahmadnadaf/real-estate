'use strict';

const pino = require('pino');

/**
 * Create a logger instance with service context
 * @param {Object} options - Logger options
 * @param {string} options.service - Service name
 * @param {string} [options.level] - Log level
 * @returns {pino.Logger}
 */
function createLogger(options = {}) {
  const { service = 'unknown', level = process.env.LOG_LEVEL || 'info' } = options;

  return pino({
    name: service,
    level,
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label }),
    },
    base: {
      service,
      env: process.env.NODE_ENV || 'development',
    },
    // In production, use JSON format; in development, use pretty printing
    ...(process.env.NODE_ENV !== 'production' && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
    }),
  });
}

/**
 * Express middleware for request logging
 * Logs request start and completion with timing information
 *
 * @param {Object} options - Middleware options
 * @param {pino.Logger} [options.logger] - Pino logger instance
 * @param {string[]} [options.ignorePaths] - Paths to skip logging
 * @returns {import('express').RequestHandler}
 */
function requestLogger(options = {}) {
  const {
    logger = createLogger({ service: 'api' }),
    ignorePaths = ['/health', '/ready', '/metrics'],
  } = options;

  return (req, res, next) => {
    // Skip logging for ignored paths
    if (ignorePaths.some((path) => req.path.startsWith(path))) {
      return next();
    }

    const startTime = process.hrtime.bigint();
    const traceId = req.traceId || req.headers['x-request-id'] || 'unknown';

    // Log request start
    logger.info({
      type: 'request_start',
      traceId,
      method: req.method,
      path: req.path,
      query: req.query,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userId: req.user?.id,
    });

    // Log response when finished
    res.on('finish', () => {
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1_000_000;

      const logData = {
        type: 'request_complete',
        traceId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: Math.round(durationMs * 100) / 100,
        contentLength: res.get('content-length'),
        userId: req.user?.id,
      };

      // Log at appropriate level based on status code
      if (res.statusCode >= 500) {
        logger.error(logData);
      } else if (res.statusCode >= 400) {
        logger.warn(logData);
      } else {
        logger.info(logData);
      }
    });

    next();
  };
}

module.exports = {
  requestLogger,
  createLogger,
};
