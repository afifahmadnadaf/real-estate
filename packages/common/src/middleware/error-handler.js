'use strict';

const { AppError } = require('../errors/app-error');
const errorCodes = require('../errors/error-codes');
const logger = require('../utils/logger');

/**
 * Express error handling middleware
 * Handles both operational errors (AppError) and unexpected errors
 *
 * @param {Error} err - The error object
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} _next - Express next function
 */
function errorHandler(err, req, res, _next) {
  // Get trace ID from request
  const traceId = req.traceId || req.headers['x-request-id'] || 'unknown';

  // Determine if it's an operational error
  if (err instanceof AppError) {
    // Log operational errors at warn level
    logger.warn({
      type: 'operational_error',
      code: err.code,
      message: err.message,
      statusCode: err.statusCode,
      traceId,
      path: req.path,
      method: req.method,
      details: err.details,
    });

    // Handle rate limit errors with Retry-After header
    if (err.retryAfter) {
      res.set('Retry-After', String(err.retryAfter));
    }

    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        traceId,
      },
    });
  }

  // Handle Joi/Zod validation errors
  if (err.name === 'ValidationError' || err.isJoi) {
    const details = err.details?.map((d) => ({
      field: d.path?.join('.') || d.context?.key,
      message: d.message,
    }));

    logger.warn({
      type: 'validation_error',
      message: 'Request validation failed',
      traceId,
      path: req.path,
      method: req.method,
      details,
    });

    return res.status(400).json({
      error: {
        code: errorCodes.VALIDATION.VALIDATION_ERROR,
        message: 'Validation failed',
        details,
        traceId,
      },
    });
  }

  // Handle Zod errors
  if (err.name === 'ZodError') {
    const details = err.errors?.map((e) => ({
      field: e.path?.join('.'),
      message: e.message,
    }));

    logger.warn({
      type: 'validation_error',
      message: 'Request validation failed',
      traceId,
      path: req.path,
      method: req.method,
      details,
    });

    return res.status(400).json({
      error: {
        code: errorCodes.VALIDATION.VALIDATION_ERROR,
        message: 'Validation failed',
        details,
        traceId,
      },
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: {
        code: errorCodes.AUTH.TOKEN_INVALID,
        message: 'Invalid token',
        traceId,
      },
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: {
        code: errorCodes.AUTH.TOKEN_EXPIRED,
        message: 'Token expired',
        traceId,
      },
    });
  }

  // Handle MongoDB duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      error: {
        code: errorCodes.RESOURCE.DUPLICATE_ENTRY,
        message: `Duplicate value for ${field}`,
        traceId,
      },
    });
  }

  // Log unexpected errors at error level
  logger.error({
    type: 'unexpected_error',
    message: err.message,
    stack: err.stack,
    traceId,
    path: req.path,
    method: req.method,
  });

  // Don't expose internal errors in production
  const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;

  return res.status(500).json({
    error: {
      code: errorCodes.SYSTEM.INTERNAL_ERROR,
      message,
      traceId,
    },
  });
}

/**
 * 404 Not Found handler
 * Should be placed after all routes
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
function notFoundHandler(req, res) {
  const traceId = req.traceId || req.headers['x-request-id'] || 'unknown';

  res.status(404).json({
    error: {
      code: errorCodes.RESOURCE.NOT_FOUND,
      message: `Route ${req.method} ${req.path} not found`,
      traceId,
    },
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
